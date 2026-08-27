import * as vscode from 'vscode';

export class KeyStore {
  private static instance?: KeyStore;

  constructor(private secrets: vscode.SecretStorage) {}

  static getInstance(secrets?: vscode.SecretStorage): KeyStore {
    if (!this.instance && secrets) {
      this.instance = new KeyStore(secrets);
    }
    return this.instance || new KeyStore(secrets!);
  }

  static setInstance(instance: KeyStore): void {
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
    claude: 'CLAUDE_API_KEY'
  };

  let migratedCount = 0;
  for (const [profile, legacySetting] of Object.entries(legacyMap)) {
    const existingSecret = await keyStore.get(profile);
    const legacyKey = legacyConfig.get<string>(legacySetting);
    if (!existingSecret && legacyKey && legacyKey.trim()) {
      await keyStore.set(profile, legacyKey.trim());
      try {
        await legacyConfig.update(legacySetting, undefined, vscode.ConfigurationTarget.Global);
      } catch {
        // ignore errors clearing configuration
      }
      migratedCount++;
    }
  }

  await globalState.update(migrationKey, true);
  return migratedCount > 0;
}
