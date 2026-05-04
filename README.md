# vue-gravity-engine

灵感来自于某天晚上做梦梦到了在写Vue，但是写代码的时候提示给我好多报错，我仔细看了一眼，这些报错竟然都不是Vue的语法，是React的，我好像被AI提示的报错冲昏了头脑，或者说AI也被冲昏了头脑
我想……这些幻觉都是可以被纠正的
所以我又决定，起草一个新Project就叫
vue-gravity-engine

这个项目呢，想法是由我提出的，具体实现交给AI来做，里面包含了一篇Skill文档和Vite插件

写 Vue 项目的时候，有没有遇到过这种情况：让 AI 帮你写段代码，结果它给你冒出个 `useState`，或者模板里写了 `className`，编译直接报错，你还得花时间排查到底是哪来的 React 代码。

这个工具就是干这个的——在 AI 写代码的时候帮你把关，发现幻觉立刻告诉你哪里不对、怎么改。

## 它能检测什么

基本上常见的 AI 幻觉都覆盖了：

- **框架级**：React Hooks、JSX、className、import react 这些混进 Vue 项目的东西
- **API 级**：Vue 2 的 `$listeners`、`$set`、`Vue.extend()`、`filters` 这些废弃 API
- **模板级**：`v-model:value` 写法错误、`v-for` 和 `v-if` 写一起、列表没写 `:key`
- **样式级**：`>>>`、`/deep/` 这些废弃的深度选择器、`<style>` 没加 `scoped`
- **模式级**：`computed` 里写异步、直接解构 `props` 丢失响应性、静态数据包 `ref()`

## 实际场景举例

### 场景一：AI 给你写了段 React 代码

你让 AI 写个用户列表组件，它可能给你整出这么个东西：

```vue
<!-- AI 生成的代码 👇 -->
<template>
  <div className="user-list">
    <div v-for="user in users" className="user-card">
      {{ user.name }}
    </div>
  </div>
</template>

<script setup>
import { useState, useEffect } from 'react'

const [users, setUsers] = useState([])

useEffect(() => {
  fetch('/api/users').then(res => res.json()).then(setUsers)
}, [])
</script>

<style>
/deep/ .user-card { padding: 16px; }
</style>
```

vue-gravity-engine 会告诉你：

```
⚡ vue-gravity-engine

  src/components/UserList.vue:2:8
  error    检测到 className — Vue 模板应使用 class
           Fix: 将 className="..." 替换为 class="..."

  src/components/UserList.vue:10:1
  error    检测到 React Hooks — Vue 项目应使用 Composition API
           Fix: 使用 ref() / computed() / watch() / onMounted() 替代

  src/components/UserList.vue:11:1
  error    检测到 React 导入 — Vue 项目不应依赖 React
           Fix: 移除 react / react-dom 依赖，使用 Vue 等效模块

  src/components/UserList.vue:19:1
  error    检测到废弃的深度选择器 — 使用 :deep() 替代
           Fix: >>> .child → :deep(.child)
```

### 场景二：AI 混用了 Vue 2 的写法

```vue
<!-- AI 觉得这样写"兼容性好" 👇 -->
<script setup>
const Comp = Vue.extend({
  data() {
    return { items: [] }
  }
})

// 响应式更新？用 $set！
this.$set(this.items, 0, 'new item')
</script>

<template>
  <!-- 过滤器？安排！ -->
  <span>{{ price | currency('USD') }}</span>
</template>
```

检测结果：

```
  src/views/Product.vue:2:13
  error    检测到 Vue 2 废弃 API — 请使用 Vue 3 等效写法
           Fix: Vue.extend() → defineComponent()

  src/views/Product.vue:9:1
  error    检测到 Vue 2 废弃 API — 请使用 Vue 3 等效写法
           Fix: this.$set → 直接赋值

  src/views/Product.vue:13:18
  error    检测到模板管道过滤器语法 — Vue 3 已移除 filters
           Fix: {{ value | filter }} → {{ filter(value) }}
```

### 场景三：隐蔽的性能问题

