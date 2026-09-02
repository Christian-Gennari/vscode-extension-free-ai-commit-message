import { describe, expect, it } from 'vitest';
import { requiresApiKey, resolveProfiles } from '../src/profiles';
import { getCommandErrorActions } from '../src/error-actions';

describe('command error actions', () => {
  it('does not offer API-key configuration for the free profile', () => {
    const actions = getCommandErrorActions('Provider request failed', requiresApiKey(resolveProfiles({}).free));

    expect(actions).not.toContain('Configure');
    expect(actions).not.toContain('Set API Key');
  });

  it('offers API-key configuration for other profiles', () => {
    const actions = getCommandErrorActions('Provider request failed', requiresApiKey(resolveProfiles({}).gemini));

    expect(actions).toContain('Configure');
  });

  it('keeps retry available for transient free-profile failures', () => {
    const actions = getCommandErrorActions('Provider connection timeout', requiresApiKey(resolveProfiles({}).free));

    expect(actions).toEqual(['Retry']);
  });
});
