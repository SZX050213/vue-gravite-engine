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
    expect(findings[0].column).toBe(11);
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
