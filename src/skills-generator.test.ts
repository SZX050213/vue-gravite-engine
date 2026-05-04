import { describe, it, expect } from 'vitest';
import { generateSkillsMarkdown } from './skills-generator.js';
import { createDefaultRegistry } from './rules/index.js';

describe('generateSkillsMarkdown', () => {
  it('generates markdown with all rule categories', () => {
    const registry = createDefaultRegistry();
    const md = generateSkillsMarkdown(registry);

    expect(md).toContain('vue-gravity-engine');
    expect(md).toContain('API对齐');
    expect(md).toContain('响应式');
    expect(md).toContain('模板');
    expect(md).toContain('样式');
    expect(md).toContain('性能');
  });

  it('includes wrong and correct examples for each rule', () => {
    const registry = createDefaultRegistry();
    const md = generateSkillsMarkdown(registry);

    expect(md).toContain('useState');
    expect(md).toContain('ref()');
  });

  it('excludes disabled rules', () => {
    const registry = createDefaultRegistry({
      rules: { 'api-no-react-hooks': { enabled: false } },
      ignore: [],
    });
    const md = generateSkillsMarkdown(registry);
    expect(md).not.toContain('禁止 React Hooks');
  });

  it('includes the self-healing pipeline', () => {
    const registry = createDefaultRegistry();
    const md = generateSkillsMarkdown(registry);
    expect(md).toContain('自我修复流水线');
    expect(md).toContain('预检');
    expect(md).toContain('内部审计');
    expect(md).toContain('最终输出');
  });

  it('includes non-negotiable bottom lines', () => {
    const registry = createDefaultRegistry();
    const md = generateSkillsMarkdown(registry);
    expect(md).toContain('不可妥协的底线');
  });
});
