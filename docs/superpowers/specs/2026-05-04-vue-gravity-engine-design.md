# vue-gravity-engine 设计文档

## 概述

vue-gravity-engine 是一个 Vue 代码幻觉检测工具，用于在 AI 生成代码时自动检测并提示 React 混入、Vue 2 残留、废弃 API、样式错误和架构缺陷等问题。

**核心原则：** 不干预人工写的代码，只检测模式级错误。通过零误报保证正常人工编码不受影响。

**两种分发方式：**
1. npm 包（Vite 插件 + CLI）
2. Skills 文档（markdown，供 AI 工具上下文使用）

**核心设计：** 两种分发方式共享同一份规则引擎，确保覆盖范围 100% 一致。用户可独立使用任意一种或两者组合，防护效果相同。

## 检测层级

全层级覆盖：

| 层级 | 示例 | 严重级别 |
|------|------|---------|
| 框架级 | React Hooks、JSX、className | Error |
| 生态级 | 使用未安装的组件库 | Warning |
| API级 | Vue 不存在的 API、Vue 2 废弃 API | Error |
| 模式级 | Options API 混用、v-for 无 key | Warning/Info |

## 架构

```
规则定义 (rules/) ──┬──→ Vite 插件（正向管道：实时检测 + 分级提示）
                    ├──→ CLI（反向管道：全量扫描 + 报告）
                    └──→ Skills 生成器（markdown 文档：AI 上下文引导）
```

### 项目结构

```
vue-gravity-engine/
├── src/
│   ├── rules/                    # 规则定义（声明式）
│   │   ├── types.ts              # 规则类型定义
│   │   ├── registry.ts           # 规则注册中心
│   │   ├── api-alignment.ts      # API 对齐规则
│   │   ├── reactivity.ts         # 响应式规则
│   │   ├── template.ts           # 模板规则
│   │   ├── styles.ts             # 样式规则
│   │   └── performance.ts        # 性能与架构规则
│   ├── engine/                   # 检测引擎
│   │   ├── scanner.ts            # 代码扫描器
│   │   ├── classifier.ts         # 严重级别分类器
│   │   └── reporter.ts           # 报告生成器
│   ├── vite-plugin.ts            # Vite 插件入口
│   ├── cli.ts                    # CLI 入口
│   ├── skills-generator.ts       # Skills markdown 生成器
│   └── config.ts                 # 配置加载
├── skills/
│   └── vue-gravity-engine.md     # 自动生成的 skills 文档
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## 规则引擎

### 规则接口

```typescript
interface GravityRule {
  id: string;                    // 唯一标识，如 "api-no-react-hooks"
  name: string;                  // 人类可读名称
  category: 'api-alignment' | 'reactivity' | 'template' | 'styles' | 'performance';
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;              // 默认开启，用户可配置关闭

  detect: {
    filePatterns: string[];      // 适用文件，如 ["*.vue", "*.ts"]
    patterns: PatternMatch[];    // 匹配模式（正则 or AST 节点类型）
    astCheck?: (ast: any) => Finding[];  // 可选的 AST 深度检查
  };

  fix: {
    message: string;             // 提示信息
    suggestion: string;          // 修复建议
    docsUrl?: string;            // 文档链接
  };

  markdown: {
    description: string;         // 规则描述（用于生成 skills 文档）
    wrongExample: string;        // 错误示例
    correctExample: string;      // 正确示例
  };
}
```

### 规则注册中心

```typescript
class GravityRegistry {
  private rules: Map<string, GravityRule> = new Map();

