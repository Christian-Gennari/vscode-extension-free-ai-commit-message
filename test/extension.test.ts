import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { activate } from '../src/extension';
import { ConfigurationManager } from '../src/config';
import { KeyStore } from '../src/secrets';

const createFakeContext = () => ({
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
});

describe('extension activation', () => {
  beforeEach(() => {
    KeyStore.setInstance(undefined);
    (ConfigurationManager as any).instance = undefined;
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('activates cleanly without throwing even if activeProfile is invalid', async () => {
    const fakeContext = createFakeContext();

    await expect(activate(fakeContext as any)).resolves.not.toThrow();
    expect(fakeContext.subscriptions.length).toBeGreaterThan(0);
  });

  it('prompts when the free profile name is overridden with a key-backed profile', async () => {
    const showWarningMessage = vi.spyOn(vscode.window, 'showWarningMessage');
    vi.spyOn(vscode.workspace, 'getConfiguration').mockImplementation(((section: string) => ({
      get: (key: string, defaultValue: any) => {
        if (section !== 'aiCommitMessage') {
          return defaultValue;
        }
        if (key === 'activeProfile') {
          return 'free';
        }
        if (key === 'profiles') {
          return { free: {
            kind: 'openai-compatible',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o-mini',
          } };
        }
        return defaultValue;
      },
      update: vi.fn().mockResolvedValue(undefined),
    })) as any);

    await activate(createFakeContext() as any);

    expect(showWarningMessage).toHaveBeenCalledWith(
      'No API key stored for active profile "free". Configure one now?',
      'Yes',
      'Later'
    );
  });
});
