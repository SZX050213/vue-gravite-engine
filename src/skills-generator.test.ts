import { describe, it, expect } from 'vitest';
import { generateSkillsMarkdown } from './skills-generator.js';

describe('generateSkillsMarkdown', () => {
  it('generates markdown with all rule categories', () => {
    const md = generateSkillsMarkdown();
    expect(md).toContain('vue-gravity-engine');
    expect(md).toContain('API对齐');
    expect(md).toContain('响应式');
    expect(md).toContain('模板');
    expect(md).toContain('样式');
    expect(md).toContain('性能');
  });

  it('includes wrong and correct examples for each rule', () => {
    const md = generateSkillsMarkdown();
    expect(md).toContain('useState');
    expect(md).toContain('ref()');
  });

  it('excludes disabled rules', () => {
    const md = generateSkillsMarkdown({ rules: { 'api-no-react-hooks': { enabled: false } } });
    expect(md).not.toContain('No React Hooks');
  });

  it('includes self-healing pipeline', () => {
    const md = generateSkillsMarkdown();
    expect(md).toContain('自我修复流水线');
    expect(md).toContain('预检');
  });

  it('includes non-negotiable bottom lines', () => {
    const md = generateSkillsMarkdown();
    expect(md).toContain('不可妥协的底线');
  });
});
