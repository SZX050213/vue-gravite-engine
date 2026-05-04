import type { GravityRule } from './types.js';

export const templateRules: GravityRule[] = [
  {
    id: 'template-no-vmodel-value',
    name: 'No v-model:value',
    category: 'template',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        {
          type: 'regex',
          pattern: /\bv-model:value\b/,
        },
      ],
    },
    fix: {
      message: 'v-model:value 已废弃 — 使用 v-model 或 v-model:argument',
      suggestion: 'v-model:value="x" → v-model="x" 或 v-model:modelValue="x"',
    },
    markdown: {
      description:
        'The v-model:value syntax was deprecated in Vue 3. Use v-model or v-model:argument instead. v-model without an argument defaults to modelValue.',
      wrongExample: '```vue\n<Comp v-model:value="name" />\n```',
      correctExample: '```vue\n<Comp v-model="name" />\n<!-- or -->\n<Comp v-model:modelValue="name" />\n```',
    },
  },
  {
    id: 'template-no-vfor-vif',
    name: 'No v-for with v-if',
    category: 'template',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        {
          type: 'regex',
          pattern: /\bv-for\b[^>]*\bv-if\b/,
        },
        {
          type: 'regex',
          pattern: /\bv-if\b[^>]*\bv-for\b/,
        },
      ],
    },
    fix: {
      message: 'v-for 和 v-if 不应在同一元素上 — 优先级 v-if > v-for 会导致行为异常',
      suggestion: '将 v-if 移到 <template> 包装元素上，或使用 computed 过滤列表',
    },
    markdown: {
      description:
        'In Vue 3, v-if has higher priority than v-for on the same element, meaning v-if has no access to the v-for variable. This causes unexpected behavior. Use a <template> wrapper or computed property to filter the list.',
      wrongExample: '```vue\n<li v-for="item in items" v-if="item.active">{{ item.name }}</li>\n```',
      correctExample:
        '```vue\n<template v-for="item in items" :key="item.id">\n  <li v-if="item.active">{{ item.name }}</li>\n</template>\n```',
    },
  },
  {
    id: 'template-vfor-key',
    name: 'v-for Missing Key',
    category: 'template',
    severity: 'warning',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        {
          type: 'regex',
          pattern: /\bv-for="[^"]+"\s*(?!.*:key)[^>]*>/,
        },
      ],
    },
    fix: {
      message: 'v-for 缺少 :key — 列表渲染必须提供唯一稳定的 key',
      suggestion: '为 v-for 元素添加 :key="item.id" 或其他唯一标识',
    },
    markdown: {
      description:
        'Every v-for element should have a unique and stable :key attribute. Without it, Vue cannot efficiently track node identity, leading to rendering bugs and poor performance.',
      wrongExample: '```vue\n<li v-for="item in items">{{ item.name }}</li>\n```',
      correctExample: '```vue\n<li v-for="item in items" :key="item.id">{{ item.name }}</li>\n```',
    },
  },
  {
    id: 'template-no-vhtml',
    name: 'No v-html',
    category: 'template',
    severity: 'warning',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        {
          type: 'regex',
          pattern: /\bv-html\b/,
        },
      ],
    },
    fix: {
      message: 'v-html 存在 XSS 风险 — 确保内容已转义或来自可信源',
      suggestion: '避免使用 v-html，或确保内容经过 DOMPurify 等库净化',
    },
    markdown: {
      description:
        'v-html renders raw HTML and introduces XSS (Cross-Site Scripting) risks. Never use v-html with user-supplied content. If you must render HTML, sanitize it with DOMPurify or a similar library.',
      wrongExample: '```vue\n<div v-html="userContent"></div>\n```',
      correctExample:
        '```vue\n<!-- Prefer text interpolation -->\n<div>{{ userContent }}</div>\n<!-- If HTML is required, sanitize first -->\n<div v-html="sanitize(userContent)"></div>\n```',
    },
  },
  {
    id: 'template-event-casing',
    name: 'Event Casing',
    category: 'template',
    severity: 'info',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        {
          type: 'regex',
          pattern: /@[a-z]+[A-Z]\w*/,
        },
      ],
    },
    fix: {
      message: '模板中事件名建议使用 kebab-case',
      suggestion: '将 @onClick 改为 @click，@myEvent 改为 @my-event',
    },
    markdown: {
      description:
        'In Vue templates, event names should use kebab-case for consistency with HTML attribute conventions. camelCase event names work but are not idiomatic in templates.',
      wrongExample: '```vue\n<button @onClick="handler">Click</button>\n```',
      correctExample: '```vue\n<button @click="handler">Click</button>\n```',
    },
  },
];
