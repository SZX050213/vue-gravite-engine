import { describe, it, expect } from 'vitest';
import { GravityEngine } from '../engine/scanner.js';
import { GravityRegistry } from './registry.js';
import { performanceRules } from './performance.js';

function createEngine() {
  const registry = new GravityRegistry();
  performanceRules.forEach(r => registry.register(r));
  return new GravityEngine(registry);
}

describe('perf-no-async-in-computed', () => {
  it('detects computed(async () => ...)', () => {
    const engine = createEngine();
    const code = `const data = computed(async () => { return await fetch('/api'); })`;
    const findings = engine.scan('utils.ts', code);
    const matched = findings.filter(f => f.ruleId === 'perf-no-async-in-computed');
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe('error');
  });

  it('detects computed( async ( in .vue files', () => {
    const engine = createEngine();
    const code = `<script setup>\nconst result = computed( async () => {\n  return await getData();\n});\n</script>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'perf-no-async-in-computed');
    expect(matched).toHaveLength(1);
  });

  it('does NOT trigger on normal computed', () => {
    const engine = createEngine();
    const code = `const doubled = computed(() => count.value * 2)`;
    const findings = engine.scan('utils.ts', code);
    const matched = findings.filter(f => f.ruleId === 'perf-no-async-in-computed');
    expect(matched).toHaveLength(0);
  });

  it('does NOT trigger on non-matching file types', () => {
    const engine = createEngine();
    const code = `const data = computed(async () => { return await fetch('/api'); })`;
    const findings = engine.scan('styles.css', code);
    const matched = findings.filter(f => f.ruleId === 'perf-no-async-in-computed');
    expect(matched).toHaveLength(0);
  });
});

describe('perf-no-sync-in-watch', () => {
  it('detects watch(x, async (val) => ...)', () => {
    const engine = createEngine();
    const code = `watch(source, async (val) => { await fetchData(val); })`;
    const findings = engine.scan('utils.ts', code);
    const matched = findings.filter(f => f.ruleId === 'perf-no-sync-in-watch');
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe('info');
  });

  it('detects watch( x ,  async ( in .vue files', () => {
    const engine = createEngine();
    const code = `<script setup>\nwatch(count,  async (val) => {\n  await updateSomething(val);\n});\n</script>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'perf-no-sync-in-watch');
    expect(matched).toHaveLength(1);
  });

  it('does NOT trigger on synchronous watch', () => {
    const engine = createEngine();
    const code = `watch(source, (val) => { console.log(val); })`;
    const findings = engine.scan('utils.ts', code);
    const matched = findings.filter(f => f.ruleId === 'perf-no-sync-in-watch');
    expect(matched).toHaveLength(0);
  });

  it('does NOT trigger on non-matching file types', () => {
    const engine = createEngine();
    const code = `watch(source, async (val) => { await fetchData(val); })`;
    const findings = engine.scan('styles.css', code);
    const matched = findings.filter(f => f.ruleId === 'perf-no-sync-in-watch');
    expect(matched).toHaveLength(0);
  });
});
