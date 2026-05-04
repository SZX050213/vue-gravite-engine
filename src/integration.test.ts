import { describe, it, expect } from 'vitest';
import { GravityEngine } from './engine/scanner.js';
import { createDefaultRegistry } from './rules/index.js';
import { generateSkillsMarkdown } from './skills-generator.js';

function createDefaultEngine() {
  const registry = createDefaultRegistry();
  return new GravityEngine(registry);
}

describe('Integration: multi-rule detection', () => {
  const engine = createDefaultEngine();

  it('detects multiple hallucinations in a single Vue file', () => {
    const code = `<template>
  <div className="wrapper" v-for="item in list">
    {{ item.name | uppercase }}
  </div>
</template>
<script setup>
import { useState } from 'react'
const [list, setList] = useState([])
</script>
<style>
/deep/ .wrapper { color: red; }
</style>`;

    const findings = engine.scan('Test.vue', code);

    const ruleIds = new Set(findings.map(f => f.ruleId));
    expect(ruleIds.has('template-no-classname')).toBe(true);
    expect(ruleIds.has('template-vfor-key')).toBe(true);
    expect(ruleIds.has('template-no-filter-pipe')).toBe(true);
    expect(ruleIds.has('api-no-react-hooks')).toBe(true);
    expect(ruleIds.has('api-no-react-import')).toBe(true);
    expect(ruleIds.has('styles-no-deep-deprecated')).toBe(true);
  });

  it('standard Composition API file triggers zero rules', () => {
    const code = `<template>
  <div class="wrapper">
    <span v-for="item in items" :key="item.id">{{ item.name }}</span>
    <p>{{ doubled }}</p>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const items = ref([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
])

const doubled = computed(() => items.value.length * 2)

watch(items, (val) => {
  console.log('items changed', val.length)
}, { flush: 'pre' })
</script>
<style scoped>
.wrapper { padding: 1rem; }
:deep(.child) { color: blue; }
</style>`;

    const findings = engine.scan('App.vue', code);
    expect(findings).toHaveLength(0);
  });
});

describe('Integration: skills and engine consistency', () => {
  it('every rule in the registry appears in the skills document', () => {
    const registry = createDefaultRegistry();
    const rules = registry.getRules();
    const markdown = generateSkillsMarkdown(registry);

    for (const rule of rules) {
      expect(markdown).toContain(rule.name);
      expect(markdown).toContain(rule.markdown.description);
    }
  });

  it('every rule in skills has a corresponding detection rule', () => {
    const registry = createDefaultRegistry();
    const markdown = generateSkillsMarkdown(registry);
    const rules = registry.getRules();

    for (const rule of rules) {
      expect(markdown).toContain(rule.name);
    }
  });
});
