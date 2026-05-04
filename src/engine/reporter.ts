import type { ScanReport, Finding } from '../rules/types.js';
import pc from 'picocolors';

export function formatTerminalReport(report: ScanReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(pc.bold('⚡ vue-gravity-engine'));
  lines.push('');

  if (report.findings.length === 0) {
    lines.push(pc.green('  No issues found.'));
    lines.push('');
    return lines.join('\n');
  }

  lines.push(`  Scanned: ${report.scannedFiles} files in ${report.duration}`);
  lines.push('');

  // Group by severity
  const errors = report.findings.filter(f => f.severity === 'error');
  const warnings = report.findings.filter(f => f.severity === 'warning');
  const infos = report.findings.filter(f => f.severity === 'info');

  if (errors.length > 0) {
    lines.push(pc.red(pc.bold(`  ❌ Errors (${errors.length})`)));
    for (const f of errors) lines.push(formatFinding(f));
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push(pc.yellow(pc.bold(`  ⚠️  Warnings (${warnings.length})`)));
    for (const f of warnings) lines.push(formatFinding(f));
    lines.push('');
  }

  if (infos.length > 0) {
    lines.push(pc.dim(pc.bold(`  ℹ️  Info (${infos.length})`)));
    for (const f of infos) lines.push(formatFinding(f));
    lines.push('');
  }

  return lines.join('\n');
}

function formatFinding(f: Finding): string {
  const severityColor = f.severity === 'error' ? pc.red : f.severity === 'warning' ? pc.yellow : pc.dim;
  const location = `${pc.dim(`${f.file}:${f.line}:${f.column}`)}`;
  const severity = severityColor(f.severity.padEnd(7));
  const suggestion = f.suggestion ? pc.dim(`    Fix: ${f.suggestion}`) : '';
  const docs = f.docsUrl ? pc.dim(`    See: ${f.docsUrl}`) : '';

  return `  ${location}\n  ${severity} ${f.message}\n${suggestion}\n${docs}`;
}

export function formatJsonReport(report: ScanReport): string {
  return JSON.stringify(report, null, 2);
}
