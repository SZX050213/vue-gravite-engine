import { GravityRegistry } from '../rules/registry.js';
import type { GravityRule, Finding, ScanReport } from '../rules/types.js';
import { minimatch } from 'minimatch';

export class GravityEngine {
  constructor(private registry: GravityRegistry) {}

  scan(filePath: string, code: string): Finding[] {
    const findings: Finding[] = [];
    const rules = this.registry.getRules();

    for (const rule of rules) {
      if (!this.matchesFilePattern(filePath, rule.detect.filePatterns)) continue;
      const regexFindings = this.regexScan(filePath, code, rule);
      findings.push(...regexFindings);
    }

    return this.deduplicate(findings);
  }

  async scanProject(
    projectRoot: string,
    files: Array<{ path: string; content: string }>
  ): Promise<ScanReport> {
    const start = Date.now();
    const allFindings: Finding[] = [];

    for (const file of files) {
      const findings = this.scan(file.path, file.content);
      allFindings.push(...findings);
    }

    const duration = Date.now() - start;
    return {
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
  }

  private matchesFilePattern(filePath: string, patterns: string[]): boolean {
    return patterns.some(pattern => minimatch(filePath, pattern));
  }

  private regexScan(filePath: string, code: string, rule: GravityRule): Finding[] {
    const findings: Finding[] = [];
    const lines = code.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];

      // Skip comment lines
      if (this.isCommentLine(line)) continue;

      for (const pattern of rule.detect.patterns) {
        if (pattern.type !== 'regex') continue;

        // Ensure global flag for iterative matching
        const flags = pattern.pattern.flags.includes('g')
          ? pattern.pattern.flags
          : pattern.pattern.flags + 'g';
        const regex = new RegExp(pattern.pattern.source, flags);
        let match: RegExpExecArray | null;

        while ((match = regex.exec(line)) !== null) {
          // Skip if match is inside a string literal
          if (this.isInsideString(line, match.index)) continue;

          findings.push({
            ruleId: rule.id,
            severity: rule.severity,
            file: filePath,
            line: lineIndex + 1,
            column: match.index + 1,
            message: rule.fix.message,
            suggestion: rule.fix.suggestion,
            docsUrl: rule.fix.docsUrl,
            fixable: true,
            matchedText: match[0],
          });

          // Prevent infinite loops with zero-length matches
          if (match[0].length === 0) break;
        }
      }
    }

    return findings;
  }

  private isCommentLine(line: string): boolean {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('<!--')
    );
  }

  private isInsideString(line: string, index: number): boolean {
    let inSingle = false;
    let inDouble = false;
    let inTemplate = false;

    for (let i = 0; i < index; i++) {
      const ch = line[i];
      const prev = i > 0 ? line[i - 1] : '';

      if (ch === "'" && prev !== '\\' && !inDouble && !inTemplate) inSingle = !inSingle;
      if (ch === '"' && prev !== '\\' && !inSingle && !inTemplate) inDouble = !inDouble;
      if (ch === '`' && prev !== '\\' && !inSingle && !inDouble) inTemplate = !inTemplate;
    }

    return inSingle || inDouble || inTemplate;
  }

  private deduplicate(findings: Finding[]): Finding[] {
    const seen = new Set<string>();
    return findings.filter(f => {
      const key = `${f.ruleId}:${f.file}:${f.line}:${f.column}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
