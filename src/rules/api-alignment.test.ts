import { describe, it, expect } from 'vitest';
import { GravityEngine } from '../engine/scanner.js';
import { GravityRegistry } from './registry.js';
import { apiAlignmentRules } from './api-alignment.js';

function createEngine() {
  const registry = new GravityRegistry();
  apiAlignmentRules.forEach(r => registry.register(r));
  return new GravityEngine(registry);
}

describe('api-no-react-hooks', () => {
  it('detects useState in .vue file', () => {
    const engine = createEngine();
    const code = `<script setup>\nconst [count, setCount] = useState(0)\n</script>`;
    const findings = engine.scan('App.vue', code);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('api-no-react-hooks');
    expect(findings[0].severity).toBe('error');
  });

  it('detects useEffect in .ts file', () => {
    const engine = createEngine();
    const code = `useEffect(() => {\n  console.log("mounted");\n}, []);`;
    const findings = engine.scan('utils.ts', code);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('api-no-react-hooks');
  });

  it('detects useContext in .tsx file', () => {
    const engine = createEngine();
    const code = `const ctx = useContext(MyContext)`;
    const findings = engine.scan('Component.tsx', code);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('api-no-react-hooks');
  });

  it('does NOT match ref() from Vue', () => {
    const engine = createEngine();
    const code = `import { ref, computed } from 'vue'\nconst count = ref(0)\nconst doubled = computed(() => count.value * 2)`;
    const findings = engine.scan('App.vue', code);
    const hookFindings = findings.filter(f => f.ruleId === 'api-no-react-hooks');
    expect(hookFindings).toHaveLength(0);
  });
});

describe('api-no-react-import', () => {
  it('detects import React from "react"', () => {
    const engine = createEngine();
    const code = `import React from 'react'`;
    const findings = engine.scan('App.vue', code);
    const reactImports = findings.filter(f => f.ruleId === 'api-no-react-import');
    expect(reactImports).toHaveLength(1);
    expect(reactImports[0].severity).toBe('error');
  });

  it('detects named import from "react"', () => {
    const engine = createEngine();
    const code = `import { useState, useEffect } from 'react'`;
    const findings = engine.scan('utils.ts', code);
    const reactImports = findings.filter(f => f.ruleId === 'api-no-react-import');
    expect(reactImports).toHaveLength(1);
  });

  it('detects react-dom import', () => {
    const engine = createEngine();
    const code = `import ReactDOM from 'react-dom'`;
    const findings = engine.scan('main.tsx', code);
    const reactImports = findings.filter(f => f.ruleId === 'api-no-react-import');
    expect(reactImports).toHaveLength(1);
  });

  it('does NOT match import from "vue"', () => {
    const engine = createEngine();
    const code = `import { ref, computed, watch } from 'vue'`;
    const findings = engine.scan('App.vue', code);
    const reactImports = findings.filter(f => f.ruleId === 'api-no-react-import');
    expect(reactImports).toHaveLength(0);
  });
});

describe('api-no-vue2-api', () => {
  it('detects this.$listeners', () => {
    const engine = createEngine();
    const code = `const listeners = this.$listeners`;
    const findings = engine.scan('Component.vue', code);
    expect(findings.some(f => f.ruleId === 'api-no-vue2-api')).toBe(true);
  });

  it('detects this.$children', () => {
    const engine = createEngine();
    const code = `const kids = this.$children`;
    const findings = engine.scan('Component.vue', code);
    expect(findings.some(f => f.ruleId === 'api-no-vue2-api')).toBe(true);
  });

  it('detects this.$set()', () => {
    const engine = createEngine();
    const code = `this.$set(this.items, 0, 'new')`;
    const findings = engine.scan('Component.vue', code);
    expect(findings.some(f => f.ruleId === 'api-no-vue2-api')).toBe(true);
  });

  it('detects Vue.extend()', () => {
    const engine = createEngine();
    const code = `const Comp = Vue.extend({\n  data() { return {}; }\n})`;
    const findings = engine.scan('Component.ts', code);
    expect(findings.some(f => f.ruleId === 'api-no-vue2-api')).toBe(true);
  });

  it('detects new Vue()', () => {
    const engine = createEngine();
    const code = `new Vue({\n  render: h => h(App)\n}).$mount('#app')`;
    const findings = engine.scan('main.js', code);
    expect(findings.some(f => f.ruleId === 'api-no-vue2-api')).toBe(true);
  });

  it('detects this.$on()', () => {
    const engine = createEngine();
    const code = `this.$on('event', handler)`;
    const findings = engine.scan('Component.vue', code);
    expect(findings.some(f => f.ruleId === 'api-no-vue2-api')).toBe(true);
  });
});

