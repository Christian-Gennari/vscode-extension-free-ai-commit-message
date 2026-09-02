import * as vscode from 'vscode';
import { CommandManager } from './commands';
import { ConfigurationManager } from './config';
import { KeyStore, migrateLegacyKeys } from './secrets';
import { requiresApiKey } from './profiles';
import { Logger } from './logger';

/**
 * Activates the extension and registers commands.
 *
 * @param {vscode.ExtensionContext} context - The context for the extension.
 */
export async function activate(context: vscode.ExtensionContext) {
  try {
    Logger.initialize();
    Logger.info('Activating Free AI Commit Message extension...');

    const keyStore = KeyStore.getInstance(context.secrets);
    const configManager = ConfigurationManager.getInstance(context);

    // Register commands and disposables first so commands are always available
    const commandManager = new CommandManager(context);
    commandManager.registerCommands();

    context.subscriptions.push({
      dispose: () => {
        configManager.dispose();
        commandManager.dispose();
        Logger.dispose();
      },
    });

    // One-time migration of legacy plain-text settings keys to SecretStorage
    try {
      const legacyConfig = vscode.workspace.getConfiguration('ai-commit');
      await migrateLegacyKeys(keyStore, context.globalState, legacyConfig);
    } catch (migErr: any) {
      Logger.error('Legacy key migration error:', migErr?.message || migErr);
    }

    // Check if the active profile requires an API key (safe, resilient, no network calls)
    try {
      const { name: activeProfileName, profile } = configManager.getActiveProfile();
      if (requiresApiKey(profile)) {
        const storedKey = await keyStore.get(activeProfileName);
        if (!storedKey) {
          vscode.window
            .showWarningMessage(
              `No API key stored for active profile "${activeProfileName}". Configure one now?`,
              'Yes',
              'Later'
            )
            .then(async (selection) => {
              if (selection === 'Yes') {
                await vscode.commands.executeCommand('aiCommitMessage.setApiKey');
              }
            });
        }
      }
    } catch (configErr: any) {
      Logger.warn('Active profile configuration check failed during activation:', configErr?.message || configErr);
      vscode.window
        .showWarningMessage(
          `Free AI Commit: Configured active profile is invalid (${configErr?.message || configErr}). Please select a valid profile.`,
          'Select Profile'
        )
        .then(async (selection) => {
          if (selection === 'Select Profile') {
            await vscode.commands.executeCommand('aiCommitMessage.selectProfile');
          }
        });
    }
  } catch (error: any) {
    Logger.error('Failed to activate extension:', error?.message || error);
    throw error;
  }
}

/**
 * Deactivates the extension.
 */
export function deactivate() {}
