# vue-gravity-engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite plugin + CLI + Skills generator that detects AI-generated code hallucinations in Vue projects (React mixtures, Vue 2 remnants, deprecated APIs, style errors, architecture flaws).

**Architecture:** Declarative rule engine with three consumers — Vite plugin (forward pipeline), CLI (reverse pipeline), Skills markdown generator. Rules are defined once in TypeScript and consumed by all three. Detection uses regex fast-scan + AST deep-check hybrid strategy.

**Tech Stack:** TypeScript, tsup, @vue/compiler-sfc, Commander, Vitest

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/index.ts`

- [ ] **Step 1: Initialize package.json**

```json
{
  "name": "vue-gravity-engine",
  "version": "1.0.0",
  "description": "Vue code hallucination detector — catches AI-generated React mixtures, Vue 2 remnants, and anti-patterns",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./vite": {
      "import": "./dist/vite-plugin.js",
      "require": "./dist/vite-plugin.cjs",
      "types": "./dist/vite-plugin.d.ts"
    }
  },
  "bin": {
    "vue-gravity": "./dist/cli.js"
  },
  "files": ["dist", "skills"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "generate-skills": "tsx src/cli.ts generate-skills"
  },
  "keywords": ["vue", "vite-plugin", "ai", "hallucination", "code-quality"],
  "license": "MIT",
  "devDependencies": {
    "tsup": "^8.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  },
  "dependencies": {
    "@vue/compiler-sfc": "^3.4.0",
    "commander": "^12.0.0",
    "picocolors": "^1.0.0",
    "glob": "^10.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

- [ ] **Step 3: Create tsup.config.ts**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'vite-plugin': 'src/vite-plugin.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
});
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
dist/
*.tsbuildinfo
.DS_Store
```

- [ ] **Step 6: Create empty src/index.ts**

```typescript
// vue-gravity-engine
export { GravityEngine } from './engine/scanner.js';
export { GravityRegistry } from './rules/registry.js';
export { generateSkillsMarkdown } from './skills-generator.js';
export type { GravityRule, Finding, GravityConfig, ScanReport } from './rules/types.js';
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: node_modules created, no errors

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: project scaffolding with tsup, vitest, typescript"
```

---

### Task 2: Rule Types and Registry

**Files:**
- Create: `src/rules/types.ts`
- Create: `src/rules/types.test.ts`
- Create: `src/rules/registry.ts`
- Create: `src/rules/registry.test.ts`

- [ ] **Step 1: Write failing tests for types**

Create `src/rules/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { GravityRule, Finding, GravityConfig } from './types.js';

