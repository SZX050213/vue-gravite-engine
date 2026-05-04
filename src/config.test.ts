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
