# vue-gravity-engine

写 Vue 项目的时候，有没有遇到过这种情况：让 AI 帮你写段代码，结果它给你冒出个 `useState`，或者模板里写了 `className`，编译直接报错，你还得花时间排查到底是哪来的 React 代码。

这个工具就是干这个的——在 AI 写代码的时候帮你把关，发现幻觉立刻告诉你哪里不对、怎么改。

## 它能检测什么

基本上常见的 AI 幻觉都覆盖了：

- **框架级**：React Hooks、JSX、className、import react 这些混进 Vue 项目的东西
- **API 级**：Vue 2 的 `$listeners`、`$set`、`Vue.extend()`、`filters` 这些废弃 API
- **模板级**：`v-model:value` 写法错误、`v-for` 和 `v-if` 写一起、列表没写 `:key`
- **样式级**：`>>>`、`/deep/` 这些废弃的深度选择器、`<style>` 没加 `scoped`
- **模式级**：`computed` 里写异步、直接解构 `props` 丢失响应性、静态数据包 `ref()`

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

加 `--report` 可以输出 JSON 报告，加 `--ci` 有 error 时会返回退出码 1，方便接入 CI 流水线。

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

目前有 104 项测试，覆盖每条规则的正向匹配、零误报验证和边界用例。

## License

MIT
