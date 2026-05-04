import { describe, it, expect } from 'vitest';
import { GravityEngine } from '../engine/scanner.js';
import { GravityRegistry } from './registry.js';
import { reactivityRules } from './reactivity.js';

function createEngine() {
  const registry = new GravityRegistry();
  reactivityRules.forEach(r => registry.register(r));
  return new GravityEngine(registry);
}

describe('reactivity-no-static-ref', () => {
  it('detects ref() wrapping large const object with 3+ keys', () => {
    const engine = createEngine();
    const code = `const CONFIG = ref({ apiUrl: 'https://api.example.com', timeout: 5000, retries: 3 })`;
    const findings = engine.scan('config.ts', code);
    const matched = findings.filter(f => f.ruleId === 'reactivity-no-static-ref');
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe('warning');
  });

  it('detects reactive() wrapping large const object with 3+ keys', () => {
    const engine = createEngine();
    const code = `const CONFIG = reactive({ apiUrl: 'https://api.example.com', timeout: 5000, retries: 3 })`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'reactivity-no-static-ref');
    expect(matched).toHaveLength(1);
  });

  it('does NOT trigger on ref(0) — primitive value', () => {
    const engine = createEngine();
    const code = `const count = ref(0)`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'reactivity-no-static-ref');
    expect(matched).toHaveLength(0);
  });

  it('does NOT trigger on ref with small object (fewer than 3 keys)', () => {
    const engine = createEngine();
    const code = `const state = ref({ name: 'test', age: 1 })`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'reactivity-no-static-ref');
    expect(matched).toHaveLength(0);
  });
});

describe('reactivity-no-mutation-in-computed', () => {
  it('detects assignment inside computed', () => {
    const engine = createEngine();
    const code = `const doubled = computed(() => { count.value = x.value * 2; return count.value })`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'reactivity-no-mutation-in-computed');
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe('error');
  });

  it('does NOT trigger on pure computed', () => {
    const engine = createEngine();
    const code = `const doubled = computed(() => count.value * 2)`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'reactivity-no-mutation-in-computed');
    expect(matched).toHaveLength(0);
  });
});

describe('reactivity-prefer-ref-for-primitives', () => {
  it('detects reactive(0)', () => {
    const engine = createEngine();
    const code = `const count = reactive(0)`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'reactivity-prefer-ref-for-primitives');
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe('info');
  });

  it('detects reactive(\'hello\')', () => {
    const engine = createEngine();
    const code = `const name = reactive('hello')`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'reactivity-prefer-ref-for-primitives');
    expect(matched).toHaveLength(1);
  });

  it('detects reactive(true)', () => {
    const engine = createEngine();
    const code = `const flag = reactive(true)`;
    const findings = engine.scan('utils.ts', code);
    const matched = findings.filter(f => f.ruleId === 'reactivity-prefer-ref-for-primitives');
    expect(matched).toHaveLength(1);
  });

  it('does NOT trigger on reactive({})', () => {
    const engine = createEngine();
    const code = `const state = reactive({ count: 0 })`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'reactivity-prefer-ref-for-primitives');
    expect(matched).toHaveLength(0);
  });
});

describe('reactivity-no-destructure-props', () => {
  it('detects destructuring props', () => {
    const engine = createEngine();
    const code = `const { title, count } = props`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'reactivity-no-destructure-props');
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe('warning');
  });

  it('does NOT trigger on .ts files (only .vue)', () => {
    const engine = createEngine();
    const code = `const { title, count } = props`;
    const findings = engine.scan('utils.ts', code);
    const matched = findings.filter(f => f.ruleId === 'reactivity-no-destructure-props');
    expect(matched).toHaveLength(0);
  });

  it('does NOT trigger on toRefs(props)', () => {
    const engine = createEngine();
    const code = `const { title, count } = toRefs(props)`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'reactivity-no-destructure-props');
    expect(matched).toHaveLength(0);
  });
});
