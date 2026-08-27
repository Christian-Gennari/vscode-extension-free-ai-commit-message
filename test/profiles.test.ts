import { describe, it, expect } from 'vitest';
import { DEFAULT_PROFILES, resolveProfiles, assertValidProfile, isLocalhost } from '../src/profiles';

describe('profiles', () => {
  it('includes built-in default presets with high-quota free tiers', () => {
    const resolved = resolveProfiles({});
    expect(resolved.gemini).toBeDefined();
    expect(resolved.gemini.kind).toBe('gemini');
    expect(resolved.gemini.model).toBe('gemini-2.0-flash-lite');

    expect(resolved.openrouter).toBeDefined();
    expect(resolved.openrouter.model).toBe('openrouter/free');

    expect(resolved.groq).toBeDefined();
    expect(resolved.groq.model).toBe('llama-3.3-70b-versatile');

    expect(resolved.ollama).toBeDefined();
    expect(resolved.ollama.baseUrl).toBe('http://localhost:11434/v1');
    expect(resolved.ollama.model).toBe('qwen2.5-coder:3b');

    expect(resolved.github).toBeDefined();
    expect(resolved.github.baseUrl).toBe('https://models.inference.ai.azure.com');
    expect(resolved.github.model).toBe('gpt-4o-mini');

    expect(resolved.deepseek).toBeDefined();
    expect(resolved.deepseek.model).toBe('deepseek-chat');

    expect(resolved.openai).toBeDefined();
    expect(resolved.openai.kind).toBe('openai-compatible');
    expect(resolved.openai.model).toBe('gpt-4o-mini');

    expect(resolved.claude).toBeDefined();
    expect(resolved.claude.kind).toBe('claude');
    expect(resolved.claude.model).toBe('claude-3-5-haiku-20241022');
  });

  it('performs per-profile deep merge so partial overrides retain kind and baseUrl', () => {
    const resolved = resolveProfiles({
      openai: { model: 'gpt-4.1-mini' },
    });
    expect(resolved.openai.model).toBe('gpt-4.1-mini');
    expect(resolved.openai.kind).toBe('openai-compatible');
    expect(resolved.openai.baseUrl).toBe('https://api.openai.com/v1');
  });

  it('allows user to define custom profiles', () => {
    const resolved = resolveProfiles({
      local_qwen: { kind: 'openai-compatible', baseUrl: 'http://localhost:11434/v1', model: 'qwen2.5-coder:7b' },
    });
    expect(resolved.local_qwen).toBeDefined();
    expect(resolved.local_qwen.model).toBe('qwen2.5-coder:7b');
  });

  it('assertValidProfile validates profile kind, model, temperature, and protocols', () => {
    expect(() => assertValidProfile('valid', { kind: 'openai-compatible', model: 'gpt-4o' })).not.toThrow();
    expect(() => assertValidProfile('', { kind: 'openai-compatible', model: 'gpt-4o' })).toThrow(/Profile name/);
    expect(() => assertValidProfile('missing', undefined)).toThrow(/not configured/);
    expect(() => assertValidProfile('invalid-kind', { kind: 'unsupported' as any, model: 'foo' })).toThrow(/invalid kind/);
    expect(() => assertValidProfile('missing-model', { kind: 'gemini', model: '' })).toThrow(/must specify a model/);
    expect(() => assertValidProfile('invalid-temp', { kind: 'gemini', model: 'gemini-2.0', temperature: 5 })).toThrow(/temperature/);
    expect(() => assertValidProfile('invalid-url', { kind: 'openai-compatible', model: 'gpt-4o', baseUrl: 'not a url' })).toThrow(/baseUrl/);
    expect(() => assertValidProfile('ftp-url', { kind: 'openai-compatible', model: 'gpt-4o', baseUrl: 'ftp://example.com' })).toThrow(/protocol/);
    expect(() => assertValidProfile('gemini-with-url', { kind: 'gemini', model: 'gemini-2.0', baseUrl: 'https://gemini.com' })).toThrow(/does not support custom baseUrl/);
  });

  it('isLocalhost correctly validates local hostnames and rejects lookalikes', () => {
    expect(isLocalhost('http://localhost:11434/v1')).toBe(true);
    expect(isLocalhost('http://127.0.0.1:11434/v1')).toBe(true);
    expect(isLocalhost('http://[::1]:11434/v1')).toBe(true);
    expect(isLocalhost('https://api.openai.com/v1')).toBe(false);
    expect(isLocalhost('https://localhost.attacker.com/v1')).toBe(false);
    expect(isLocalhost('')).toBe(false);
    expect(isLocalhost(undefined)).toBe(false);
  });
});
