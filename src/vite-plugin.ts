import type { Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { GravityEngine } from './engine/scanner.js';
import { formatTerminalReport } from './engine/reporter.js';
import { createDefaultRegistry } from './rules/index.js';
import { loadConfig } from './config.js';
import type { GravityConfig, ScanReport } from './rules/types.js';

export interface GravityPluginOptions {
  config?: GravityConfig;
  /** Disable the plugin entirely */
  disabled?: boolean;
}

export default function vueGravityEngine(options?: GravityPluginOptions): Plugin {
  let engine: GravityEngine;
  let projectRoot: string;

  return {
    name: 'vue-gravity-engine',

    async configResolved(config) {
      projectRoot = config.root;
      const userConfig = options?.config ?? (await loadConfig(projectRoot));
      const registry = createDefaultRegistry(userConfig);
      engine = new GravityEngine(registry);
    },

    handleHotUpdate({ file, server }) {
      if (options?.disabled) return;
      if (!file.endsWith('.vue') && !file.endsWith('.ts') && !file.endsWith('.tsx')) return;

      const relativePath = relative(projectRoot, file);
      const code = readFileSync(file, 'utf-8');
      const findings = engine.scan(relativePath, code);

      if (findings.length === 0) return;

      const errors = findings.filter(f => f.severity === 'error');
      const warnings = findings.filter(f => f.severity === 'warning');
      const infos = findings.filter(f => f.severity === 'info');

      // Errors: block HMR, send to browser overlay
      if (errors.length > 0) {
        const report: ScanReport = {
          timestamp: new Date().toISOString(),
          scannedFiles: 1,
          duration: '0ms',
          summary: { errors: errors.length, warnings: warnings.length, infos: infos.length },
          findings: errors,
        };
        server.ws.send('gravity:error', {
          message: formatTerminalReport(report),
          errors: errors.map(e => ({
            file: e.file,
            line: e.line,
            message: e.message,
            suggestion: e.suggestion,
          })),
        });
        // Block HMR update
        return [];
      }

      // Warnings/infos: log to terminal only
      if (warnings.length > 0 || infos.length > 0) {
        const report: ScanReport = {
          timestamp: new Date().toISOString(),
          scannedFiles: 1,
          duration: '0ms',
          summary: { errors: 0, warnings: warnings.length, infos: infos.length },
          findings: [...warnings, ...infos],
        };
        server.config.logger.warn(formatTerminalReport(report));
      }
    },

    buildEnd() {
      if (options?.disabled) return;
      // Build-time scan is handled by the CLI or build hook
    },
  };
}
