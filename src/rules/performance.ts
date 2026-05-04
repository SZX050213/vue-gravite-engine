import type { GravityRule } from './types.js';

export const performanceRules: GravityRule[] = [
  {
    id: 'perf-no-large-component',
    name: 'No Large Component',
    category: 'performance',
    severity: 'info',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [],
    },
    fix: {
      message: '组件超过 300 行 — 建议拆分为更小的组件或提取组合函数',
      suggestion: '将大组件拆分为多个小组件，或提取逻辑到 composables 中',
    },
    markdown: {
      description:
        'Large components are harder to maintain, test, and reason about. This rule is a placeholder for future AST-based line counting. It will not trigger via regex scanning.',
      wrongExample: '```vue\n<!-- Component with 500+ lines -->\n<template>...</template>\n<script>...</script>\n<style>...</style>\n```',
      correctExample: '```vue\n<!-- Split into smaller components and composables -->\n<template><SmallWidget /></template>\n<script setup>\nimport { useFeature } from "./composables/feature";\n</script>\n```',
    },
  },
  {
    id: 'perf-no-async-in-computed',
    name: 'No Async in Computed',
    category: 'performance',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts'],
      patterns: [
        {
          type: 'regex',
          pattern: /\bcomputed\s*\(\s*async\s*\(/,
        },
      ],
    },
    fix: {
      message: 'computed 不支持异步操作 — 使用 watch 或 watchEffect',
      suggestion: '将 computed 中的异步逻辑移到 watch() 或 watchEffect() 中',
    },
    markdown: {
      description:
        'Vue computed properties are synchronous and must return a value immediately. Using async in a computed returns a Promise object instead of the resolved value, which breaks reactivity. Use watch() or watchEffect() for async operations.',
      wrongExample:
        '```ts\nconst data = computed(async () => {\n  const res = await fetch("/api/data");\n  return res.json();\n});\n```',
      correctExample:
        '```ts\nconst data = ref(null);\nwatch(source, async (val) => {\n  const res = await fetch(`/api/data?id=${val}`);\n  data.value = await res.json();\n});\n```',
    },
  },
  {
    id: 'perf-no-sync-in-watch',
    name: 'No Sync in Watch',
    category: 'performance',
    severity: 'info',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts'],
      patterns: [
        {
          type: 'regex',
          pattern: /\bwatch\s*\([^)]*,\s*async\s*\(/,
        },
      ],
    },
    fix: {
      message: 'watch 中的异步操作可能在 DOM 更新后执行 — 注意 flush 选项',
      suggestion: '考虑使用 flush: "pre" 或 flush: "post" 控制 watch 回调的执行时机',
    },
    markdown: {
      description:
        'Async operations in watch callbacks execute after the current microtask queue, which means they may run after DOM updates. Depending on your use case, you may want to control timing with the flush option ("pre" | "post" | "sync").',
      wrongExample:
        '```ts\nwatch(source, async (val) => {\n  await fetchData(val);\n  // DOM may have already updated\n});\n```',
      correctExample:
        '```ts\nwatch(source, async (val) => {\n  await fetchData(val);\n}, { flush: "post" });\n```',
    },
  },
];
