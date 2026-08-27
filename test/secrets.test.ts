import { describe, it, expect, vi } from 'vitest';
import { KeyStore, migrateLegacyKeys } from '../src/secrets';

class FakeSecretStorage {
  private map = new Map<string, string>();
  onDidChange = vi.fn();

  async get(key: string): Promise<string | undefined> {
    return this.map.get(key);
  }

  async store(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }
}

class FakeMemento {
  private map = new Map<string, any>();

  get<T>(key: string, defaultValue?: T): T {
    return this.map.has(key) ? this.map.get(key) : defaultValue!;
  }

  async update(key: string, value: any): Promise<void> {
    this.map.set(key, value);
  }

  keys(): readonly string[] {
    return Array.from(this.map.keys());
  }
}

class FakeWorkspaceConfig {
  private map = new Map<string, any>();
  public shouldFailUpdate = false;

  constructor(initial: Record<string, any> = {}) {
    for (const [k, v] of Object.entries(initial)) {
      this.map.set(k, v);
    }
  }

  get<T>(key: string, defaultValue?: T): T {
    return this.map.has(key) ? this.map.get(key) : defaultValue!;
  }

  async update(key: string, value: any): Promise<void> {
    if (this.shouldFailUpdate) {
      throw new Error('Permission denied or read-only settings');
    }
    if (value === undefined) {
      this.map.delete(key);
    } else {
      this.map.set(key, value);
    }
  }
}

describe('KeyStore', () => {
  it('stores and retrieves keys per profile', async () => {
    const storage = new FakeSecretStorage();
    const keyStore = new KeyStore(storage as any);

    await keyStore.set('openai', 'sk-test-openai');
    await keyStore.set('groq', 'gsk-test-groq');

    expect(await keyStore.get('openai')).toBe('sk-test-openai');
    expect(await keyStore.get('groq')).toBe('gsk-test-groq');
    expect(await keyStore.get('gemini')).toBeUndefined();
  });
});

describe('migrateLegacyKeys', () => {
  it('migrates legacy keys when present and cleans up successfully', async () => {
    const storage = new FakeSecretStorage();
    const keyStore = new KeyStore(storage as any);
    const memento = new FakeMemento();
    const legacyConfig = new FakeWorkspaceConfig({
      OPENAI_API_KEY: 'sk-legacy-123',
      GEMINI_API_KEY: 'AIza-legacy-456',
    });

    const migrated = await migrateLegacyKeys(keyStore, memento as any, legacyConfig as any);
    expect(migrated).toBe(true);

    expect(await keyStore.get('openai')).toBe('sk-legacy-123');
    expect(await keyStore.get('gemini')).toBe('AIza-legacy-456');
    expect(await keyStore.get('claude')).toBeUndefined();

    // Verify migration flag set when cleanup succeeds
    expect(memento.get('aiCommitMessage.migratedLegacyKeys')).toBe(true);

    // Second run should be a no-op
    const migratedAgain = await migrateLegacyKeys(keyStore, memento as any, legacyConfig as any);
    expect(migratedAgain).toBe(false);
  });

  it('does NOT mark migration complete if clearing legacy config fails', async () => {
    const storage = new FakeSecretStorage();
    const keyStore = new KeyStore(storage as any);
    const memento = new FakeMemento();
    const legacyConfig = new FakeWorkspaceConfig({
      OPENAI_API_KEY: 'sk-legacy-123',
    });
    legacyConfig.shouldFailUpdate = true;

    const migrated = await migrateLegacyKeys(keyStore, memento as any, legacyConfig as any);
    expect(migrated).toBe(true);
    expect(await keyStore.get('openai')).toBe('sk-legacy-123');

    // Migration flag must NOT be set because cleanup failed
    expect(memento.get('aiCommitMessage.migratedLegacyKeys')).toBeUndefined();
  });
});
