import { GravityRegistry } from './rules/registry.js';
import type { GravityRule } from './rules/types.js';

export function generateSkillsMarkdown(registry: GravityRegistry): string {
  const rules = registry.getRules();
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

${renderCategory('API对齐', categories['api-alignment'])}
${renderCategory('响应式核心', categories['reactivity'])}
${renderCategory('模板正确性', categories['template'])}
${renderCategory('样式与穿透', categories['styles'])}
${renderCategory('性能与架构', categories['performance'])}

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

function renderCategory(title: string, rules: GravityRule[] | undefined): string {
  if (!rules || rules.length === 0) return '';

  const items = rules
    .map(
      rule => `### ${rule.name}

**严重级别:** ${rule.severity}

${rule.markdown.description}

**错误示例：**
\`\`\`ts
${rule.markdown.wrongExample}
\`\`\`

**正确示例：**
\`\`\`ts
${rule.markdown.correctExample}
\`\`\`
`
    )
    .join('\n---\n\n');

  return `## ${title}\n\n${items}`;
}
