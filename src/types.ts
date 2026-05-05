export interface GravityRule {
  id: string;
  name: string;
  category: 'api-alignment' | 'reactivity' | 'template' | 'styles' | 'performance';
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  filePatterns: string[];
  patterns: RegExp[];
  message: string;
  suggestion: string;
  docsUrl?: string;
}

export interface Finding {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  file: string;
  line: number;
  column: number;
  message: string;
  suggestion: string;
  docsUrl?: string;
  fixable: boolean;
  matchedText: string;
}

export interface RuleOverride {
  enabled?: boolean;
  severity?: 'error' | 'warning' | 'info';
}

export interface GravityConfig {
  rules?: Record<string, RuleOverride>;
  ignore?: string[];
}

export interface ScanReport {
  timestamp: string;
  scannedFiles: number;
  duration: string;
  summary: { errors: number; warnings: number; infos: number };
  findings: Finding[];
}
