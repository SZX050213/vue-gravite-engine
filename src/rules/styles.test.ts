import { describe, it, expect } from 'vitest';
import { GravityEngine } from '../engine/scanner.js';
import { GravityRegistry } from './registry.js';
import { stylesRules } from './styles.js';

function createEngine() {
  const registry = new GravityRegistry();
  stylesRules.forEach(r => registry.register(r));
  return new GravityEngine(registry);
}

describe('styles-no-deep-deprecated', () => {
  it('detects >>> deep selector', () => {
    const engine = createEngine();
    const code = `<style scoped>\n>>> .child { color: red; }\n</style>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'styles-no-deep-deprecated');
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe('error');
  });

  it('detects /deep/ selector', () => {
    const engine = createEngine();
    const code = `<style scoped>\n/deep/ .child { color: red; }\n</style>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'styles-no-deep-deprecated');
    expect(matched).toHaveLength(1);
  });

  it('detects ::v-deep selector', () => {
    const engine = createEngine();
    const code = `<style scoped>\n::v-deep .child { color: red; }\n</style>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'styles-no-deep-deprecated');
    expect(matched).toHaveLength(1);
  });

  it('does NOT trigger on :deep()', () => {
    const engine = createEngine();
    const code = `<style scoped>\n:deep(.child) { color: red; }\n</style>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'styles-no-deep-deprecated');
    expect(matched).toHaveLength(0);
  });

  it('does NOT trigger on .ts files', () => {
    const engine = createEngine();
    const code = `const x = '>>> .child { color: red; }'`;
    const findings = engine.scan('utils.ts', code);
    const matched = findings.filter(f => f.ruleId === 'styles-no-deep-deprecated');
    expect(matched).toHaveLength(0);
  });
});

describe('styles-prefer-scoped', () => {
  it('detects <style> without scoped', () => {
    const engine = createEngine();
    const code = `<style>\n.foo { color: red; }\n</style>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'styles-prefer-scoped');
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe('info');
  });

  it('does NOT trigger on <style scoped>', () => {
    const engine = createEngine();
    const code = `<style scoped>\n.foo { color: red; }\n</style>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'styles-prefer-scoped');
    expect(matched).toHaveLength(0);
  });

  it('does NOT trigger on <style module>', () => {
    const engine = createEngine();
    const code = `<style module>\n.foo { color: red; }\n</style>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'styles-prefer-scoped');
    expect(matched).toHaveLength(0);
  });

  it('does NOT trigger on .ts files', () => {
    const engine = createEngine();
    const code = `const x = '<style>'`;
    const findings = engine.scan('utils.ts', code);
    const matched = findings.filter(f => f.ruleId === 'styles-prefer-scoped');
    expect(matched).toHaveLength(0);
  });
});
