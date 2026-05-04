import type { GravityRule } from './types.js';

export const reactivityRules: GravityRule[] = [
  {
    id: 'reactivity-no-static-ref',
    name: 'No Static Ref',
    category: 'reactivity',
    severity: 'warning',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts'],
      patterns: [
        {
          type: 'regex',
          pattern: /\b(ref|reactive)\s*\(\s*\{[^}]*,[^}]*,[^}]/,
        },
      ],
    },
    fix: {
      message: '静态配置对象不需要响应式 — 使用 Object.freeze() 或直接声明',
      suggestion: '将 ref({ ... }) / reactive({ ... }) 替换为 Object.freeze({ ... }) 或直接常量声明',
    },
    markdown: {
      description:
        'Static configuration objects with 3+ keys do not need Vue reactivity. Wrapping them in ref() or reactive() adds unnecessary overhead. Use Object.freeze() to prevent mutation or declare them as plain constants.',
      wrongExample:
        "```ts\nconst CONFIG = ref({ apiUrl: 'https://api.example.com', timeout: 5000, retries: 3 })\n```",
      correctExample:
        "```ts\nconst CONFIG = Object.freeze({ apiUrl: 'https://api.example.com', timeout: 5000, retries: 3 })\n```",
    },
  },
  {
    id: 'reactivity-no-mutation-in-computed',
    name: 'No Mutation in Computed',
    category: 'reactivity',
    severity: 'error',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts'],
      patterns: [
        {
          type: 'regex',
          pattern: /\bcomputed\s*\(\s*(\(\)\s*=>|\(?\s*\w+\s*\)?)\s*\{[^}]*\.\w+\s*=/,
        },
      ],
    },
    fix: {
      message: 'computed 内部不应产生副作用 — 使用 watch 或 watchEffect',
      suggestion: 'computed 应仅返回派生值，副作用操作移到 watch() 或 watchEffect() 中',
    },
    markdown: {
      description:
        'Computed properties must be pure — they should only derive and return a value. Assigning to a property inside a computed creates side effects, which violates the contract and causes unexpected behavior.',
      wrongExample:
        '```ts\nconst doubled = computed(() => { count.value = x.value * 2; return count.value })\n```',
      correctExample:
        '```ts\nconst doubled = computed(() => x.value * 2)\nwatch(doubled, (val) => { count.value = val })\n```',
    },
  },
  {
    id: 'reactivity-prefer-ref-for-primitives',
    name: 'Prefer Ref for Primitives',
    category: 'reactivity',
    severity: 'info',
    enabled: true,
    detect: {
      filePatterns: ['*.vue', '*.ts'],
      patterns: [
        {
          type: 'regex',
          pattern: /\breactive\s*\(\s*(\d+|'[^']*'|"[^"]*"|`[^`]*`|true|false|null)\s*\)/,
        },
      ],
    },
    fix: {
      message: '基本类型建议使用 ref() 而非 reactive()',
      suggestion: '将 reactive(0) 替换为 ref(0)，对基本类型更合适且不会丢失响应性',
    },
    markdown: {
      description:
        'Using reactive() on primitive values (numbers, strings, booleans, null) is unnecessary and can cause issues. reactive() is designed for objects and arrays. For primitives, use ref() instead.',
      wrongExample: '```ts\nconst count = reactive(0)\n```',
      correctExample: '```ts\nconst count = ref(0)\n```',
    },
  },
  {
    id: 'reactivity-no-destructure-props',
    name: 'No Destructure Props',
    category: 'reactivity',
    severity: 'warning',
    enabled: true,
    detect: {
      filePatterns: ['*.vue'],
      patterns: [
        {
          type: 'regex',
          pattern: /\bconst\s*\{[^}]+\}\s*=\s*props\b/,
        },
      ],
    },
    fix: {
      message: '直接解构 props 会丢失响应性 — 使用 toRefs(props) 或通过 props.x 访问',
      suggestion: '使用 const { title, count } = toRefs(props) 或直接通过 props.x 访问',
    },
    markdown: {
      description:
        'Destructuring props directly loses reactivity. The destructured values become plain non-reactive bindings. Use toRefs(props) to maintain reactivity, or access properties via props.x.',
      wrongExample: '```ts\nconst { title, count } = props\n```',
      correctExample: '```ts\nconst { title, count } = toRefs(props)\n```',
    },
  },
];
