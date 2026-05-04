import { describe, it, expect } from 'vitest';
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
