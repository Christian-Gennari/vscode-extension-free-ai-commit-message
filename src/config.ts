import * as vscode from 'vscode';
import OpenAI from 'openai';
import { ProviderProfile, ProfilesMap, resolveProfiles, assertValidProfile, isLocalhost } from './profiles';
import { Logger } from './logger';

export enum ConfigKeys {
  ACTIVE_PROFILE = 'activeProfile',
  PROFILES = 'profiles',
  LANGUAGE = 'language',
  ENABLE_GITMOJI = 'enableGitmoji',
  CUSTOM_SYSTEM_PROMPT = 'customSystemPrompt',
  MAX_DIFF_CHARACTERS = 'maxDiffCharacters',
  DIFF_OVERFLOW_STRATEGY = 'diffOverflowStrategy',
  TEMPERATURE = 'temperature',
  REQUEST_TIMEOUT_MS = 'requestTimeoutMs',
}

export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private configCache: Map<string, any> = new Map();
  private disposable: vscode.Disposable;
  private context: vscode.ExtensionContext;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.disposable = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('aiCommitMessage')) {
        this.configCache.clear();
      }
    });
  }

  static getInstance(context?: vscode.ExtensionContext): ConfigurationManager {
    if (!this.instance && context) {
      this.instance = new ConfigurationManager(context);
    }
    return this.instance;
  }

  getConfig<T>(key: string, defaultValue?: T): T {
    if (!this.configCache.has(key)) {
      const config = vscode.workspace.getConfiguration('aiCommitMessage');
      this.configCache.set(key, config.get<T>(key, defaultValue));
    }
    return this.configCache.get(key);
  }

  getProfiles(): ProfilesMap {
    const customProfiles = this.getConfig<ProfilesMap>(ConfigKeys.PROFILES, {});
    return resolveProfiles(customProfiles);
  }

  getActiveProfileName(): string {
    return this.getConfig<string>(ConfigKeys.ACTIVE_PROFILE, 'free');
  }

  getActiveProfile(): { name: string; profile: ProviderProfile } {
    const name = this.getActiveProfileName();
    const profiles = this.getProfiles();
    const profile = profiles[name];
    assertValidProfile(name, profile);
    return { name, profile };
  }

  async getAvailableOpenAIModels(baseUrl?: string, apiKey?: string): Promise<string[]> {
    try {
      const effectiveKey =
        apiKey || (baseUrl && isLocalhost(baseUrl) ? 'dummy-key' : undefined);
      if (!effectiveKey) {
        throw new Error('No API key provided to fetch model list.');
      }
      const client = new OpenAI({
        apiKey: effectiveKey,
        baseURL: baseUrl || undefined,
      });
      const models = await client.models.list();
      return models.data.map((m) => m.id);
    } catch (error: any) {
      Logger.error('Failed to fetch OpenAI models:', {
        message: error?.message,
        code: error?.code,
        status: error?.status,
      });
      throw error;
    }
  }

  dispose() {
    this.disposable.dispose();
  }
}
