import type { GravityRule } from './types.js';

export const apiAlignmentRules: GravityRule[] = [
  {
    id: 'api-no-react-hooks',
    name: 'No React Hooks',
    category: 'api-alignment',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts', '*.tsx'],
      patterns: [
        {
          type: 'regex',
          pattern: /\b(useState|useEffect|useContext|useReducer|useMemo|useCallback|useRef|useLayoutEffect)\s*\(/,
        },
      ],
    },
    fix: {
      message: '检测到 React Hooks — Vue 项目应使用 Composition API',
      suggestion: '使用 ref() / computed() / watch() / onMounted() 替代',
    },
    markdown: {
      description:
        'React Hooks (useState, useEffect, useRef, etc.) should not appear in Vue projects. Vue 3 Composition API provides equivalent primitives: ref(), computed(), watch(), onMounted().',
      wrongExample:
        '```vue\n<script setup>\nimport { useState, useEffect } from "react";\nconst [count, setCount] = useState(0);\nuseEffect(() => { document.title = `Count: ${count}`; }, [count]);\n</script>\n```',
      correctExample:
        '```vue\n<script setup>\nimport { ref, watch, onMounted } from "vue";\nconst count = ref(0);\nwatch(count, (val) => { document.title = `Count: ${val}`; });\nonMounted(() => { /* ... */ });\n</script>\n```',
    },
  },
  {
    id: 'api-no-react-import',
    name: 'No React Import',
    category: 'api-alignment',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts', '*.tsx'],
      patterns: [
        { type: 'regex', pattern: /\bfrom\s+['"]react['"]/ },
        { type: 'regex', pattern: /\bimport\s+.*['"]react-dom['"]/ },
      ],
    },
    fix: {
      message: '检测到 React 导入 — Vue 项目不应依赖 React',
      suggestion: '移除 react / react-dom 依赖，使用 Vue 等效模块',
    },
    markdown: {
      description:
        'Importing from "react" or "react-dom" in a Vue project indicates a hallucinated or mixed codebase. Remove all React dependencies and use Vue equivalents.',
      wrongExample:
        '```ts\nimport React from "react";\nimport { useState } from "react";\nimport ReactDOM from "react-dom";\n```',
      correctExample:
        '```ts\nimport { ref, createApp } from "vue";\nimport App from "./App.vue";\ncreateApp(App).mount("#app");\n```',
    },
  },
  {
    id: 'api-no-vue2-api',
    name: 'No Vue 2 API',
    category: 'api-alignment',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts', '*.js'],
      patterns: [
        { type: 'regex', pattern: /\bthis\.\$listeners\b/ },
        { type: 'regex', pattern: /\bthis\.\$children\b/ },
        { type: 'regex', pattern: /\bthis\.\$set\s*\(/ },
        { type: 'regex', pattern: /\bthis\.\$on\s*\(/ },
        { type: 'regex', pattern: /\bthis\.\$once\s*\(/ },
        { type: 'regex', pattern: /\bthis\.\$off\s*\(/ },
        { type: 'regex', pattern: /\bVue\.extend\s*\(/ },
        { type: 'regex', pattern: /\bnew\s+Vue\s*\(/ },
      ],
    },
    fix: {
      message: '检测到 Vue 2 废弃 API — 请使用 Vue 3 等效写法',
      suggestion:
        'this.$listeners → useAttrs(); this.$children → use template ref; this.$set → reactive(); Vue.extend() → defineComponent()',
    },
    markdown: {
      description:
        'Vue 2 instance properties and global APIs like this.$listeners, this.$children, this.$set, Vue.extend(), and new Vue() are removed in Vue 3. Use Composition API equivalents.',
      wrongExample:
        '```js\nconst Component = Vue.extend({\n  data() { return { items: [] }; },\n  methods: {\n    addItem() { this.$set(this.items, 0, "new"); }\n  }\n});\nnew Vue({ render: h => h(App) }).$mount("#app");\n```',
      correctExample:
        '```vue\n<script setup>\nimport { reactive } from "vue";\nconst state = reactive({ items: [] as string[] });\nfunction addItem() { state.items.unshift("new"); }\n</script>\n```',
    },
  },
  {
    id: 'api-no-vue2-filters',
    name: 'No Vue 2 Filters',
    category: 'api-alignment',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts', '*.js'],
      patterns: [
        { type: 'regex', pattern: /\bVue\.filter\s*\(/ },
      ],
    },
    fix: {
      message: '检测到 Vue 2 过滤器语法 — Vue 3 已移除 filters',
      suggestion: '使用 computed 属性或方法函数替代过滤器',
    },
    markdown: {
      description:
        'Vue 3 removed the filters feature (both Vue.filter() global registration and the pipe | syntax in templates). Use computed properties or helper functions instead.',
      wrongExample:
        '```vue\n<template>\n  <p>{{ message | capitalize }}</p>\n  <span>{{ price | currency("USD") }}</span>\n</template>\n<script>\nVue.filter("capitalize", (v) => v.toUpperCase());\n</script>\n```',
      correctExample:
        '```vue\n<template>\n  <p>{{ capitalize(message) }}</p>\n  <span>{{ formatCurrency(price, "USD") }}</span>\n</template>\n<script setup>\nconst capitalize = (v: string) => v.toUpperCase();\nconst formatCurrency = (v: number, c: string) =>\n  new Intl.NumberFormat("en", { style: "currency", currency: c }).format(v);\n</script>\n```',
    },
  },
  {
    id: 'template-no-filter-pipe',
    name: 'No Template Filter Pipe',
    category: 'api-alignment',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        { type: 'regex', pattern: /\{\{[^}]*\|\s*\w+/ },
      ],
    },
    fix: {
      message: '检测到模板管道过滤器语法 — Vue 3 已移除 filters',
      suggestion: '{{ value | filter }} → {{ filter(value) }}',
      docsUrl: 'https://v3-migration.vuejs.org/breaking-changes/filters.html',
    },
    markdown: {
      description:
        'Vue 3 移除了模板中的管道过滤器语法 `{{ value | filter }}`。使用计算属性或方法函数替代。',
      wrongExample: `{{ message | uppercase }}\n{{ price | currency("USD") }}`,
      correctExample: `{{ uppercase(message) }}\n{{ formatCurrency(price, "USD") }}`,
    },
  },
  {
    id: 'template-no-classname',
    name: 'No className in Vue Templates',
    category: 'api-alignment',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        { type: 'regex', pattern: /\bclassName\s*=/ },
      ],
    },
    fix: {
      message: '检测到 className — Vue 模板应使用 class',
      suggestion: '将 className="..." 替换为 class="..."',
    },
    markdown: {
      description:
        'className is a React-specific attribute. In Vue templates, use the standard HTML class attribute to bind CSS classes.',
      wrongExample:
        '```vue\n<template>\n  <div className="wrapper active">\n    <span className="text">Hello</span>\n  </div>\n</template>\n```',
      correctExample:
        '```vue\n<template>\n  <div class="wrapper active">\n    <span class="text">Hello</span>\n  </div>\n</template>\n```',
    },
  },
  {
    id: 'api-no-react-jsx',
    name: 'No React JSX Return',
    category: 'api-alignment',
    severity: 'warning',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.tsx'],
      patterns: [
        { type: 'regex', pattern: /\breturn\s*<[A-Z]/ },
      ],
    },
    fix: {
      message: '检测到 JSX 返回语法 — Vue 使用模板而非 JSX',
      suggestion: '将 JSX return 替换为 Vue <template> 块',
    },
    markdown: {
      description:
        'Returning JSX elements (especially with capitalized component tags) indicates React-style rendering. Vue projects should use <template> blocks for component markup.',
      wrongExample:
        '```tsx\nfunction MyComponent() {\n  return <div className="app"><Header /><Content /></div>;\n}\n```',
      correctExample:
        '```vue\n<template>\n  <div class="app">\n    <Header />\n    <Content />\n  </div>\n</template>\n```',
    },
  },
];
