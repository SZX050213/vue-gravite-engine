import type { GravityRule } from './types.js';
import { defaultRules } from './rules.js';
import type { GravityConfig } from './types.js';

interface RuleExample {
  description: string;
  wrong: string;
  correct: string;
}

const examples: Record<string, RuleExample> = {
  'api-no-react-hooks': {
    description: 'React Hooks (useState, useEffect, useRef, etc.) should not appear in Vue projects. Vue 3 Composition API provides equivalent primitives: ref(), computed(), watch(), onMounted().',
    wrong: '```vue\n<script setup>\nimport { useState, useEffect } from "react";\nconst [count, setCount] = useState(0);\nuseEffect(() => { document.title = `Count: ${count}`; }, [count]);\n</script>\n```',
    correct: '```vue\n<script setup>\nimport { ref, watch, onMounted } from "vue";\nconst count = ref(0);\nwatch(count, (val) => { document.title = `Count: ${val}`; });\nonMounted(() => { /* ... */ });\n</script>\n```',
  },
  'api-no-react-import': {
    description: 'Importing from "react" or "react-dom" in a Vue project indicates a hallucinated or mixed codebase. Remove all React dependencies and use Vue equivalents.',
    wrong: '```ts\nimport React from "react";\nimport { useState } from "react";\nimport ReactDOM from "react-dom";\n```',
    correct: '```ts\nimport { ref, createApp } from "vue";\nimport App from "./App.vue";\ncreateApp(App).mount("#app");\n```',
  },
  'api-no-vue2-api': {
    description: 'Vue 2 instance properties and global APIs like this.$listeners, this.$children, this.$set, Vue.extend(), and new Vue() are removed in Vue 3. Use Composition API equivalents.',
    wrong: '```js\nconst Component = Vue.extend({\n  data() { return { items: [] }; },\n  methods: {\n    addItem() { this.$set(this.items, 0, "new"); }\n  }\n});\nnew Vue({ render: h => h(App) }).$mount("#app");\n```',
    correct: '```vue\n<script setup>\nimport { reactive } from "vue";\nconst state = reactive({ items: [] as string[] });\nfunction addItem() { state.items.unshift("new"); }\n</script>\n```',
  },
  'api-no-vue2-filters': {
    description: 'Vue 3 removed the filters feature (both Vue.filter() global registration and the pipe | syntax in templates). Use computed properties or helper functions instead.',
    wrong: '```vue\n<template>\n  <p>{{ message | capitalize }}</p>\n  <span>{{ price | currency("USD") }}</span>\n</template>\n<script>\nVue.filter("capitalize", (v) => v.toUpperCase());\n</script>\n```',
    correct: '```vue\n<template>\n  <p>{{ capitalize(message) }}</p>\n  <span>{{ formatCurrency(price, "USD") }}</span>\n</template>\n<script setup>\nconst capitalize = (v: string) => v.toUpperCase();\nconst formatCurrency = (v: number, c: string) =>\n  new Intl.NumberFormat("en", { style: "currency", currency: c }).format(v);\n</script>\n```',
  },
  'template-no-filter-pipe': {
    description: 'Vue 3 移除了模板中的管道过滤器语法 `{{ value | filter }}`。使用计算属性或方法函数替代。',
    wrong: '```\n{{ message | uppercase }}\n{{ price | currency("USD") }}\n```',
    correct: '```\n{{ uppercase(message) }}\n{{ formatCurrency(price, "USD") }}\n```',
  },
  'template-no-classname': {
    description: 'className is a React-specific attribute. In Vue templates, use the standard HTML class attribute to bind CSS classes.',
    wrong: '```vue\n<template>\n  <div className="wrapper active">\n    <span className="text">Hello</span>\n  </div>\n</template>\n```',
    correct: '```vue\n<template>\n  <div class="wrapper active">\n    <span class="text">Hello</span>\n  </div>\n</template>\n```',
  },
  'api-no-react-jsx': {
    description: 'Returning JSX elements (especially with capitalized component tags) indicates React-style rendering. Vue projects should use <template> blocks for component markup.',
    wrong: '```tsx\nfunction MyComponent() {\n  return <div className="app"><Header /><Content /></div>;\n}\n```',
    correct: '```vue\n<template>\n  <div class="app">\n    <Header />\n    <Content />\n  </div>\n</template>\n```',
  },
  'reactivity-no-static-ref': {
    description: 'Static configuration objects with 3+ keys do not need Vue reactivity. Wrapping them in ref() or reactive() adds unnecessary overhead. Use Object.freeze() to prevent mutation or declare them as plain constants.',
    wrong: "```ts\nconst CONFIG = ref({ apiUrl: 'https://api.example.com', timeout: 5000, retries: 3 })\n```",
    correct: "```ts\nconst CONFIG = Object.freeze({ apiUrl: 'https://api.example.com', timeout: 5000, retries: 3 })\n```",
  },
  'reactivity-no-mutation-in-computed': {
    description: 'Computed properties must be pure — they should only derive and return a value. Assigning to a property inside a computed creates side effects, which violates the contract and causes unexpected behavior.',
    wrong: '```ts\nconst doubled = computed(() => { count.value = x.value * 2; return count.value })\n```',
    correct: '```ts\nconst doubled = computed(() => x.value * 2)\nwatch(doubled, (val) => { count.value = val })\n```',
  },
  'reactivity-prefer-ref-for-primitives': {
    description: 'Using reactive() on primitive values (numbers, strings, booleans, null) is unnecessary and can cause issues. reactive() is designed for objects and arrays. For primitives, use ref() instead.',
    wrong: '```ts\nconst count = reactive(0)\n```',
    correct: '```ts\nconst count = ref(0)\n```',
  },
  'reactivity-no-destructure-props': {
    description: 'Destructuring props directly loses reactivity. The destructured values become plain non-reactive bindings. Use toRefs(props) to maintain reactivity, or access properties via props.x.',
    wrong: '```ts\nconst { title, count } = props\n```',
    correct: '```ts\nconst { title, count } = toRefs(props)\n```',
  },
  'template-no-vmodel-value': {
    description: 'The v-model:value syntax was deprecated in Vue 3. Use v-model or v-model:argument instead. v-model without an argument defaults to modelValue.',
    wrong: '```vue\n<Comp v-model:value="name" />\n```',
    correct: '```vue\n<Comp v-model="name" />\n<!-- or -->\n<Comp v-model:modelValue="name" />\n```',
  },
  'template-no-vfor-vif': {
    description: 'In Vue 3, v-if has higher priority than v-for on the same element, meaning v-if has no access to the v-for variable. This causes unexpected behavior. Use a <template> wrapper or computed property to filter the list.',
    wrong: '```vue\n<li v-for="item in items" v-if="item.active">{{ item.name }}</li>\n```',
    correct: '```vue\n<template v-for="item in items" :key="item.id">\n  <li v-if="item.active">{{ item.name }}</li>\n</template>\n```',
  },
  'template-vfor-key': {
    description: 'Every v-for element should have a unique and stable :key attribute. Without it, Vue cannot efficiently track node identity, leading to rendering bugs and poor performance.',
    wrong: '```vue\n<li v-for="item in items">{{ item.name }}</li>\n```',
    correct: '```vue\n<li v-for="item in items" :key="item.id">{{ item.name }}</li>\n```',
  },
  'template-no-vhtml': {
    description: 'v-html renders raw HTML and introduces XSS (Cross-Site Scripting) risks. Never use v-html with user-supplied content. If you must render HTML, sanitize it with DOMPurify or a similar library.',
    wrong: '```vue\n<div v-html="userContent"></div>\n```',
    correct: '```vue\n<!-- Prefer text interpolation -->\n<div>{{ userContent }}</div>\n<!-- If HTML is required, sanitize first -->\n<div v-html="sanitize(userContent)"></div>\n```',
  },
  'template-event-casing': {
    description: 'In Vue templates, event names should use kebab-case for consistency with HTML attribute conventions. camelCase event names work but are not idiomatic in templates.',
    wrong: '```vue\n<button @onClick="handler">Click</button>\n```',
    correct: '```vue\n<button @click="handler">Click</button>\n```',
  },
  'styles-no-deep-deprecated': {
    description: 'The >>>, /deep/, and ::v-deep deep selectors are deprecated in Vue 3. Use the :deep() pseudo-class instead for scoped style penetration.',
    wrong: '```vue\n>>> .child { color: red; }\n/deep/ .child { color: red; }\n```',
    correct: '```vue\n:deep(.child) { color: red; }\n```',
  },
  'styles-prefer-scoped': {
    description: 'Without the scoped or module attribute, styles in a Vue SFC are global and can leak into other components. Use <style scoped> to encapsulate styles.',
    wrong: '```vue\n<style>\n.foo { color: red; }\n</style>\n```',
    correct: '```vue\n<style scoped>\n.foo { color: red; }\n</style>\n```',
  },
  'perf-no-async-in-computed': {
    description: 'Vue computed properties are synchronous and must return a value immediately. Using async in a computed returns a Promise object instead of the resolved value, which breaks reactivity. Use watch() or watchEffect() for async operations.',
    wrong: '```ts\nconst data = computed(async () => {\n  const res = await fetch("/api/data");\n  return res.json();\n});\n```',
    correct: '```ts\nconst data = ref(null);\nwatch(source, async (val) => {\n  const res = await fetch(`/api/data?id=${val}`);\n  data.value = await res.json();\n});\n```',
  },
  'perf-no-sync-in-watch': {
    description: 'Async operations in watch callbacks execute after the current microtask queue, which means they may run after DOM updates. Depending on your use case, you may want to control timing with the flush option ("pre" | "post" | "sync").',
    wrong: '```ts\nwatch(source, async (val) => {\n  await fetchData(val);\n  // DOM may have already updated\n});\n```',
    correct: '```ts\nwatch(source, async (val) => {\n  await fetchData(val);\n}, { flush: "post" });\n```',
  },
};

