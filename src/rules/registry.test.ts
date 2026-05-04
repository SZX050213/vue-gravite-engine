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
