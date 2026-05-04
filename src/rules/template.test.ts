import { describe, it, expect } from 'vitest';
import { GravityEngine } from '../engine/scanner.js';
import { GravityRegistry } from './registry.js';
import { templateRules } from './template.js';

function createEngine() {
  const registry = new GravityRegistry();
  templateRules.forEach(r => registry.register(r));
  return new GravityEngine(registry);
}

describe('template-no-vmodel-value', () => {
  it('detects v-model:value usage', () => {
    const engine = createEngine();
    const code = `<template><Comp v-model:value="name" /></template>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'template-no-vmodel-value');
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe('error');
  });

  it('does NOT trigger on plain v-model', () => {
    const engine = createEngine();
    const code = `<template><Comp v-model="name" /></template>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'template-no-vmodel-value');
    expect(matched).toHaveLength(0);
  });

  it('does NOT trigger on v-model:modelValue', () => {
    const engine = createEngine();
    const code = `<template><Comp v-model:modelValue="name" /></template>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'template-no-vmodel-value');
    expect(matched).toHaveLength(0);
  });

  it('does NOT trigger on .ts files', () => {
    const engine = createEngine();
    const code = `const x = 'v-model:value'`;
    const findings = engine.scan('utils.ts', code);
    const matched = findings.filter(f => f.ruleId === 'template-no-vmodel-value');
    expect(matched).toHaveLength(0);
  });
});

describe('template-no-vfor-vif', () => {
  it('detects v-for followed by v-if on same element', () => {
    const engine = createEngine();
    const code = `<template><li v-for="item in items" v-if="item.active">{{ item.name }}</li></template>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'template-no-vfor-vif');
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe('error');
  });

  it('detects v-if followed by v-for on same element', () => {
    const engine = createEngine();
    const code = `<template><li v-if="item.active" v-for="item in items">{{ item.name }}</li></template>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'template-no-vfor-vif');
    expect(matched).toHaveLength(1);
  });

  it('does NOT trigger when v-for and v-if are on different elements', () => {
    const engine = createEngine();
    const code = `<template><div v-if="show"><li v-for="item in items">{{ item.name }}</li></div></template>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'template-no-vfor-vif');
    expect(matched).toHaveLength(0);
  });
});

describe('template-vfor-key', () => {
  it('detects v-for without :key', () => {
    const engine = createEngine();
    const code = `<template><li v-for="item in items">{{ item.name }}</li></template>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'template-vfor-key');
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe('warning');
  });

  it('does NOT trigger when :key is present', () => {
    const engine = createEngine();
    const code = `<template><li v-for="item in items" :key="item.id">{{ item.name }}</li></template>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'template-vfor-key');
    expect(matched).toHaveLength(0);
  });
});

describe('template-no-vhtml', () => {
  it('detects v-html usage', () => {
    const engine = createEngine();
    const code = `<template><div v-html="content"></div></template>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'template-no-vhtml');
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe('warning');
  });

  it('does NOT trigger on normal interpolation', () => {
    const engine = createEngine();
    const code = `<template><div>{{ content }}</div></template>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'template-no-vhtml');
    expect(matched).toHaveLength(0);
  });
});

describe('template-event-casing', () => {
  it('detects camelCase event names', () => {
    const engine = createEngine();
    const code = `<template><button @onClick="handler">Click</button></template>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'template-event-casing');
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe('info');
  });

  it('does NOT trigger on lowercase event names', () => {
    const engine = createEngine();
    const code = `<template><button @click="handler">Click</button></template>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'template-event-casing');
    expect(matched).toHaveLength(0);
  });

  it('does NOT trigger on kebab-case event names', () => {
    const engine = createEngine();
    const code = `<template><button @my-event="handler">Click</button></template>`;
    const findings = engine.scan('App.vue', code);
    const matched = findings.filter(f => f.ruleId === 'template-event-casing');
    expect(matched).toHaveLength(0);
  });
});
