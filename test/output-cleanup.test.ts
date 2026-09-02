import { describe, expect, it } from 'vitest';
import {
  cleanAndValidateCommitMessage,
  isValidConventionalCommitMessage,
} from '../src/output-cleanup';

describe('commit output cleanup', () => {
  it('accepts conventional commit subjects', () => {
    expect(isValidConventionalCommitMessage('feat(proxy): add output validation')).toBe(true);
  });

  it('accepts Gitmoji-prefixed conventional commit messages and preserves them', () => {
    expect(cleanAndValidateCommitMessage('✨ feat: add output validation')).toBe('✨ feat: add output validation');
    expect(cleanAndValidateCommitMessage(':sparkles: feat: add output validation')).toBe(':sparkles: feat: add output validation');
  });

  it('preserves a valid multiline commit body', () => {
    const message = 'fix(proxy): reject invalid model output\n\nRetry another upstream when the model returns reasoning.';
    expect(cleanAndValidateCommitMessage(message)).toBe(message);
  });

  it('rejects a response containing a complete reasoning block', () => {
    expect(() => cleanAndValidateCommitMessage('<think>internal reasoning</think>\n\nfix: reject leaked reasoning'))
      .toThrow(/invalid commit message/i);
  });

  it('rejects unclosed reasoning and explanatory prose', () => {
    expect(() => cleanAndValidateCommitMessage('<think>internal reasoning')).toThrow(/invalid commit message/i);
    expect(() => cleanAndValidateCommitMessage('Here is the commit message:\n\nfix: update proxy')).toThrow(/invalid commit message/i);
  });

  it('rejects planning prose after an otherwise valid subject', () => {
    expect(() => cleanAndValidateCommitMessage('feat: add endpoint\n\nAnalysis: the change introduces a route'))
      .toThrow(/invalid commit message/i);
  });

  it('unwraps a markdown fence around an otherwise valid message', () => {
    expect(cleanAndValidateCommitMessage('```commit\nchore: rotate model\n```')).toBe('chore: rotate model');
  });
});