describe('api-no-vue2-filters', () => {
  it('detects Vue.filter()', () => {
    const engine = createEngine();
    const code = `Vue.filter('uppercase', (v) => v.toUpperCase())`;
    const findings = engine.scan('filters.ts', code);
    const filterFindings = findings.filter(f => f.ruleId === 'api-no-vue2-filters');
    expect(filterFindings.length).toBeGreaterThanOrEqual(1);
  });

  it('detects pipe syntax in template', () => {
    const engine = createEngine();
    const code = `<template>\n  <p>{{ value | uppercase }}</p>\n</template>`;
    const findings = engine.scan('App.vue', code);
    const filterFindings = findings.filter(f => f.ruleId === 'api-no-vue2-filters');
    expect(filterFindings.length).toBeGreaterThanOrEqual(1);
  });
});

describe('template-no-classname', () => {
  it('detects className in .vue file', () => {
    const engine = createEngine();
    const code = `<template>\n  <div className="wrapper"></div>\n</template>`;
    const findings = engine.scan('App.vue', code);
    expect(findings.some(f => f.ruleId === 'template-no-classname')).toBe(true);
  });

  it('does NOT trigger on class= in .vue file', () => {
    const engine = createEngine();
    const code = `<template>\n  <div class="wrapper"></div>\n</template>`;
    const findings = engine.scan('App.vue', code);
    expect(findings.some(f => f.ruleId === 'template-no-classname')).toBe(false);
  });

  it('does NOT trigger on .ts files', () => {
    const engine = createEngine();
    const code = `const cls = className="foo"`;
    const findings = engine.scan('utils.ts', code);
    expect(findings.some(f => f.ruleId === 'template-no-classname')).toBe(false);
  });
});

describe('api-no-react-jsx', () => {
  it('detects JSX return with capitalized tag', () => {
    const engine = createEngine();
    const code = `function App() {\n  return <Header title="app" />;\n}`;
    const findings = engine.scan('App.vue', code);
    const jsxFindings = findings.filter(f => f.ruleId === 'api-no-react-jsx');
    expect(jsxFindings).toHaveLength(1);
    expect(jsxFindings[0].severity).toBe('warning');
  });

  it('detects JSX return in .tsx file', () => {
    const engine = createEngine();
    const code = `function Component() {\n  return <Button onClick={handler}>Click</Button>;\n}`;
    const findings = engine.scan('Component.tsx', code);
    const jsxFindings = findings.filter(f => f.ruleId === 'api-no-react-jsx');
    expect(jsxFindings).toHaveLength(1);
  });
});

describe('Zero false positives — standard Composition API', () => {
  it('clean Vue 3 code triggers NO rules', () => {
    const engine = createEngine();
    const code = [
      '<template>',
      '  <div class="app">',
      '    <h1>{{ title }}</h1>',
      '    <p>Count: {{ count }}</p>',
      '    <button @click="increment">+1</button>',
      '  </div>',
      '</template>',
      '',
      '<script setup lang="ts">',
      "import { ref, computed, watch, onMounted } from 'vue';",
      '',
      "const title = ref('Hello Vue 3');",
      'const count = ref(0);',
      'const doubled = computed(() => count.value * 2);',
      '',
      'function increment() {',
      '  count.value++;',
      '}',
      '',
      'watch(count, (val) => {',
      '  console.log("count changed:", val);',
      '});',
      '',
      'onMounted(() => {',
      '  console.log("mounted");',
      '});',
      '</script>',
      '',
      '<style scoped>',
      '.app { color: red; }',
      '</style>',
    ].join('\n');

    const findings = engine.scan('App.vue', code);
    expect(findings).toHaveLength(0);
  });

  it('clean TypeScript composable triggers NO rules', () => {
    const engine = createEngine();
    const code = [
      "import { ref, computed } from 'vue';",
      '',
      'export function useCounter(initial = 0) {',
      '  const count = ref(initial);',
      '  const doubled = computed(() => count.value * 2);',
      '',
      '  function increment() { count.value++; }',
      '  function decrement() { count.value--; }',
      '',
      '  return { count, doubled, increment, decrement };',
      '}',
    ].join('\n');

    const findings = engine.scan('useCounter.ts', code);
    expect(findings).toHaveLength(0);
  });
});
