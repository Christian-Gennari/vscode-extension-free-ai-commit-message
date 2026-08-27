import * as vscode from 'vscode';

export class KeyStore {
  private static instance?: KeyStore;

  constructor(private secrets: vscode.SecretStorage) {}

  static getInstance(secrets?: vscode.SecretStorage): KeyStore {
    if (!this.instance && secrets) {
      this.instance = new KeyStore(secrets);
    }
    if (!this.instance) {
      throw new Error('KeyStore has not been initialized with SecretStorage.');
    }
    return this.instance;
  }

  static setInstance(instance?: KeyStore): void {
    this.instance = instance;
  }

  private keyFor(profile: string): string {
    return `aiCommitMessage.apiKey.${profile}`;
  }

  async get(profile: string): Promise<string | undefined> {
    return this.secrets.get(this.keyFor(profile));
  }

  async set(profile: string, key: string): Promise<void> {
    await this.secrets.store(this.keyFor(profile), key);
  }

  async delete(profile: string): Promise<void> {
    await this.secrets.delete(this.keyFor(profile));
  }
}

export async function migrateLegacyKeys(
  keyStore: KeyStore,
  globalState: vscode.Memento,
  legacyConfig: vscode.WorkspaceConfiguration
): Promise<boolean> {
  const migrationKey = 'aiCommitMessage.migratedLegacyKeys';
  if (globalState.get<boolean>(migrationKey, false)) {
    return false;
  }

  const legacyMap: Record<string, string> = {
    openai: 'OPENAI_API_KEY',
    gemini: 'GEMINI_API_KEY',
    claude: 'CLAUDE_API_KEY',
  };

  let allCleaned = true;
  let migratedAny = false;

  for (const [profile, legacySetting] of Object.entries(legacyMap)) {
    const existingSecret = await keyStore.get(profile);
    const legacyKey = legacyConfig.get<string>(legacySetting);

    if (legacyKey && legacyKey.trim()) {
      if (!existingSecret) {
        await keyStore.set(profile, legacyKey.trim());
        migratedAny = true;
      }
      try {
        await legacyConfig.update(legacySetting, undefined, vscode.ConfigurationTarget.Global);
      } catch {
        allCleaned = false;
      }
    }
  }

  if (allCleaned) {
    await globalState.update(migrationKey, true);
  }

  return migratedAny;
}