const categoryTitles: Record<string, string> = {
  'api-alignment': 'API对齐',
  'reactivity': '响应式核心',
  'template': '模板正确性',
  'styles': '样式与穿透',
  'performance': '性能与架构',
};

export function generateSkillsMarkdown(config?: GravityConfig): string {
  const rules = defaultRules.filter(r => {
    if (config?.rules?.[r.id]?.enabled === false) return false;
    return r.enabled;
  });

  const categories = groupByCategory(rules);

  return `# vue-gravity-engine

## 角色与目标

你作为 Vue 引力引擎，目标是确保每一段生成的 Vue 代码严格遵循 Vue 3 最佳实践和官方风格指南。

- **引力中心：** Vue 3 官方文档、组合式 API、<script setup>
- **排斥模式：** Vue 2 Options API 残留、React 习惯混入、已废弃语法、不安全或低效的写法

## 自我修复流水线

输出任何 Vue 代码前，必须经历三个阶段：

1. **预检：** 在起草前回忆以下规则
2. **内部审计：** 起草后运行以下检查并默默修正所有问题
3. **最终输出：** 交付零问题代码

## 检测规则

${Object.entries(categories)
  .map(([cat, rules]) => renderCategory(categoryTitles[cat] || cat, rules))
  .join('\n')}

## 不可妥协的底线

1. Vue 3 项目中不得出现未注明的 Vue 2 代码
2. 同一 <script setup> 块内不得混合 Options API 与 Composition API
3. 绝不输出已知会引发性能问题或安全漏洞的模式（如无 key 的 v-for、未经转义的 v-html）
`;
}

function groupByCategory(rules: GravityRule[]): Record<string, GravityRule[]> {
  const groups: Record<string, GravityRule[]> = {};
  for (const rule of rules) {
    if (!groups[rule.category]) groups[rule.category] = [];
    groups[rule.category].push(rule);
  }
  return groups;
}

function renderCategory(title: string, rules: GravityRule[]): string {
  const items = rules
    .map(rule => {
      const ex = examples[rule.id];
      return `### ${rule.name}

**严重级别:** ${rule.severity}

${ex?.description ?? rule.message}

**错误示例：**
${ex?.wrong ?? '_(无示例)_'}

**正确示例：**
${ex?.correct ?? '_(无示例)_'}`;
    })
    .join('\n\n---\n\n');

  return `## ${title}\n\n${items}`;
}
