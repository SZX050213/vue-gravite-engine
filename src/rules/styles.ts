import type { GravityRule } from './types.js';

export const stylesRules: GravityRule[] = [
  {
    id: 'styles-no-deep-deprecated',
    name: 'No Deprecated Deep Selector',
    category: 'styles',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        {
          type: 'regex',
          pattern: /(?<!\w)>>>\s*\./,
        },
        {
          type: 'regex',
          pattern: /(?<!\w)\/deep\/\s*\./,
        },
        {
          type: 'regex',
          pattern: /(?<!\w)::v-deep\s*\./,
        },
      ],
    },
    fix: {
      message: '检测到废弃的深度选择器 — 使用 :deep() 替代',
      suggestion: '>>> .child → :deep(.child)',
    },
    markdown: {
      description:
        'The >>>, /deep/, and ::v-deep deep selectors are deprecated in Vue 3. Use the :deep() pseudo-class instead for scoped style penetration.',
      wrongExample: '```vue\n>>> .child { color: red; }\n/deep/ .child { color: red; }\n```',
      correctExample: '```vue\n:deep(.child) { color: red; }\n```',
    },
  },
  {
    id: 'styles-prefer-scoped',
    name: 'Prefer Scoped Styles',
    category: 'styles',
    severity: 'info',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        {
          type: 'regex',
          pattern: /<style(?=[\s>])(?!\s*(?:scoped|module)[\s>])[^>]*>/,
        },
      ],
    },
    fix: {
      message: '<style> 未使用 scoped — 建议添加 scoped 避免样式污染',
      suggestion: '<style> → <style scoped>',
    },
    markdown: {
      description:
        'Without the scoped or module attribute, styles in a Vue SFC are global and can leak into other components. Use <style scoped> to encapsulate styles.',
      wrongExample: '```vue\n<style>\n.foo { color: red; }\n</style>\n```',
      correctExample: '```vue\n<style scoped>\n.foo { color: red; }\n</style>\n```',
    },
  },
];
