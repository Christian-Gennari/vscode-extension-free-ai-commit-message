import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { activate } from '../src/extension';
import { KeyStore } from '../src/secrets';

describe('extension activation', () => {
  beforeEach(() => {
    KeyStore.setInstance(undefined);
    vi.clearAllMocks();
  });

  it('activates cleanly without throwing even if activeProfile is invalid', async () => {
    const fakeContext = {
      subscriptions: [],
      secrets: {
        get: vi.fn().mockResolvedValue(undefined),
        store: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        onDidChange: vi.fn(),
      },
      globalState: {
        get: vi.fn().mockReturnValue(false),
        update: vi.fn().mockResolvedValue(undefined),
        keys: vi.fn().mockReturnValue([]),
      },
    };

    // Should complete activation without throwing
    await expect(activate(fakeContext as any)).resolves.not.toThrow();
    expect(fakeContext.subscriptions.length).toBeGreaterThan(0);
  });
});