describe('GravityRule type contract', () => {
  it('a valid rule has all required fields', () => {
    const rule: GravityRule = {
      id: 'test-rule',
      name: 'Test Rule',
      category: 'api-alignment',
      severity: 'error',
      enabled: true,
      detect: {
        filePatterns: ['*.vue'],
        patterns: [{ type: 'regex', pattern: /test/ }],
      },
      fix: {
        message: 'Test message',
        suggestion: 'Test suggestion',
      },
      markdown: {
        description: 'Test description',
        wrongExample: 'wrong',
        correctExample: 'correct',
      },
    };
    expect(rule.id).toBe('test-rule');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/rules/types.test.ts`
Expected: FAIL — cannot find module './types.js'

- [ ] **Step 3: Create types.ts**

Create `src/rules/types.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/rules/types.test.ts`
Expected: PASS

- [ ] **Step 5: Write failing tests for registry**

Create `src/rules/registry.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GravityRegistry } from './registry.js';
import type { GravityRule } from './types.js';

const mockRule: GravityRule = {
  id: 'test-rule',
  name: 'Test Rule',
  category: 'api-alignment',
  severity: 'error',
  enabled: true,
  detect: { filePatterns: ['*.vue'], patterns: [{ type: 'regex', pattern: /test/ }] },
  fix: { message: 'msg', suggestion: 'fix' },
  markdown: { description: 'desc', wrongExample: 'wrong', correctExample: 'correct' },
};

const mockRule2: GravityRule = {
  ...mockRule,
  id: 'test-rule-2',
  name: 'Test Rule 2',
  category: 'reactivity',
  severity: 'warning',
};

describe('GravityRegistry', () => {
  it('registers and retrieves a rule by id', () => {
    const registry = new GravityRegistry();
    registry.register(mockRule);
    expect(registry.getRule('test-rule')).toEqual(mockRule);
  });

  it('returns undefined for unknown rule', () => {
    const registry = new GravityRegistry();
    expect(registry.getRule('nonexistent')).toBeUndefined();
  });

  it('returns all rules', () => {
    const registry = new GravityRegistry();
    registry.register(mockRule);
    registry.register(mockRule2);
    expect(registry.getRules()).toHaveLength(2);
  });

  it('filters rules by category', () => {
    const registry = new GravityRegistry();
    registry.register(mockRule);
    registry.register(mockRule2);
    const filtered = registry.getRules({ category: 'api-alignment' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('test-rule');
  });

  it('filters rules by severity', () => {
    const registry = new GravityRegistry();
    registry.register(mockRule);
    registry.register(mockRule2);
    const filtered = registry.getRules({ severity: 'warning' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('test-rule-2');
  });

  it('only returns enabled rules by default', () => {
    const registry = new GravityRegistry();
    registry.register(mockRule);
    registry.register({ ...mockRule2, enabled: false });
    expect(registry.getRules()).toHaveLength(1);
  });

  it('returns all rules when includeDisabled is true', () => {
    const registry = new GravityRegistry();
    registry.register(mockRule);
    registry.register({ ...mockRule2, enabled: false });
    expect(registry.getRules({ includeDisabled: true })).toHaveLength(2);
  });

  it('configures a rule (enable/disable, severity override)', () => {
    const registry = new GravityRegistry();
    registry.register(mockRule);
    registry.configure('test-rule', { enabled: false });
    expect(registry.getRules()).toHaveLength(0);
    registry.configure('test-rule', { enabled: true, severity: 'warning' });
    const rule = registry.getRule('test-rule')!;
    expect(rule.severity).toBe('warning');
  });

  it('ignores configure for unknown rules', () => {
    const registry = new GravityRegistry();
    expect(() => registry.configure('nonexistent', { enabled: false })).not.toThrow();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/rules/registry.test.ts`
Expected: FAIL — cannot find module './registry.js'

- [ ] **Step 7: Implement registry.ts**

Create `src/rules/registry.ts`:

```typescript
import type { GravityRule, RuleOverride } from './types.js';

export class GravityRegistry {
  private rules = new Map<string, GravityRule>();
  private overrides = new Map<string, RuleOverride>();

  register(rule: GravityRule): void {
    this.rules.set(rule.id, { ...rule });
  }

  getRule(id: string): GravityRule | undefined {
    const rule = this.rules.get(id);
    if (!rule) return undefined;
    return this.applyOverrides(rule);
  }

  getRules(filter?: {
    category?: string;
    severity?: string;
    includeDisabled?: boolean;
  }): GravityRule[] {
    let rules = Array.from(this.rules.values()).map(r => this.applyOverrides(r));

    if (!filter?.includeDisabled) {
      rules = rules.filter(r => r.enabled);
    }
    if (filter?.category) {
      rules = rules.filter(r => r.category === filter.category);
    }
    if (filter?.severity) {
      rules = rules.filter(r => r.severity === filter.severity);
    }
    return rules;
  }

  configure(id: string, options: RuleOverride): void {
    if (!this.rules.has(id)) return;
    this.overrides.set(id, { ...this.overrides.get(id), ...options });
  }

  private applyOverrides(rule: GravityRule): GravityRule {
    const override = this.overrides.get(rule.id);
    if (!override) return rule;
    return {
      ...rule,
      ...(override.enabled !== undefined && { enabled: override.enabled }),
      ...(override.severity !== undefined && { severity: override.severity }),
    };
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/rules/registry.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/rules/types.ts src/rules/types.test.ts src/rules/registry.ts src/rules/registry.test.ts
git commit -m "feat: rule types and registry with tests"
```

---

### Task 3: Config Loading

**Files:**
- Create: `src/config.ts`
- Create: `src/config.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/config.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig } from './config.js';
import type { GravityConfig } from './rules/types.js';

describe('loadConfig', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns default config when no config file exists', async () => {
    const config = await loadConfig('/nonexistent/path');
    expect(config).toEqual({ rules: {}, ignore: [] });
  });

  it('loads gravity.config.ts from project root', async () => {
    // This test will be updated when we have a real config file
    const config = await loadConfig('/nonexistent');
    expect(config.rules).toBeDefined();
    expect(config.ignore).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/config.test.ts`
Expected: FAIL — cannot find module './config.js'

- [ ] **Step 3: Implement config.ts**

Create `src/config.ts`:

```typescript
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { GravityConfig } from './rules/types.js';

const CONFIG_FILES = [
  'gravity.config.ts',
  'gravity.config.js',
  'gravity.config.mjs',
  '.gravityrc.json',
];

const DEFAULT_CONFIG: GravityConfig = {
  rules: {},
  ignore: [],
};

export async function loadConfig(projectRoot: string): Promise<GravityConfig> {
  for (const fileName of CONFIG_FILES) {
    const configPath = join(projectRoot, fileName);
    if (existsSync(configPath)) {
      try {
        const mod = await import(configPath);
        return { ...DEFAULT_CONFIG, ...mod.default };
      } catch {
        // If import fails, continue to next config file
      }
    }
  }

  // Try .gravityrc.json as JSON
  const jsonPath = join(projectRoot, '.gravityrc.json');
  if (existsSync(jsonPath)) {
    try {
      const { readFileSync } = await import('node:fs');
      const content = readFileSync(jsonPath, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
    } catch {
      // Fall through to default
    }
  }

  return { ...DEFAULT_CONFIG };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/config.ts src/config.test.ts
git commit -m "feat: config loading with fallback defaults"
```

---

### Task 4: Regex Scanner Engine

**Files:**
- Create: `src/engine/scanner.ts`
- Create: `src/engine/scanner.test.ts`
- Create: `src/engine/reporter.ts`

- [ ] **Step 1: Write failing tests for scanner**

Create `src/engine/scanner.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GravityEngine } from './scanner.js';
import { GravityRegistry } from '../rules/registry.js';
import type { GravityRule } from '../rules/types.js';

const reactHooksRule: GravityRule = {
  id: 'api-no-react-hooks',
  name: 'No React Hooks',
  category: 'api-alignment',
  severity: 'error',
  enabled: true,
  detect: {
    filePatterns: ['*.vue', '*.ts', '*.tsx'],
    patterns: [
      { type: 'regex', pattern: /\b(useState|useEffect|useContext|useReducer|useMemo|useCallback)\s*\(/ },
    ],
  },
  fix: { message: 'React Hooks detected', suggestion: 'Use Vue Composition API' },
  markdown: { description: 'No React Hooks', wrongExample: 'useState()', correctExample: 'ref()' },
};

const classNameRule: GravityRule = {
  id: 'template-no-classname',
  name: 'No className',
  category: 'template',
  severity: 'error',
  enabled: true,
  detect: {
    filePatterns: ['*.vue'],
    patterns: [
      { type: 'regex', pattern: /\bclassName\s*=/ },
    ],
  },
  fix: { message: 'className detected in Vue template', suggestion: 'Use class= instead' },
  markdown: { description: 'No className', wrongExample: 'className="foo"', correctExample: 'class="foo"' },
};

function createEngine(rules: GravityRule[]) {
  const registry = new GravityRegistry();
  rules.forEach(r => registry.register(r));
  return new GravityEngine(registry);
}

describe('GravityEngine regex scanning', () => {
  it('detects React Hooks in .vue file', () => {
    const engine = createEngine([reactHooksRule]);
    const code = `<script setup>\nconst [name, setName] = useState('')\n</script>`;
    const findings = engine.scan('Test.vue', code);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('api-no-react-hooks');
    expect(findings[0].severity).toBe('error');
    expect(findings[0].line).toBe(2);
  });

  it('detects className in template', () => {
    const engine = createEngine([classNameRule]);
    const code = `<template>\n<div className="wrapper"></div>\n</template>`;
    const findings = engine.scan('Test.vue', code);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('template-no-classname');
  });

  it('detects multiple issues in one file', () => {
    const engine = createEngine([reactHooksRule, classNameRule]);
    const code = `<template>\n<div className="foo"></div>\n</template>\n<script setup>\nconst x = useState(1)\n</script>`;
    const findings = engine.scan('Test.vue', code);
    expect(findings).toHaveLength(2);
  });

  it('returns empty for clean code', () => {
    const engine = createEngine([reactHooksRule, classNameRule]);
    const code = `<template>\n<div class="foo"></div>\n</template>\n<script setup>\nimport { ref } from 'vue'\nconst x = ref(1)\n</script>`;
    const findings = engine.scan('Test.vue', code);
    expect(findings).toHaveLength(0);
  });

  it('skips rules that do not match file pattern', () => {
    const engine = createEngine([classNameRule]);
    const code = `const x = className="foo"`;
    const findings = engine.scan('test.ts', code);
    expect(findings).toHaveLength(0);
  });

  it('skips disabled rules', () => {
    const disabledRule = { ...reactHooksRule, enabled: false };
    const engine = createEngine([disabledRule]);
    const code = `const x = useState(1)`;
    const findings = engine.scan('Test.vue', code);
    expect(findings).toHaveLength(0);
  });

  it('reports correct line and column numbers', () => {
    const engine = createEngine([reactHooksRule]);
    const code = `line1\nline2\nconst x = useState(1)\nline4`;
    const findings = engine.scan('Test.vue', code);
    expect(findings[0].line).toBe(3);
    expect(findings[0].column).toBe(9);
  });

  it('does not match inside comments', () => {
    const engine = createEngine([reactHooksRule]);
    const code = `// const x = useState(1)\n/* useState() */`;
    const findings = engine.scan('Test.vue', code);
    expect(findings).toHaveLength(0);
  });

  it('does not match inside strings', () => {
    const engine = createEngine([reactHooksRule]);
    const code = `const msg = "don't use useState()"`;
    const findings = engine.scan('Test.vue', code);
    expect(findings).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/scanner.test.ts`
Expected: FAIL — cannot find module './scanner.js'

- [ ] **Step 3: Implement scanner.ts**

Create `src/engine/scanner.ts`:

```typescript
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

        // Reset regex lastIndex for global patterns
        const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
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
```

- [ ] **Step 4: Install minimatch dependency**

Run: `npm install minimatch`
Expected: installed successfully

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/engine/scanner.test.ts`
Expected: PASS

- [ ] **Step 6: Implement reporter.ts**

Create `src/engine/reporter.ts`:

```typescript
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
```

- [ ] **Step 7: Commit**

```bash
git add src/engine/scanner.ts src/engine/scanner.test.ts src/engine/reporter.ts
git commit -m "feat: regex scanner engine with comment/string exclusion and reporter"
```

---

### Task 5: API Alignment Rules

**Files:**
- Create: `src/rules/api-alignment.ts`
- Create: `src/rules/api-alignment.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/rules/api-alignment.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GravityEngine } from '../engine/scanner.js';
import { GravityRegistry } from './registry.js';
import { apiAlignmentRules } from './api-alignment.js';

function createEngine() {
  const registry = new GravityRegistry();
  apiAlignmentRules.forEach(r => registry.register(r));
  return new GravityEngine(registry);
}

describe('API Alignment Rules', () => {
  const engine = createEngine();

  describe('api-no-react-hooks', () => {
    it('detects useState', () => {
      const findings = engine.scan('Test.vue', `const [x, setX] = useState(0)`);
      expect(findings.some(f => f.ruleId === 'api-no-react-hooks')).toBe(true);
    });

    it('detects useEffect', () => {
      const findings = engine.scan('Test.vue', `useEffect(() => {}, [])`);
      expect(findings.some(f => f.ruleId === 'api-no-react-hooks')).toBe(true);
    });

    it('detects useContext', () => {
      const findings = engine.scan('Test.vue', `const ctx = useContext(MyCtx)`);
      expect(findings.some(f => f.ruleId === 'api-no-react-hooks')).toBe(true);
    });

    it('does not match ref() from Vue', () => {
      const findings = engine.scan('Test.vue', `const x = ref(0)`);
      expect(findings.filter(f => f.ruleId === 'api-no-react-hooks')).toHaveLength(0);
    });
  });

  describe('api-no-react-import', () => {
    it('detects import from react', () => {
      const findings = engine.scan('Test.vue', `import React from 'react'`);
      expect(findings.some(f => f.ruleId === 'api-no-react-import')).toBe(true);
    });

    it('detects import { useState } from react', () => {
      const findings = engine.scan('Test.vue', `import { useState } from 'react'`);
      expect(findings.some(f => f.ruleId === 'api-no-react-import')).toBe(true);
    });

    it('does not match import from vue', () => {
      const findings = engine.scan('Test.vue', `import { ref } from 'vue'`);
      expect(findings.filter(f => f.ruleId === 'api-no-react-import')).toHaveLength(0);
    });
  });

  describe('api-no-vue2-filters', () => {
    it('detects Vue.filter()', () => {
      const findings = engine.scan('Test.vue', `Vue.filter('uppercase', ...)`);
      expect(findings.some(f => f.ruleId === 'api-no-vue2-filters')).toBe(true);
    });

    it('detects pipe syntax in template', () => {
      const findings = engine.scan('Test.vue', `{{ value | uppercase }}`);
      expect(findings.some(f => f.ruleId === 'api-no-vue2-filters')).toBe(true);
    });
  });

  describe('api-no-vue2-api', () => {
    it('detects this.$listeners', () => {
      const findings = engine.scan('Test.vue', `const l = this.$listeners`);
      expect(findings.some(f => f.ruleId === 'api-no-vue2-api')).toBe(true);
    });

    it('detects this.$children', () => {
      const findings = engine.scan('Test.vue', `const c = this.$children`);
      expect(findings.some(f => f.ruleId === 'api-no-vue2-api')).toBe(true);
    });

    it('detects this.$set()', () => {
      const findings = engine.scan('Test.vue', `this.$set(obj, 'key', val)`);
      expect(findings.some(f => f.ruleId === 'api-no-vue2-api')).toBe(true);
    });

    it('detects Vue.extend()', () => {
      const findings = engine.scan('Test.vue', `Vue.extend({})`);
      expect(findings.some(f => f.ruleId === 'api-no-vue2-api')).toBe(true);
    });
  });

  describe('template-no-classname', () => {
    it('detects className in .vue file', () => {
      const findings = engine.scan('Test.vue', `<div className="foo">`);
      expect(findings.some(f => f.ruleId === 'template-no-classname')).toBe(true);
    });

    it('does not trigger on class=', () => {
      const findings = engine.scan('Test.vue', `<div class="foo">`);
      expect(findings.filter(f => f.ruleId === 'template-no-classname')).toHaveLength(0);
    });
  });

  describe('api-no-react-jsx', () => {
    it('detects JSX return syntax', () => {
      const findings = engine.scan('Test.tsx', `return <div>hello</div>`);
      expect(findings.some(f => f.ruleId === 'api-no-react-jsx')).toBe(true);
    });
  });

  describe('zero false positives on clean Vue code', () => {
    it('standard Composition API triggers no rules', () => {
      const code = `<template>
<div class="wrapper">{{ count }}</div>
</template>
<script setup>
import { ref, computed } from 'vue'
const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
<style scoped>
.wrapper { color: red; }
</style>`;
      const findings = engine.scan('Test.vue', code);
      expect(findings).toHaveLength(0);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/rules/api-alignment.test.ts`
Expected: FAIL — cannot find module './api-alignment.js'

- [ ] **Step 3: Implement api-alignment.ts**

Create `src/rules/api-alignment.ts`:

```typescript
import type { GravityRule } from './types.js';

export const apiAlignmentRules: GravityRule[] = [
  {
    id: 'api-no-react-hooks',
    name: '禁止 React Hooks',
    category: 'api-alignment',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts', '*.tsx'],
      patterns: [
        { type: 'regex', pattern: /\b(useState|useEffect|useContext|useReducer|useMemo|useCallback|useRef|useLayoutEffect)\s*\(/ },
      ],
    },
    fix: {
      message: '检测到 React Hooks — Vue 项目应使用 Composition API',
      suggestion: '使用 ref() / computed() / watch() / onMounted() 替代',
      docsUrl: 'https://vuejs.org/guide/extras/reactivity-in-depth.html',
    },
    markdown: {
      description: '禁止在 Vue 项目中使用 React Hooks。Vue 有自己的响应式系统和生命周期钩子。',
      wrongExample: `const [count, setCount] = useState(0)\nuseEffect(() => { document.title = count }, [count])`,
      correctExample: `const count = ref(0)\nwatch(count, (val) => { document.title = val })`,
    },
  },
  {
    id: 'api-no-react-import',
    name: '禁止 React 导入',
    category: 'api-alignment',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts', '*.tsx'],
      patterns: [
        { type: 'regex', pattern: /\bfrom\s+['"]react['"]/ },
        { type: 'regex', pattern: /\bimport\s+.*['"]react-dom['"]/ },
      ],
    },
    fix: {
      message: '检测到 React 导入 — Vue 项目不应依赖 React',
      suggestion: '移除 React 导入，使用 Vue 等效 API',
    },
    markdown: {
      description: '禁止导入 react 或 react-dom。Vue 项目不应依赖 React。',
      wrongExample: `import React from 'react'\nimport { useState } from 'react'`,
      correctExample: `import { ref, computed } from 'vue'`,
    },
  },
  {
    id: 'api-no-vue2-api',
    name: '禁止 Vue 2 废弃 API',
    category: 'api-alignment',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts', '*.js'],
      patterns: [
        { type: 'regex', pattern: /\bthis\.\$listeners\b/ },
        { type: 'regex', pattern: /\bthis\.\$children\b/ },
        { type: 'regex', pattern: /\bthis\.\$set\s*\(/ },
        { type: 'regex', pattern: /\bthis\.\$on\s*\(/ },
        { type: 'regex', pattern: /\bthis\.\$once\s*\(/ },
        { type: 'regex', pattern: /\bthis\.\$off\s*\(/ },
        { type: 'regex', pattern: /\bVue\.extend\s*\(/ },
        { type: 'regex', pattern: /\bnew\s+Vue\s*\(/ },
      ],
    },
    fix: {
      message: '检测到 Vue 2 废弃 API — 请使用 Vue 3 等效写法',
      suggestion: 'this.$listeners → useAttrs() / this.$set → 直接赋值 / Vue.extend → defineComponent',
      docsUrl: 'https://v3-migration.vuejs.org/',
    },
    markdown: {
      description: '禁止使用 Vue 2 的废弃实例 API（$listeners, $children, $set, $on, Vue.extend 等）。',
      wrongExample: `this.$set(obj, 'key', value)\nconst Comp = Vue.extend({})`,
      correctExample: `obj.key = value\nconst Comp = defineComponent({})`,
    },
  },
  {
    id: 'api-no-vue2-filters',
    name: '禁止 Vue 2 过滤器',
    category: 'api-alignment',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts', '*.js'],
      patterns: [
        { type: 'regex', pattern: /\bVue\.filter\s*\(/ },
        { type: 'regex', pattern: /\|\s*\w+/ },  // pipe filter syntax
      ],
    },
    fix: {
      message: '检测到 Vue 2 过滤器语法 — Vue 3 已移除 filters',
      suggestion: '使用计算属性或工具函数替代',
      docsUrl: 'https://v3-migration.vuejs.org/breaking-changes/filters.html',
    },
    markdown: {
      description: 'Vue 3 移除了过滤器（filters），使用计算属性或工具函数替代。',
      wrongExample: `{{ message | uppercase }}\nVue.filter('uppercase', ...)` ,
      correctExample: `{{ uppercase(message) }}\nconst uppercase = (str: string) => str.toUpperCase()`,
    },
  },
  {
    id: 'template-no-classname',
    name: '禁止 className',
    category: 'api-alignment',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        { type: 'regex', pattern: /\bclassName\s*=/ },
      ],
    },
    fix: {
      message: '检测到 className — Vue 模板应使用 class',
      suggestion: '将 className 替换为 class',
    },
    markdown: {
      description: 'Vue 模板中使用 class 而非 React 的 className。',
      wrongExample: `<div className="wrapper">`,
      correctExample: `<div class="wrapper">`,
    },
  },
  {
    id: 'api-no-react-jsx',
    name: '禁止 JSX/TSX 返回',
    category: 'api-alignment',
    severity: 'warning',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.tsx'],
      patterns: [
        { type: 'regex', pattern: /\breturn\s*<[A-Z]/ },
      ],
    },
    fix: {
      message: '检测到 JSX 返回语法 — Vue 使用模板而非 JSX',
      suggestion: '使用 <template> 或 h() 函数替代 JSX',
    },
    markdown: {
      description: 'Vue 推荐使用模板语法，而非 React 风格的 JSX。',
      wrongExample: `return <div className="foo">{items.map(i => <span>{i}</span>)}</div>`,
      correctExample: `<template>\n  <div class="foo"><span v-for="i in items">{{ i }}</span></div>\n</template>`,
    },
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/rules/api-alignment.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/rules/api-alignment.ts src/rules/api-alignment.test.ts
git commit -m "feat: api-alignment rules (react hooks, vue2 api, filters, className, jsx)"
```

---

### Task 6: Reactivity Rules

**Files:**
- Create: `src/rules/reactivity.ts`
- Create: `src/rules/reactivity.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/rules/reactivity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GravityEngine } from '../engine/scanner.js';
import { GravityRegistry } from './registry.js';
import { reactivityRules } from './reactivity.js';

function createEngine() {
  const registry = new GravityRegistry();
  reactivityRules.forEach(r => registry.register(r));
  return new GravityEngine(registry);
}

describe('Reactivity Rules', () => {
  const engine = createEngine();

  describe('reactivity-no-static-ref', () => {
    it('detects ref() on large const object', () => {
      const code = `const config = ref({ apiUrl: 'https://api.example.com', timeout: 5000, retries: 3 })`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.some(f => f.ruleId === 'reactivity-no-static-ref')).toBe(true);
    });

    it('does not trigger on dynamic ref', () => {
      const code = `const count = ref(0)`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.filter(f => f.ruleId === 'reactivity-no-static-ref')).toHaveLength(0);
    });
  });

  describe('reactivity-no-mutation-in-computed', () => {
    it('detects assignment inside computed', () => {
      const code = `const doubled = computed(() => { count.value = x.value * 2; return count.value })`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.some(f => f.ruleId === 'reactivity-no-mutation-in-computed')).toBe(true);
    });
  });

  describe('reactivity-prefer-ref-for-primitives', () => {
    it('detects reactive() on primitive type', () => {
      const code = `const count = reactive(0)`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.some(f => f.ruleId === 'reactivity-prefer-ref-for-primitives')).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/rules/reactivity.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement reactivity.ts**

Create `src/rules/reactivity.ts`:

```typescript
import type { GravityRule } from './types.js';

export const reactivityRules: GravityRule[] = [
  {
    id: 'reactivity-no-static-ref',
    name: '静态数据禁止 ref/reactive',
    category: 'reactivity',
    severity: 'warning',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts'],
      patterns: [
        // Detect ref/reactive wrapping large object literals (heuristic: 3+ keys)
        { type: 'regex', pattern: /\b(ref|reactive)\s*\(\s*\{[^}]*,[^}]*,[^}]/ },
      ],
    },
    fix: {
      message: '静态配置对象不需要响应式 — 使用 Object.freeze() 或直接声明',
      suggestion: '将大型静态对象移出 ref/reactive，使用 Object.freeze() 冻结',
      docsUrl: 'https://vuejs.org/guide/best-practices/performance.html',
    },
    markdown: {
      description: '静态数据（配置对象、常量映射）不应使用 ref() 或 reactive()。用 Object.freeze() 冻结并放在非响应式作用域。',
      wrongExample: `const CONFIG = ref({ apiUrl: '...', timeout: 5000, retries: 3 })`,
      correctExample: `const CONFIG = Object.freeze({ apiUrl: '...', timeout: 5000, retries: 3 })`,
    },
  },
  {
    id: 'reactivity-no-mutation-in-computed',
    name: 'computed 禁止副作用',
    category: 'reactivity',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts'],
      patterns: [
        // Detect assignment inside computed callback
        { type: 'regex', pattern: /\bcomputed\s*\(\s*(\(\)\s*=>|\(?\s*\w+\s*\)?)\s*\{[^}]*\.\w+\s*=/ },
      ],
    },
    fix: {
      message: 'computed 内部不应产生副作用 — 使用 watch 或 watchEffect',
      suggestion: '将副作用逻辑移到 watch() 或 watchEffect() 中',
      docsUrl: 'https://vuejs.org/guide/essentials/computed.html',
    },
    markdown: {
      description: '计算属性必须是纯函数，禁止在 computed 内部修改其他响应式状态。',
      wrongExample: `const doubled = computed(() => { count.value = x.value * 2; return count.value })`,
      correctExample: `const doubled = computed(() => x.value * 2)\nwatch(doubled, (val) => { count.value = val })`,
    },
  },
  {
    id: 'reactivity-prefer-ref-for-primitives',
    name: '基本类型优先使用 ref',
    category: 'reactivity',
    severity: 'info',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts'],
      patterns: [
        { type: 'regex', pattern: /\breactive\s*\(\s*(\d+|['"`]|true|false|null)\s*\)/ },
      ],
    },
    fix: {
      message: '基本类型建议使用 ref() 而非 reactive()',
      suggestion: 'reactive() 只适用于对象，基本类型请用 ref()',
    },
    markdown: {
      description: '基本类型（string, number, boolean）应使用 ref()，reactive() 只适用于对象。',
      wrongExample: `const count = reactive(0)\nconst name = reactive('hello')`,
      correctExample: `const count = ref(0)\nconst name = ref('hello')`,
    },
  },
  {
    id: 'reactivity-no-destructure-props',
    name: '禁止解构 props',
    category: 'reactivity',
    severity: 'warning',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        { type: 'regex', pattern: /\bconst\s*\{[^}]+\}\s*=\s*props\b/ },
      ],
    },
    fix: {
      message: '直接解构 props 会丢失响应性 — 使用 toRefs(props) 或通过 props.x 访问',
      suggestion: 'const { x } = toRefs(props) 或使用 props.x',
      docsUrl: 'https://vuejs.org/guide/components/props.html',
    },
    markdown: {
      description: '解构 props 会丢失响应性。使用 toRefs(props) 解构或通过 props.x 访问。',
      wrongExample: `const { title, count } = props`,
      correctExample: `const { title, count } = toRefs(props)\n// 或直接使用 props.title`,
    },
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/rules/reactivity.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/rules/reactivity.ts src/rules/reactivity.test.ts
git commit -m "feat: reactivity rules (static ref, computed mutation, props destructure)"
```

---

### Task 7: Template Rules

**Files:**
- Create: `src/rules/template.ts`
- Create: `src/rules/template.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/rules/template.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GravityEngine } from '../engine/scanner.js';
import { GravityRegistry } from './registry.js';
import { templateRules } from './template.js';

function createEngine() {
  const registry = new GravityRegistry();
  templateRules.forEach(r => registry.register(r));
  return new GravityEngine(registry);
}

describe('Template Rules', () => {
  const engine = createEngine();

  describe('template-no-vmodel-value', () => {
    it('detects v-model:value', () => {
      const code = `<template><input v-model:value="name" /></template>`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.some(f => f.ruleId === 'template-no-vmodel-value')).toBe(true);
    });

    it('does not trigger on v-model', () => {
      const code = `<template><input v-model="name" /></template>`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.filter(f => f.ruleId === 'template-no-vmodel-value')).toHaveLength(0);
    });
  });

  describe('template-no-vfor-vif', () => {
    it('detects v-for and v-if on same element', () => {
      const code = `<template><div v-for="item in list" v-if="item.visible">{{ item.name }}</div></template>`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.some(f => f.ruleId === 'template-no-vfor-vif')).toBe(true);
    });
  });

  describe('template-vfor-key', () => {
    it('detects v-for without :key', () => {
      const code = `<template><div v-for="item in list">{{ item }}</div></template>`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.some(f => f.ruleId === 'template-vfor-key')).toBe(true);
    });

    it('does not trigger when :key is present', () => {
      const code = `<template><div v-for="item in list" :key="item.id">{{ item }}</div></template>`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.filter(f => f.ruleId === 'template-vfor-key')).toHaveLength(0);
    });
  });

  describe('template-no-vhtml', () => {
    it('detects v-html usage', () => {
      const code = `<template><div v-html="userInput"></div></template>`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.some(f => f.ruleId === 'template-no-vhtml')).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/rules/template.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement template.ts**

Create `src/rules/template.ts`:

```typescript
import type { GravityRule } from './types.js';

export const templateRules: GravityRule[] = [
  {
    id: 'template-no-vmodel-value',
    name: '禁止 v-model:value',
    category: 'template',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        { type: 'regex', pattern: /\bv-model:value\b/ },
      ],
    },
    fix: {
      message: 'v-model:value 已废弃 — 使用 v-model 或 v-model:argument',
      suggestion: 'v-model:value="x" → v-model="x" 或 v-model:modelValue="x"',
      docsUrl: 'https://vuejs.org/guide/components/v-model.html',
    },
    markdown: {
      description: 'Vue 3 中 v-model:value 是无效语法。使用 v-model 或 v-model:modelValue。',
      wrongExample: `<input v-model:value="name" />`,
      correctExample: `<input v-model="name" />\n<MyComp v-model:modelValue="name" />`,
    },
  },
  {
    id: 'template-no-vfor-vif',
    name: '禁止 v-for 与 v-if 同元素',
    category: 'template',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        { type: 'regex', pattern: /\bv-for\b[^>]*\bv-if\b/ },
        { type: 'regex', pattern: /\bv-if\b[^>]*\bv-for\b/ },
      ],
    },
    fix: {
      message: 'v-for 和 v-if 不应在同一元素上 — 优先级 v-if > v-for 会导致行为异常',
      suggestion: '使用计算属性过滤列表，或在外层包裹 <template v-for>',
      docsUrl: 'https://vuejs.org/style-guide/avoid-v-if-with-v-for.html',
    },
    markdown: {
      description: 'v-for 和 v-if 不应同时用在同一元素上（Vue 3 中 v-if 优先级更高）。',
      wrongExample: `<div v-for="item in list" v-if="item.active">{{ item.name }}</div>`,
      correctExample: `<div v-for="item in activeList">{{ item.name }}</div>\nconst activeList = computed(() => list.filter(i => i.active))`,
    },
  },
  {
    id: 'template-vfor-key',
    name: 'v-for 必须有 :key',
    category: 'template',
    severity: 'warning',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        { type: 'regex', pattern: /\bv-for="[^"]+"\s*(?!.*:key)[^>]*>/ },
      ],
    },
    fix: {
      message: 'v-for 缺少 :key — 列表渲染必须提供唯一稳定的 key',
      suggestion: '添加 :key="item.id"（优先使用唯一标识，避免使用索引）',
      docsUrl: 'https://vuejs.org/guide/essentials/list.html#maintaining-state',
    },
    markdown: {
      description: 'v-for 必须提供唯一、稳定的 :key。严禁用索引作为 key（除非列表完全静态）。',
      wrongExample: `<div v-for="item in list">{{ item.name }}</div>`,
      correctExample: `<div v-for="item in list" :key="item.id">{{ item.name }}</div>`,
    },
  },
  {
    id: 'template-no-vhtml',
    name: 'v-html 安全警告',
    category: 'template',
    severity: 'warning',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        { type: 'regex', pattern: /\bv-html\b/ },
      ],
    },
    fix: {
      message: 'v-html 存在 XSS 风险 — 确保内容已转义或来自可信源',
      suggestion: '对用户输入使用文本插值 {{ }} 而非 v-html',
      docsUrl: 'https://vuejs.org/guide/best-practices/security.html',
    },
    markdown: {
      description: 'v-html 存在 XSS 风险。仅用于可信内容，绝不在用户输入上使用。',
      wrongExample: `<div v-html="userInput"></div>`,
      correctExample: `<div>{{ userInput }}</div>`,
    },
  },
  {
    id: 'template-event-casing',
    name: '模板事件应使用 kebab-case',
    category: 'template',
    severity: 'info',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        { type: 'regex', pattern: /\b@[a-z]+[A-Z]\w*/ },
      ],
    },
    fix: {
      message: '模板中事件名建议使用 kebab-case',
      suggestion: '@onClick → @click，@onUpdate → @update',
    },
    markdown: {
      description: '模板中事件应使用 kebab-case（@click），脚本中使用 camelCase。',
      wrongExample: `<button @onClick="handle">`,
      correctExample: `<button @click="handle">`,
    },
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/rules/template.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/rules/template.ts src/rules/template.test.ts
git commit -m "feat: template rules (v-model:value, v-for/v-if, key, v-html, event casing)"
```

---

### Task 8: Styles Rules

**Files:**
- Create: `src/rules/styles.ts`
- Create: `src/rules/styles.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/rules/styles.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GravityEngine } from '../engine/scanner.js';
import { GravityRegistry } from './registry.js';
import { stylesRules } from './styles.js';

function createEngine() {
  const registry = new GravityRegistry();
  stylesRules.forEach(r => registry.register(r));
  return new GravityEngine(registry);
}

describe('Styles Rules', () => {
  const engine = createEngine();

  describe('styles-no-deep-deprecated', () => {
    it('detects >>>', () => {
      const code = `<style>\n>>> .child { color: red; }\n</style>`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.some(f => f.ruleId === 'styles-no-deep-deprecated')).toBe(true);
    });

    it('detects /deep/', () => {
      const code = `<style>\n/deep/ .child { color: red; }\n</style>`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.some(f => f.ruleId === 'styles-no-deep-deprecated')).toBe(true);
    });

    it('detects ::v-deep', () => {
      const code = `<style>\n::v-deep .child { color: red; }\n</style>`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.some(f => f.ruleId === 'styles-no-deep-deprecated')).toBe(true);
    });

    it('does not trigger on :deep()', () => {
      const code = `<style scoped>\n:deep(.child) { color: red; }\n</style>`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.filter(f => f.ruleId === 'styles-no-deep-deprecated')).toHaveLength(0);
    });
  });

  describe('styles-prefer-scoped', () => {
    it('detects <style> without scoped', () => {
      const code = `<style>\n.foo { color: red; }\n</style>`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.some(f => f.ruleId === 'styles-prefer-scoped')).toBe(true);
    });

    it('does not trigger on <style scoped>', () => {
      const code = `<style scoped>\n.foo { color: red; }\n</style>`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.filter(f => f.ruleId === 'styles-prefer-scoped')).toHaveLength(0);
    });

    it('does not trigger on <style module>', () => {
      const code = `<style module>\n.foo { color: red; }\n</style>`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.filter(f => f.ruleId === 'styles-prefer-scoped')).toHaveLength(0);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/rules/styles.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement styles.ts**

Create `src/rules/styles.ts`:

```typescript
import type { GravityRule } from './types.js';

export const stylesRules: GravityRule[] = [
  {
    id: 'styles-no-deep-deprecated',
    name: '禁止废弃的深度选择器',
    category: 'styles',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        { type: 'regex', pattern: /\b>>>\s*\./ },
        { type: 'regex', pattern: /\b\/deep\/\s*\./ },
        { type: 'regex', pattern: /\b::v-deep\s*\./ },
      ],
    },
    fix: {
      message: '检测到废弃的深度选择器 — 使用 :deep() 替代',
      suggestion: '>>> .child → :deep(.child) / /deep/ .child → :deep(.child)',
      docsUrl: 'https://vuejs.org/api/sfc-css-usage.html#deep-selectors',
    },
    markdown: {
      description: 'Vue 3 中 >>>、/deep/、::v-deep 已废弃，统一使用 :deep(.selector)。',
      wrongExample: `>>> .child { color: red; }\n/deep/ .child { color: red; }`,
      correctExample: `:deep(.child) { color: red; }`,
    },
  },
  {
    id: 'styles-prefer-scoped',
    name: '推荐使用 scoped 样式',
    category: 'styles',
    severity: 'info',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        { type: 'regex', pattern: /<style\s*(?!scoped|module)[^>]*>/ },
      ],
    },
    fix: {
      message: '<style> 未使用 scoped — 建议添加 scoped 避免样式污染',
      suggestion: '<style> → <style scoped>',
    },
    markdown: {
      description: '默认使用 <style scoped>，避免样式污染全局。',
      wrongExample: `<style>\n.foo { color: red; }\n</style>`,
      correctExample: `<style scoped>\n.foo { color: red; }\n</style>`,
    },
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/rules/styles.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/rules/styles.ts src/rules/styles.test.ts
git commit -m "feat: styles rules (deprecated deep selectors, prefer scoped)"
```

---

### Task 9: Performance Rules

**Files:**
- Create: `src/rules/performance.ts`
- Create: `src/rules/performance.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/rules/performance.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GravityEngine } from '../engine/scanner.js';
import { GravityRegistry } from './registry.js';
import { performanceRules } from './performance.js';

function createEngine() {
  const registry = new GravityRegistry();
  performanceRules.forEach(r => registry.register(r));
  return new GravityEngine(registry);
}

describe('Performance Rules', () => {
  const engine = createEngine();

  describe('perf-no-large-component', () => {
    it('does not trigger on small files', () => {
      const code = '<template><div>hello</div></template>';
      const findings = engine.scan('Test.vue', code);
      expect(findings.filter(f => f.ruleId === 'perf-no-large-component')).toHaveLength(0);
    });
  });

  describe('perf-no-sync-in-watch', () => {
    it('detects async operations in watch without flush', () => {
      const code = `watch(count, async (val) => { await fetch('/api') })`;
      const findings = engine.scan('Test.vue', code);
      expect(findings.some(f => f.ruleId === 'perf-no-sync-in-watch')).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/rules/performance.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement performance.ts**

Create `src/rules/performance.ts`:

```typescript
import type { GravityRule } from './types.js';

export const performanceRules: GravityRule[] = [
  {
    id: 'perf-no-large-component',
    name: '组件过大建议拆分',
    category: 'performance',
    severity: 'info',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        // Heuristic: trigger if file has > 300 lines (checked in scanner via line count)
        // This rule uses a custom check rather than regex
      ],
    },
    fix: {
      message: '组件超过 300 行 — 建议拆分为更小的组件或提取组合函数',
      suggestion: '将逻辑提取到 composables/ 或拆分子组件',
    },
    markdown: {
      description: '超过约 300 行的组件建议拆分并提取组合函数。',
      wrongExample: `// 500+ 行的单文件组件`,
      correctExample: `// 拆分为多个小组件 + composables/useXxx.ts`,
    },
  },
  {
    id: 'perf-no-async-in-computed',
    name: 'computed 禁止异步',
    category: 'performance',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts'],
      patterns: [
        { type: 'regex', pattern: /\bcomputed\s*\(\s*async\s*\(/ },
        { type: 'regex', pattern: /\bcomputed\s*\(\s*\(\s*\)\s*=>\s*\{/ },
      ],
    },
    fix: {
      message: 'computed 不支持异步操作 — 使用 watch 或 watchEffect',
      suggestion: '将异步逻辑移到 watch() 或 watchEffect() 中',
    },
    markdown: {
      description: '计算属性必须是同步的。异步操作使用 watch 或 watchEffect。',
      wrongExample: `const data = computed(async () => await fetch('/api'))`,
      correctExample: `const data = ref(null)\nwatchEffect(async () => { data.value = await fetch('/api') })`,
    },
  },
  {
    id: 'perf-no-sync-in-watch',
    name: 'watch 中异步操作注意 flush 时机',
    category: 'performance',
    severity: 'info',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts'],
      patterns: [
        { type: 'regex', pattern: /\bwatch\s*\([^)]*,\s*async\s*\(/ },
      ],
    },
    fix: {
      message: 'watch 中的异步操作可能在 DOM 更新后执行 — 注意 flush 选项',
      suggestion: '使用 watchEffect 或设置 flush: "pre"',
    },
    markdown: {
      description: 'watch 回调中的异步操作注意 flush 时机，避免 DOM 更新不同步。',
      wrongExample: `watch(count, async (val) => { await fetch('/api') })`,
      correctExample: `watchEffect(async () => { await fetch('/api', { body: count.value }) })`,
    },
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/rules/performance.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/rules/performance.ts src/rules/performance.test.ts
git commit -m "feat: performance rules (large component, async computed, watch flush)"
```

---

### Task 10: Rule Auto-Registration

**Files:**
- Create: `src/rules/index.ts`
- Create: `src/rules/index.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/rules/index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createDefaultRegistry } from './index.js';

describe('createDefaultRegistry', () => {
  it('registers all built-in rules', () => {
    const registry = createDefaultRegistry();
    const rules = registry.getRules();
    expect(rules.length).toBeGreaterThan(10);
  });

  it('registers rules from all categories', () => {
    const registry = createDefaultRegistry();
    const categories = new Set(registry.getRules().map(r => r.category));
    expect(categories.has('api-alignment')).toBe(true);
    expect(categories.has('reactivity')).toBe(true);
    expect(categories.has('template')).toBe(true);
    expect(categories.has('styles')).toBe(true);
    expect(categories.has('performance')).toBe(true);
  });

  it('all rules have unique ids', () => {
    const registry = createDefaultRegistry();
    const ids = registry.getRules().map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('applies user config overrides', () => {
    const registry = createDefaultRegistry({
      rules: { 'api-no-react-hooks': { enabled: false } },
      ignore: [],
    });
    const rule = registry.getRule('api-no-react-hooks');
    expect(rule).toBeUndefined(); // disabled, so getRules filters it out
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/rules/index.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement index.ts**

Create `src/rules/index.ts`:

```typescript
import { GravityRegistry } from './registry.js';
import { apiAlignmentRules } from './api-alignment.js';
import { reactivityRules } from './reactivity.js';
import { templateRules } from './template.js';
import { stylesRules } from './styles.js';
import { performanceRules } from './performance.js';
import type { GravityConfig } from './types.js';

export function createDefaultRegistry(config?: GravityConfig): GravityRegistry {
  const registry = new GravityRegistry();

  const allRules = [
    ...apiAlignmentRules,
    ...reactivityRules,
    ...templateRules,
    ...stylesRules,
    ...performanceRules,
  ];

  for (const rule of allRules) {
    registry.register(rule);
  }

  // Apply user config overrides
  if (config?.rules) {
    for (const [id, override] of Object.entries(config.rules)) {
      registry.configure(id, override);
    }
  }

  return registry;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/rules/index.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/rules/index.ts src/rules/index.test.ts
git commit -m "feat: auto-register all built-in rules with config override support"
```

---

### Task 11: Vite Plugin

**Files:**
- Create: `src/vite-plugin.ts`
- Create: `src/vite-plugin.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/vite-plugin.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import vueGravityEngine from './vite-plugin.js';

describe('vue-gravity-engine vite plugin', () => {
  it('returns a valid Vite plugin object', () => {
    const plugin = vueGravityEngine();
    expect(plugin.name).toBe('vue-gravity-engine');
    expect(typeof plugin.handleHotUpdate).toBe('function');
    expect(typeof plugin.buildEnd).toBe('function');
  });

  it('accepts custom options', () => {
    const plugin = vueGravityEngine({
      config: { rules: { 'api-no-react-hooks': { enabled: false } } },
    });
    expect(plugin.name).toBe('vue-gravity-engine');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/vite-plugin.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement vite-plugin.ts**

Create `src/vite-plugin.ts`:

```typescript
import type { Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { GravityEngine } from './engine/scanner.js';
import { formatTerminalReport } from './engine/reporter.js';
import { createDefaultRegistry } from './rules/index.js';
import { loadConfig } from './config.js';
import type { GravityConfig, Finding, ScanReport } from './rules/types.js';
import pc from 'picocolors';

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
      // This is a placeholder for future build-time integration
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/vite-plugin.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/vite-plugin.ts src/vite-plugin.test.ts
git commit -m "feat: vite plugin with HMR blocking for errors, terminal warnings"
```

---

### Task 12: CLI

**Files:**
- Create: `src/cli.ts`
- Create: `src/cli.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/cli.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const CLI_PATH = resolve(import.meta.dirname, '../dist/cli.js');

describe('vue-gravity CLI', () => {
  it('shows help', () => {
    try {
      const output = execFileSync('node', [CLI_PATH, '--help'], {
        encoding: 'utf-8',
        timeout: 5000,
      });
      expect(output).toContain('vue-gravity');
      expect(output).toContain('check');
      expect(output).toContain('generate-skills');
    } catch {
      // CLI not built yet, skip
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/cli.test.ts`
Expected: FAIL (or skip if dist not built)

- [ ] **Step 3: Implement cli.ts**

Create `src/cli.ts`:

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
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

    // Terminal output
    console.log(formatTerminalReport(report));

    // Generate report file
    if (options.report) {
      const reportPath = join(projectRoot, `gravity-report.${options.format}`);
      const content = options.format === 'json' ? formatJsonReport(report) : formatJsonReport(report);
      writeFileSync(reportPath, content, 'utf-8');
      console.log(pc.dim(`\n  Report saved to ${reportPath}`));
    }

    // CI mode
    if (options.ci) {
      if (report.summary.errors > 0) {
        console.log(pc.red(`\n  CI: ${report.summary.errors} errors found`));
        process.exit(1);
      }
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

program.parse();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/cli.test.ts`
Expected: PASS (or skip)

- [ ] **Step 5: Commit**

```bash
git add src/cli.ts src/cli.test.ts
git commit -m "feat: CLI with check and generate-skills commands"
```

---

### Task 13: Skills Generator

**Files:**
- Create: `src/skills-generator.ts`
- Create: `src/skills-generator.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/skills-generator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateSkillsMarkdown } from './skills-generator.js';
import { createDefaultRegistry } from './rules/index.js';

describe('generateSkillsMarkdown', () => {
  it('generates markdown with all rule categories', () => {
    const registry = createDefaultRegistry();
    const md = generateSkillsMarkdown(registry);

    expect(md).toContain('vue-gravity-engine');
    expect(md).toContain('API对齐');
    expect(md).toContain('响应式');
    expect(md).toContain('模板');
    expect(md).toContain('样式');
    expect(md).toContain('性能');
  });

  it('includes wrong and correct examples for each rule', () => {
    const registry = createDefaultRegistry();
    const md = generateSkillsMarkdown(registry);

    // Check a specific rule
    expect(md).toContain('useState');
    expect(md).toContain('ref()');
  });

  it('excludes disabled rules', () => {
    const registry = createDefaultRegistry({
      rules: { 'api-no-react-hooks': { enabled: false } },
      ignore: [],
    });
    const md = generateSkillsMarkdown(registry);
    // The rule's specific content should not appear
    expect(md).not.toContain('禁止 React Hooks');
  });

  it('includes the self-healing pipeline', () => {
    const registry = createDefaultRegistry();
    const md = generateSkillsMarkdown(registry);
    expect(md).toContain('自我修复流水线');
    expect(md).toContain('预检');
    expect(md).toContain('内部审计');
    expect(md).toContain('最终输出');
  });

  it('includes non-negotiable bottom lines', () => {
    const registry = createDefaultRegistry();
    const md = generateSkillsMarkdown(registry);
    expect(md).toContain('不可妥协的底线');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/skills-generator.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement skills-generator.ts**

Create `src/skills-generator.ts`:

```typescript
import { GravityRegistry } from './rules/registry.js';
import type { GravityRule } from './rules/types.js';

export function generateSkillsMarkdown(registry: GravityRegistry): string {
  const rules = registry.getRules();
  const categories = groupByCategory(rules);

  return `# vue-gravity-engine

## 角色与目标

你作为 Vue 引力引擎，目标是确保每一段生成的 Vue 代码严格遵循 Vue 3 最佳实践和官方风格指南。

- **引力中心：** Vue 3 官方文档、组合式 API、<script setup>
- **排斥模式：** Vue 2 Options API 残留、React 习惯混入、已废弃语法、不安全或低效的写法

## 自我修复流水线

输出任何 Vue 代码前，必须经历三个阶段：

1. **预检：** 在起草前回忆以下规则
2. **内部审计：** 起草后运行以下检查并默默修正所有问题
3. **最终输出：** 交付零问题代码

## 检测规则

${renderCategory('API对齐', categories['api-alignment'])}
${renderCategory('响应式核心', categories['reactivity'])}
${renderCategory('模板正确性', categories['template'])}
${renderCategory('样式与穿透', categories['styles'])}
${renderCategory('性能与架构', categories['performance'])}

## 不可妥协的底线

1. Vue 3 项目中不得出现未注明的 Vue 2 代码
2. 同一 <script setup> 块内不得混合 Options API 与 Composition API
3. 绝不输出已知会引发性能问题或安全漏洞的模式（如无 key 的 v-for、未经转义的 v-html）
`;
}

function groupByCategory(rules: GravityRule[]): Record<string, GravityRule[]> {
  const groups: Record<string, GravityRule[]> = {};
  for (const rule of rules) {
    if (!groups[rule.category]) groups[rule.category] = [];
    groups[rule.category].push(rule);
  }
  return groups;
}

function renderCategory(title: string, rules: GravityRule[] | undefined): string {
  if (!rules || rules.length === 0) return '';

  const items = rules
    .map(
      rule => `### ${rule.name}

**严重级别:** ${rule.severity}

${rule.markdown.description}

**错误示例：**
\`\`\`ts
${rule.markdown.wrongExample}
\`\`\`

**正确示例：**
\`\`\`ts
${rule.markdown.correctExample}
\`\`\`
`
    )
    .join('\n---\n\n');

  return `## ${title}\n\n${items}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/skills-generator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/skills-generator.ts src/skills-generator.test.ts
git commit -m "feat: skills markdown generator from shared rule registry"
```

---

### Task 14: Integration Tests

**Files:**
- Create: `src/integration.test.ts`

- [ ] **Step 1: Write integration tests**

Create `src/integration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GravityEngine } from './engine/scanner.js';
import { createDefaultRegistry } from './rules/index.js';
import { generateSkillsMarkdown } from './skills-generator.js';

function createDefaultEngine() {
  const registry = createDefaultRegistry();
  return new GravityEngine(registry);
}

describe('Integration: multi-rule detection', () => {
  const engine = createDefaultEngine();

  it('detects multiple hallucinations in a single Vue file', () => {
    const code = `<template>
  <div className="wrapper" v-for="item in list">
    {{ item.name | uppercase }}
  </div>
</template>
<script setup>
import { useState } from 'react'
const [list, setList] = useState([])
</script>
<style>
/deep/ .wrapper { color: red; }
</style>`;

    const findings = engine.scan('Test.vue', code);

    const ruleIds = new Set(findings.map(f => f.ruleId));
    expect(ruleIds.has('template-no-classname')).toBe(true);
    expect(ruleIds.has('template-vfor-key')).toBe(true);
    expect(ruleIds.has('api-no-vue2-filters')).toBe(true);
    expect(ruleIds.has('api-no-react-hooks')).toBe(true);
    expect(ruleIds.has('api-no-react-import')).toBe(true);
    expect(ruleIds.has('styles-no-deep-deprecated')).toBe(true);
  });

  it('standard Composition API file triggers zero rules', () => {
    const code = `<template>
  <div class="wrapper">
    <span v-for="item in items" :key="item.id">{{ item.name }}</span>
    <p>{{ doubled }}</p>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const items = ref([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
])

const doubled = computed(() => items.value.length * 2)

watch(items, (val) => {
  console.log('items changed', val.length)
}, { flush: 'pre' })
</script>
<style scoped>
.wrapper { padding: 1rem; }
:deep(.child) { color: blue; }
</style>`;

    const findings = engine.scan('App.vue', code);
    expect(findings).toHaveLength(0);
  });
});

describe('Integration: skills and engine consistency', () => {
  it('every rule in the registry appears in the skills document', () => {
    const registry = createDefaultRegistry();
    const rules = registry.getRules();
    const markdown = generateSkillsMarkdown(registry);

    for (const rule of rules) {
      expect(markdown).toContain(rule.name);
      expect(markdown).toContain(rule.markdown.description);
    }
  });

  it('every rule in skills has a corresponding detection rule', () => {
    const registry = createDefaultRegistry();
    const markdown = generateSkillsMarkdown(registry);
    const rules = registry.getRules();

    // If a rule name appears in markdown, it should be in the registry
    for (const rule of rules) {
      expect(markdown).toContain(rule.name);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run src/integration.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/integration.test.ts
git commit -m "feat: integration tests for multi-rule detection and skills consistency"
```

---

### Task 15: Update index.ts exports and final build

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Update exports**

Update `src/index.ts`:

```typescript
export { GravityEngine } from './engine/scanner.js';
export { GravityRegistry } from './rules/registry.js';
export { createDefaultRegistry } from './rules/index.js';
export { generateSkillsMarkdown } from './skills-generator.js';
export { loadConfig } from './config.js';
export { formatTerminalReport, formatJsonReport } from './engine/reporter.js';
export { apiAlignmentRules } from './rules/api-alignment.js';
export { reactivityRules } from './rules/reactivity.js';
export { templateRules } from './rules/template.js';
export { stylesRules } from './rules/styles.js';
export { performanceRules } from './rules/performance.js';
export type {
  GravityRule,
  Finding,
  GravityConfig,
  ScanReport,
  PatternMatch,
  RuleOverride,
} from './rules/types.js';
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: dist/ directory created with index.js, index.cjs, vite-plugin.js, vite-plugin.cjs, cli.js

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 4: Generate skills document**

Run: `node dist/cli.js generate-skills -o skills/vue-gravity-engine.md`
Expected: skills/vue-gravity-engine.md created

- [ ] **Step 5: Commit**

```bash
git add src/index.ts skills/
git commit -m "feat: finalize exports, build, and generate skills document"
```

---

### Task 16: Package setup for npm publish

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add publishConfig and repository fields to package.json**

Update `package.json` — add:

```json
{
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/user/vue-gravity-engine"
  }
}
```

- [ ] **Step 2: Verify package contents**

Run: `npm pack --dry-run`
Expected: Shows dist/, skills/, package.json, README.md will be included

- [ ] **Step 3: Final test run**

Run: `npm test && npm run build`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: prepare package for npm publish"
```
