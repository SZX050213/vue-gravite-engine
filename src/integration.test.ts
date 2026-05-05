import { describe, it, expect } from 'vitest';
import { GravityEngine } from './engine/scanner.js';
import { generateSkillsMarkdown } from './skills-generator.js';
import { defaultRules } from './rules.js';

describe('Integration: multi-rule detection', () => {
  const engine = new GravityEngine();

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
const items = ref([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }])
const doubled = computed(() => items.value.length * 2)
watch(items, (val) => { console.log('changed', val.length) }, { flush: 'pre' })
</script>
<style scoped>
.wrapper { padding: 1rem; }
:deep(.child) { color: blue; }
</style>`;

    const findings = engine.scan('App.vue', code);
    expect(findings).toHaveLength(0);
  });
});

describe('Integration: skills and rules consistency', () => {
  it('every rule appears in the skills document', () => {
    const markdown = generateSkillsMarkdown();
    for (const rule of defaultRules) {
      expect(markdown).toContain(rule.name);
    }
  });
});
