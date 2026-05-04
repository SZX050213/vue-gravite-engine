import { GravityRegistry } from './registry.js';
import { apiAlignmentRules } from './api-alignment.js';
import { reactivityRules } from './reactivity.js';
import { templateRules } from './template.js';
import { stylesRules } from './styles.js';
import { performanceRules } from './performance.js';
import type { GravityConfig } from './types.js';

export function createDefaultRegistry(config?: GravityConfig): GravityRegistry {
  const registry = new GravityRegistry();

  const allRules = [
    ...apiAlignmentRules,
    ...reactivityRules,
    ...templateRules,
    ...stylesRules,
    ...performanceRules,
  ];

  for (const rule of allRules) {
    registry.register(rule);
  }

  // Apply user config overrides
  if (config?.rules) {
    for (const [id, override] of Object.entries(config.rules)) {
      registry.configure(id, override);
    }
  }

  return registry;
}
