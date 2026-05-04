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
    // getRule returns the rule with overrides applied (enabled: false)
    const rule = registry.getRule('api-no-react-hooks');
    expect(rule).toBeDefined();
    expect(rule!.enabled).toBe(false);
    // getRules() filters out disabled rules
    const rules = registry.getRules();
    expect(rules.find(r => r.id === 'api-no-react-hooks')).toBeUndefined();
  });
});
