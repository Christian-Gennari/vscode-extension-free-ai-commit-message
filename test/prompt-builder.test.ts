import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../src/prompt-builder';

describe('buildSystemPrompt', () => {
  it('defaults to plain Conventional Commits (no emoji)', () => {
    const p = buildSystemPrompt({ language: 'English', gitmoji: false, customPrompt: '' });
    expect(p).toContain('<type>(<scope>): <subject>');
    expect(p).not.toContain('<emoji>');
    expect(p).toContain('feat');
  });

  it('adds emoji when gitmoji enabled', () => {
    const p = buildSystemPrompt({ language: 'English', gitmoji: true, customPrompt: '' });
    expect(p).toContain('<emoji> <type>(<scope>): <subject>');
    expect(p).toContain('✨');
  });

  it('interpolates language into writing rules', () => {
    const p = buildSystemPrompt({ language: 'Swedish', gitmoji: false, customPrompt: '' });
    expect(p).toContain('Must be in Swedish');
  });

  it('custom prompt replaces everything', () => {
    const p = buildSystemPrompt({ language: 'English', gitmoji: false, customPrompt: 'Be terse.' });
    expect(p).toBe('Be terse.');
  });

  it('supports multiline custom prompts with escaped newlines', () => {
    const p = buildSystemPrompt({ language: 'English', gitmoji: false, customPrompt: 'Line1\\nLine2' });
    expect(p).toBe('Line1\nLine2');
  });
});
