export interface PatternMatch {
  type: 'regex';
  pattern: RegExp;
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

export interface GravityRule {
  id: string;
  name: string;
  category: 'api-alignment' | 'reactivity' | 'template' | 'styles' | 'performance';
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  detect: {
    filePatterns: string[];
    patterns: PatternMatch[];
    astCheck?: (content: string) => Finding[];
  };
  fix: {
    message: string;
    suggestion: string;
    docsUrl?: string;
  };
  markdown: {
    description: string;
    wrongExample: string;
    correctExample: string;
  };
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
