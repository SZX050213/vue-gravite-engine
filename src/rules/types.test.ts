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
