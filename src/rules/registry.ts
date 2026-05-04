import type { GravityRule, RuleOverride } from './types.js';

export class GravityRegistry {
  private rules = new Map<string, GravityRule>();
  private overrides = new Map<string, RuleOverride>();

  register(rule: GravityRule): void {
    this.rules.set(rule.id, { ...rule });
  }

  getRule(id: string): GravityRule | undefined {
    const rule = this.rules.get(id);
    if (!rule) return undefined;
    return this.applyOverrides(rule);
  }

  getRules(filter?: {
    category?: string;
    severity?: string;
    includeDisabled?: boolean;
  }): GravityRule[] {
    let rules = Array.from(this.rules.values()).map(r => this.applyOverrides(r));

    if (!filter?.includeDisabled) {
      rules = rules.filter(r => r.enabled);
    }
    if (filter?.category) {
      rules = rules.filter(r => r.category === filter.category);
    }
    if (filter?.severity) {
      rules = rules.filter(r => r.severity === filter.severity);
    }
    return rules;
  }

  configure(id: string, options: RuleOverride): void {
    if (!this.rules.has(id)) return;
    this.overrides.set(id, { ...this.overrides.get(id), ...options });
  }

  private applyOverrides(rule: GravityRule): GravityRule {
    const override = this.overrides.get(rule.id);
    if (!override) return rule;
    return {
      ...rule,
      ...(override.enabled !== undefined && { enabled: override.enabled }),
      ...(override.severity !== undefined && { severity: override.severity }),
    };
  }
}
