import * as vscode from 'vscode';
import { CommandManager } from './commands';
import { ConfigKeys, ConfigurationManager } from './config';
import { Logger } from './logger';

/**
 * Activates the extension and registers commands.
 *
 * @param {vscode.ExtensionContext} context - The context for the extension.
 */
export async function activate(context: vscode.ExtensionContext) {
  try {
    Logger.initialize();
    Logger.info('Activating AI Commit extension...');

    const configManager = ConfigurationManager.getInstance(context);

    const commandManager = new CommandManager(context);
    commandManager.registerCommands();

    context.subscriptions.push({
      dispose: () => {
        configManager.dispose();
        commandManager.dispose();
        Logger.dispose();
      }
    });

    // Check API key based on configured AI provider
    const aiProvider = configManager.getConfig<string>(
      ConfigKeys.AI_PROVIDER,
      'openai'
    );

    if (aiProvider === 'gemini') {
      const geminiApiKey = configManager.getConfig<string>(ConfigKeys.GEMINI_API_KEY);
      if (!geminiApiKey) {
        const result = await vscode.window.showWarningMessage(
          'Gemini API Key not configured. Would you like to configure it now?',
          'Yes',
          'No'
        );

        if (result === 'Yes') {
          await vscode.commands.executeCommand(
            'workbench.action.openSettings',
            'ai-commit.GEMINI_API_KEY'
          );
        }
      }
    } else if (aiProvider === 'claude') {
      const claudeApiKey = configManager.getConfig<string>(ConfigKeys.CLAUDE_API_KEY);
      if (!claudeApiKey) {
        const result = await vscode.window.showWarningMessage(
          'Claude API Key not configured. Would you like to configure it now?',
          'Yes',
          'No'
        );

        if (result === 'Yes') {
          await vscode.commands.executeCommand(
            'workbench.action.openSettings',
            'ai-commit.CLAUDE_API_KEY'
          );
        }
      }
    } else {
      // Default to OpenAI provider
      const openaiApiKey = configManager.getConfig<string>(ConfigKeys.OPENAI_API_KEY);
      if (!openaiApiKey) {
        const result = await vscode.window.showWarningMessage(
          'OpenAI API Key not configured. Would you like to configure it now?',
          'Yes',
          'No'
        );

        if (result === 'Yes') {
          await vscode.commands.executeCommand(
            'workbench.action.openSettings',
            'ai-commit.OPENAI_API_KEY'
          );
        }
      }
    }
  } catch (error) {
    Logger.error('Failed to activate extension:', error);
    throw error;
  }
}

/**
 * Deactivates the extension.
 * This function is called when the extension is deactivated.
 */
export function deactivate() {}
