#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GravityEngine } from './engine/scanner.js';
import { formatTerminalReport, formatJsonReport } from './engine/reporter.js';
import { createDefaultRegistry } from './rules/index.js';
import { loadConfig } from './config.js';
import { generateSkillsMarkdown } from './skills-generator.js';
import type { GravityConfig, ScanReport } from './rules/types.js';
import pc from 'picocolors';

const program = new Command();

program
  .name('vue-gravity')
  .description('Vue code hallucination detector — catches AI-generated anti-patterns')
  .version('1.0.0');

program
  .command('check')
  .description('Scan project for AI hallucination patterns')
  .option('-r, --report', 'Generate report file')
  .option('-f, --fix', 'Auto-fix fixable issues')
  .option('-d, --dir <path>', 'Scan specific directory')
  .option('--format <type>', 'Report format: json | html', 'json')
  .option('--ci', 'CI mode: exit code 1 on errors, machine-readable output')
  .action(async (options) => {
    const projectRoot = resolve(options.dir || process.cwd());
    const config = await loadConfig(projectRoot);
    const registry = createDefaultRegistry(config);
    const engine = new GravityEngine(registry);

    const files = collectFiles(projectRoot, config.ignore || []);
    const start = Date.now();

    const allFindings: ScanReport['findings'] = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const relativePath = relative(projectRoot, file);
      const findings = engine.scan(relativePath, content);
      allFindings.push(...findings);
    }

    const duration = Date.now() - start;
    const report: ScanReport = {
      timestamp: new Date().toISOString(),
      scannedFiles: files.length,
      duration: `${(duration / 1000).toFixed(1)}s`,
      summary: {
        errors: allFindings.filter(f => f.severity === 'error').length,
        warnings: allFindings.filter(f => f.severity === 'warning').length,
        infos: allFindings.filter(f => f.severity === 'info').length,
      },
      findings: allFindings,
    };

    console.log(formatTerminalReport(report));

    if (options.report) {
      const reportPath = join(projectRoot, `gravity-report.${options.format}`);
      const content = formatJsonReport(report);
      writeFileSync(reportPath, content, 'utf-8');
      console.log(pc.dim(`\n  Report saved to ${reportPath}`));
    }

    if (options.ci && report.summary.errors > 0) {
      console.log(pc.red(`\n  CI: ${report.summary.errors} errors found`));
      process.exit(1);
    }

    process.exit(report.summary.errors > 0 ? 1 : 0);
  });

program
  .command('generate-skills')
  .description('Generate skills markdown document for AI tools')
  .option('-o, --output <path>', 'Output file path')
  .action(async (options) => {
    const config = await loadConfig(process.cwd());
    const registry = createDefaultRegistry(config);
    const markdown = generateSkillsMarkdown(registry);

    if (options.output) {
      writeFileSync(options.output, markdown, 'utf-8');
      console.log(pc.green(`  Skills document saved to ${options.output}`));
    } else {
      console.log(markdown);
    }
  });

function collectFiles(dir: string, ignore: string[]): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
      if (ignore.some(pattern => fullPath.includes(pattern))) continue;
      files.push(...collectFiles(fullPath, ignore));
    } else if (entry.endsWith('.vue') || entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Only parse CLI args when executed directly, not when imported (e.g. in tests)
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && (process.argv[1] === __filename || process.argv[1].endsWith('cli.ts'))) {
  program.parse();
}

export { program, collectFiles };
