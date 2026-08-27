import * as vscode from 'vscode';
import { CommandManager } from './commands';
import { ConfigurationManager } from './config';
import { KeyStore, migrateLegacyKeys } from './secrets';
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

    // One-time migration of legacy plain-text settings keys to SecretStorage
    try {
      const legacyConfig = vscode.workspace.getConfiguration('ai-commit');
      await migrateLegacyKeys(keyStore, context.globalState, legacyConfig);
    } catch (migErr) {
      Logger.error('Legacy key migration error:', migErr);
    }

    const commandManager = new CommandManager(context);
    commandManager.registerCommands();

    context.subscriptions.push({
      dispose: () => {
        configManager.dispose();
        commandManager.dispose();
        Logger.dispose();
      },
    });

    // Check if the active profile requires an API key (no network calls)
    const { name: activeProfileName, profile } = configManager.getActiveProfile();
    const isLocalhost =
      profile.kind === 'openai-compatible' &&
      Boolean(profile.baseUrl && profile.baseUrl.includes('localhost'));

    if (!isLocalhost) {
      const storedKey = await keyStore.get(activeProfileName);
      if (!storedKey) {
        // Optional non-blocking notification prompting configuration
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
  } catch (error) {
    Logger.error('Failed to activate extension:', error);
    throw error;
  }
}

/**
 * Deactivates the extension.
 */
export function deactivate() {}
