import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../src/prompt-builder';

describe('buildSystemPrompt', () => {
  it('defaults to plain Conventional Commits (no emoji)', () => {
    const p = buildSystemPrompt({ language: 'English', gitmoji: false });
    expect(p).toContain('<type>(<scope>): <subject>');
    expect(p).not.toContain('<emoji>');
    expect(p).toContain('feat');
  });

  it('adds emoji when gitmoji enabled', () => {
    const p = buildSystemPrompt({ language: 'English', gitmoji: true });
    expect(p).toContain('<emoji> <type>(<scope>): <subject>');
    expect(p).toContain('✨');
  });

  it('interpolates language into writing rules', () => {
    const p = buildSystemPrompt({ language: 'Swedish', gitmoji: false });
    expect(p).toContain('Must be in Swedish');
  });

  it('always includes the fixed output contract', () => {
    const p = buildSystemPrompt({ language: 'English', gitmoji: false });
    expect(p).toContain('you will ONLY output the commit message itself');
    expect(p).toContain('Output ONLY the commit message');
  });
});
