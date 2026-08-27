import { describe, it, expect } from 'vitest';
import { DEFAULT_PROFILES, resolveProfiles, assertValidProfile } from '../src/profiles';

describe('profiles', () => {
  it('includes built-in default presets', () => {
    const resolved = resolveProfiles({});
    expect(resolved.openai).toBeDefined();
    expect(resolved.openai.kind).toBe('openai-compatible');
    expect(resolved.openai.model).toBe('gpt-4o-mini');
    expect(resolved.groq).toBeDefined();
    expect(resolved.openrouter).toBeDefined();
    expect(resolved.deepseek).toBeDefined();
    expect(resolved.ollama).toBeDefined();
    expect(resolved.ollama.baseUrl).toBe('http://localhost:11434/v1');
    expect(resolved.gemini).toBeDefined();
    expect(resolved.gemini.kind).toBe('gemini');
    expect(resolved.claude).toBeDefined();
    expect(resolved.claude.kind).toBe('claude');
  });

  it('allows user profiles to override default presets', () => {
    const resolved = resolveProfiles({
      openai: { kind: 'openai-compatible', baseUrl: 'https://custom.openai.com/v1', model: 'gpt-4o' }
    });
    expect(resolved.openai.baseUrl).toBe('https://custom.openai.com/v1');
    expect(resolved.openai.model).toBe('gpt-4o');
  });

  it('allows user to define custom profiles', () => {
    const resolved = resolveProfiles({
      local_qwen: { kind: 'openai-compatible', baseUrl: 'http://localhost:11434/v1', model: 'qwen2.5-coder:3b' }
    });
    expect(resolved.local_qwen).toBeDefined();
    expect(resolved.local_qwen.model).toBe('qwen2.5-coder:3b');
  });

  it('assertValidProfile validates profile kind and model', () => {
    expect(() => assertValidProfile('valid', { kind: 'openai-compatible', model: 'gpt-4o' })).not.toThrow();
    expect(() => assertValidProfile('missing', undefined)).toThrow(/not configured/);
    expect(() => assertValidProfile('invalid-kind', { kind: 'unsupported' as any, model: 'foo' })).toThrow(/invalid kind/);
    expect(() => assertValidProfile('missing-model', { kind: 'gemini', model: '' })).toThrow(/must specify a model/);
  });
});
