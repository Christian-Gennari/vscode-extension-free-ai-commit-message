import * as vscode from 'vscode';
import { generateCommitMsg } from './generate-commit-msg';
import { ConfigKeys, ConfigurationManager } from './config';
import { KeyStore } from './secrets';
import { Logger } from './logger';

/**
 * Manages the registration and disposal of extension commands.
 */
export class CommandManager {
  private disposables: vscode.Disposable[] = [];

  constructor(private context: vscode.ExtensionContext) {}

  registerCommands() {
    // Generate commit message command
    this.registerCommand('aiCommitMessage.generateMessage', generateCommitMsg);

    // Select active profile command
    this.registerCommand('aiCommitMessage.selectProfile', async () => {
      const configManager = ConfigurationManager.getInstance();
      const profiles = configManager.getProfiles();
      const currentActive = configManager.getActiveProfileName();

      const items = Object.entries(profiles).map(([name, p]) => ({
        label: name,
        description: `${p.kind} · ${p.model}${p.baseUrl ? ` · ${p.baseUrl}` : ''}${
          name === currentActive ? ' (active)' : ''
        }`,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select active provider profile',
      });

      if (selected) {
        const config = vscode.workspace.getConfiguration('aiCommitMessage');
        await config.update(
          ConfigKeys.ACTIVE_PROFILE,
          selected.label,
          vscode.ConfigurationTarget.Global
        );
        vscode.window.showInformationMessage(
          `Free AI Commit: Active profile set to "${selected.label}".`
        );
      }
    });

    // Set API key for active profile
    this.registerCommand('aiCommitMessage.setApiKey', async () => {
      const configManager = ConfigurationManager.getInstance();
      const activeProfileName = configManager.getActiveProfileName();

      const apiKey = await vscode.window.showInputBox({
        password: true,
        prompt: `Enter API key for profile "${activeProfileName}"`,
        placeHolder: 'API key...',
        ignoreFocusOut: true,
      });

      if (apiKey !== undefined) {
        const keyStore = KeyStore.getInstance();
        if (apiKey.trim() === '') {
          await keyStore.delete(activeProfileName);
          vscode.window.showInformationMessage(
            `Free AI Commit: Cleared API key for profile "${activeProfileName}".`
          );
        } else {
          await keyStore.set(activeProfileName, apiKey.trim());
          vscode.window.showInformationMessage(
            `Free AI Commit: API key saved for profile "${activeProfileName}".`
          );
        }
      }
    });

    // Show available models for current OpenAI-compatible profile
    this.registerCommand('aiCommitMessage.showAvailableModels', async () => {
      const configManager = ConfigurationManager.getInstance();
      const { name: activeProfileName, profile } = configManager.getActiveProfile();

      if (profile.kind !== 'openai-compatible') {
        vscode.window.showWarningMessage(
          `Model listing is only supported for openai-compatible profiles (active profile is "${profile.kind}").`
        );
        return;
      }

      const keyStore = KeyStore.getInstance();
      const apiKey = await keyStore.get(activeProfileName);

      try {
        const models = await configManager.getAvailableOpenAIModels(profile.baseUrl, apiKey);
        const selected = await vscode.window.showQuickPick(models, {
          placeHolder: `Select model for profile "${activeProfileName}"`,
        });

        if (selected) {
          const profiles = configManager.getProfiles();
          const targetProfile = { ...(profiles[activeProfileName] || profile), model: selected };
          const customProfiles = configManager.getConfig<Record<string, any>>(ConfigKeys.PROFILES, {});
          customProfiles[activeProfileName] = targetProfile;

          const config = vscode.workspace.getConfiguration('aiCommitMessage');
          await config.update(ConfigKeys.PROFILES, customProfiles, vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage(
            `Free AI Commit: Profile "${activeProfileName}" model set to "${selected}".`
          );
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to fetch models: ${error.message}`);
      }
    });
  }

  private registerCommand(command: string, handler: (...args: any[]) => any) {
    const executeWithRetry = async (...args: any[]) => {
      try {
        Logger.info(`Executing command: ${command}`);
        await handler(...args);
      } catch (error: any) {
        Logger.error(`Command '${command}' failed:`, error?.message || error);
        const result = await vscode.window.showErrorMessage(
          `Free AI Commit Failed: ${error?.message || error}`,
          'Retry',
          'Configure'
        );

        if (result === 'Retry') {
          // Wrapped retry ensures no unhandled rejection
          try {
            await executeWithRetry(...args);
          } catch (retryErr: any) {
            Logger.error(`Retry for command '${command}' failed:`, retryErr?.message || retryErr);
          }
        } else if (result === 'Configure') {
          await vscode.commands.executeCommand(
            'workbench.action.openSettings',
            'aiCommitMessage'
          );
        }
      }
    };

    const disposable = vscode.commands.registerCommand(command, executeWithRetry);
    this.disposables.push(disposable);
    this.context.subscriptions.push(disposable);
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}