  register(rule: GravityRule): void;
  getRules(filter?: { category?: string; severity?: string }): GravityRule[];
  configure(id: string, options: { enabled?: boolean; severity?: string }): void;
}
```

### 用户配置

`gravity.config.ts`：

```typescript
export default {
  rules: {
    'api-no-react-hooks': { enabled: true, severity: 'error' },
    'api-no-vue2-filters': { enabled: true, severity: 'warning' },
    'perf-no-vfor-without-key': { enabled: false },
  },
  ignore: ['src/legacy/**'],
};
```

## Vite 插件（正向管道）

在开发服务器运行时，对每次文件变更做实时检测。

### 行为分级

| 级别 | 开发时（HMR） | 构建时（vite build） |
|------|-------------|-------------------|
| Error | 阻止热更新 + 浏览器 overlay 报错 | 构建失败 |
| Warning | 终端黄色提示 | 终端黄色提示 |
| Info | 终端灰色提示 | 终端灰色提示 |

### 输出格式

```
⚡ vue-gravity-engine

  src/components/UserCard.vue:12:5
  error  检测到 React Hooks useState → 使用 ref() 替代
         const [name, setName] = useState('')
         修复: const name = ref('')
         详见: https://vuejs.org/api/reactivity-core.html#ref
```

## CLI（反向管道）

独立命令行工具，全量扫描项目并输出报告。

### 命令

```
vue-gravity check           # 扫描当前目录，终端输出
vue-gravity check --report  # 生成 JSON/HTML 报告文件
vue-gravity check --fix     # 自动修复可修复的问题
vue-gravity check src/      # 只扫描指定目录
vue-gravity generate-skills # 生成 skills markdown 文档
```

### 报告结构

```json
{
  "timestamp": "2026-05-04T12:00:00Z",
  "scannedFiles": 47,
  "duration": "1.2s",
  "summary": { "errors": 3, "warnings": 5, "infos": 2 },
  "findings": [
    {
      "file": "src/components/Dashboard.vue",
      "line": 15,
      "column": 5,
      "ruleId": "api-no-react-hooks",
      "severity": "error",
      "message": "检测到 React Hooks useState",
      "suggestion": "使用 ref() 替代",
      "fixable": true
    }
  ]
}
```

CI 友好：有 error 时退出码为 1。

## Skills 生成器

从同一份规则定义自动生成 markdown 文档。

生成的文档包含：
1. 角色定义与目标
2. 自我修复流水线（预检 → 内部审计 → 最终输出）
3. 按分类组织的检测规则（每条含错误/正确示例）
4. 不可妥协的底线

生成的 skills 文档会自动尊重用户配置——关闭的规则不会出现在文档中。

## 检测引擎

采用正则 + AST 混合策略：

- **正则快速扫描**：所有规则的第一层，快速过滤明显模式
- **AST 深度检查**：仅 .vue 文件，仅需要结构分析的规则（v-for + v-if 同元素、Options API 混用、computed 副作用等）

| 检测目标 | 正则 | AST |
|---------|------|-----|
| React Hooks (useState) | ✅ | 不需要 |
| className in template | ✅ | 不需要 |
| v-for + v-if 同元素 | ❌ | ✅ |
| Options API 混用 | ❌ | ✅ |
| computed 有副作用 | ❌ | ✅ |

性能：开发时只扫描变更文件（<10ms），构建时全量扫描可开缓存。

## 效果对等原则

Skills 和 Vite 插件共享同一份规则清单，覆盖范围 100% 一致：

| 场景 | 只用 Skills | 只用 Vite 插件 | 两者都用 |
|------|-----------|-------------|---------|
| AI 写 useState | AI 自我修正 | 插件拦截 | 双保险 |
| AI 写 className | AI 自我修正 | 插件拦截 | 双保险 |
| AI 写 v-for 无 key | AI 自我修正 | 插件拦截 | 双保险 |

用户可独立使用任意一种，防护效果不打折。

## 测试策略

1. **规则单测**：每条规则必须有正向匹配、零误报、边界用例测试
2. **集成测试**：模拟真实 Vue 文件，验证多规则协同检测
3. **零误报测试**：标准 Composition API 代码不触发任何规则
4. **CLI 集成**：验证退出码、报告格式

## 技术栈

- TypeScript + tsup（库构建）
- @vue/compiler-sfc（Vue SFC 解析）
- TypeScript Compiler API（AST 分析）
- Commander（CLI）
- Vitest（测试）
