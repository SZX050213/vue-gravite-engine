import { describe, it, expect } from 'vitest';

describe('vue-gravity CLI', () => {
  it('CLI module exports correctly', async () => {
    // Just verify the module can be imported without errors
    // Full CLI testing requires building first
    const mod = await import('./cli.js');
    expect(mod).toBeDefined();
  });
});