```vue
<!-- 看着没问题，其实有坑 👇 -->
<script setup>
import { ref, computed, watch } from 'vue'

const data = ref({ apiUrl: '/api', timeout: 5000, retries: 3 })  // 静态配置不需要响应式

const result = computed(async () => {  // computed 不能异步！
  return await fetch(data.value.apiUrl)
})

const count = ref(0)
watch(count, async (val) => {  // watch 里的异步要注意 flush 时机
  await updateServer(val)
})

const props = defineProps(['title', 'content'])
const { title, content } = props  // 直接解构丢失响应性！
</script>
```

检测结果：

```
  src/views/Article.vue:4:13
  warning  静态配置对象不需要响应式 — 使用 Object.freeze() 或直接声明

  src/views/Article.vue:6:16
  error    computed 不支持异步操作 — 使用 watch 或 watchEffect

  src/views/Article.vue:10:1
  info     watch 中的异步操作可能在 DOM 更新后执行 — 注意 flush 选项

  src/views/Article.vue:14:7
  warning  直接解构 props 会丢失响应性 — 使用 toRefs(props) 或通过 props.x 访问
```

## 怎么用

### 方式一：Vite 插件（推荐开发时用）

```bash
npm install vue-gravity-engine
```

在 `vite.config.ts` 里加上：

```typescript
import vueGravityEngine from 'vue-gravity-engine/vite'

export default defineConfig({
  plugins: [
    vueGravityEngine(),
    // ...其他插件
  ],
})
```

开发的时候，每次保存文件它会自动扫描。如果发现 error 级别的问题，浏览器会弹出 overlay 提示，HMR 也会被拦住，直到你修好为止。warning 和 info 级别的只在终端显示，不打断你。

### 方式二：Skills 文档（让 AI 自己学会不犯错）

在你的 AI 编程工具（Cursor、Claude Code 等）的项目根目录放一份 skills 文档，AI 写代码前会先读一遍，从源头减少幻觉。

```bash
npx vue-gravity generate-skills -o skills/vue-gravity-engine.md
```

生成的文档会根据你的配置自动调整——你关掉的规则不会出现在文档里。

### 方式三：CLI 全量扫描

适合在 CI 里跑，或者提交前检查整个项目：

```bash
npx vue-gravity check
```

输出效果：

```
⚡ vue-gravity-engine

  Scanned: 47 files in 0.8s

  ❌ Errors (2)
  src/components/Dashboard.vue:15:1
  error    检测到 React Hooks — Vue 项目应使用 Composition API
           Fix: 使用 ref() / computed() / watch() / onMounted() 替代

  src/views/Login.vue:22:3
  error    检测到 className — Vue 模板应使用 class
           Fix: 将 className="..." 替换为 class="..."

  ⚠️  Warnings (1)
  src/components/Table.vue:30:5
  warning  v-for 缺少 :key — 列表渲染必须提供唯一稳定的 key
```

加 `--report` 输出 JSON 报告，加 `--ci` 有 error 时返回退出码 1，方便接入 CI 流水线。

### 在 Cursor 里用

把生成的 skills 文档放到 `.cursor/rules/vue-gravity-engine.md`，Cursor 写 Vue 代码时会自动参考这份文档，从源头减少幻觉。配合 Vite 插件一起用，等于上了双保险。

## 两种方式的关系

Vite 插件和 Skills 文档读的是同一套规则，覆盖范围完全一样。你可以只用其中一个，也可以两个都用：

| 场景 | 只用 Skills | 只用 Vite 插件 | 都用 |
|------|-----------|-------------|------|
| AI 写了 useState | AI 自己改 | 插件拦住 | 双保险 |
| AI 写了 className | AI 自己改 | 插件拦住 | 双保险 |

## 规则配置

不想用默认配置的话，在项目根目录创建 `gravity.config.ts`：

```typescript
export default {
  rules: {
    // 关掉某条规则
    'template-event-casing': { enabled: false },
    // 改严重级别
    'styles-prefer-scoped': { severity: 'warning' },
  },
  ignore: ['src/legacy/**'],
}
```

## 检测原理

规则是声明式定义的，一份规则被三个消费者共享：

```
规则定义 → Vite 插件（实时检测）
        → CLI（全量扫描）
        → Skills 生成器（markdown 文档）
```

检测用的是正则快速扫描，对注释和字符串里的匹配会自动跳过，不会误报。

## 测试

```bash
npm test
```

目前有 106 项测试，覆盖每条规则的正向匹配、零误报验证和边界用例。

## License

Apache License 2.0

