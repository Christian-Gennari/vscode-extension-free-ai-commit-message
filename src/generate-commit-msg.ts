import * as fs from 'fs-extra';
import * as vscode from 'vscode';
import { ConfigKeys, ConfigurationManager } from './config';
import { getDiffStaged } from './git-utils';
import { truncateDiff } from './diff-utils';
import { getMainCommitPrompt } from './prompts';
import { generateCommitMessage, ChatMessage } from './providers';
import { KeyStore } from './secrets';
import { ProgressHandler } from './utils';
import { Logger } from './logger';

/**
 * Generates a chat completion prompt for the commit message based on the provided diff.
 */
const generateCommitMessageChatCompletionPrompt = async (
  diff: string,
  additionalContext?: string
): Promise<ChatMessage[]> => {
  const INIT_MESSAGES_PROMPT = await getMainCommitPrompt();
  const chatContextAsCompletionRequest: ChatMessage[] = [...INIT_MESSAGES_PROMPT];

  if (additionalContext) {
    chatContextAsCompletionRequest.push({
      role: 'user',
      content: `Additional context for the changes:\n${additionalContext}`,
    });
  }

  chatContextAsCompletionRequest.push({
    role: 'user',
    content: diff,
  });

  return chatContextAsCompletionRequest;
};

/**
 * Retrieves the repository associated with the provided argument.
 */
export async function getRepo(arg: any): Promise<any> {
  const gitApi = vscode.extensions.getExtension('vscode.git')?.exports?.getAPI(1);
  if (!gitApi) {
    throw new Error('Git extension not found');
  }

  if (typeof arg === 'object' && arg?.rootUri) {
    const resourceUri = arg.rootUri;
    const realResourcePath: string = fs.realpathSync(resourceUri.fsPath);
    for (let i = 0; i < gitApi.repositories.length; i++) {
      const repo = gitApi.repositories[i];
      if (realResourcePath.startsWith(repo.rootUri.fsPath)) {
        return repo;
      }
    }
  }

  if (gitApi.repositories && gitApi.repositories.length > 0) {
    return gitApi.repositories[0];
  }

  throw new Error('No Git repository found in workspace');
}

/**
 * Generates a commit message based on the changes staged in the repository.
 */
export async function generateCommitMsg(arg: any): Promise<void> {
  return ProgressHandler.withProgress('', async (progress) => {
    const configManager = ConfigurationManager.getInstance();
    const repo = await getRepo(arg);

    const { name: activeProfileName, profile } = configManager.getActiveProfile();
    Logger.info(`Using active provider profile: "${activeProfileName}" (${profile.kind})`);

    progress.report({ message: 'Getting staged changes...' });
    const { diff, stat, fileList, error } = await getDiffStaged(repo);

    if (error) {
      throw new Error(`Failed to get staged changes: ${error}`);
    }

    if (!diff || diff.trim() === '') {
      throw new Error('No changes staged for commit');
    }

    const scmInputBox = repo.inputBox;
    if (!scmInputBox) {
      throw new Error('Unable to find the SCM input box');
    }

    const maxDiffChars = configManager.getConfig<number>(ConfigKeys.MAX_DIFF_CHARACTERS, 60000);
    const diffStrategy = configManager.getConfig<'truncate' | 'fail'>(
      ConfigKeys.DIFF_OVERFLOW_STRATEGY,
      'truncate'
    );

    const truncation = truncateDiff(diff, maxDiffChars, diffStrategy);
    if (truncation.truncated) {
      vscode.window.showWarningMessage(
        `Staged diff exceeded limit (${maxDiffChars} chars) and was truncated (head and tail preserved).`
      );
    }

    let finalDiffText = truncation.text;
    if (truncation.truncated && fileList.length > 0) {
      finalDiffText += `\n\n---\nSummary of all changed files:\n${fileList.join('\n')}`;
      if (stat) {
        finalDiffText += `\n${stat}`;
      }
    }

    const additionalContext = scmInputBox.value.trim();

    progress.report({
      message: additionalContext
        ? 'Analyzing changes with additional context...'
        : 'Analyzing changes...',
    });

    const messages = await generateCommitMessageChatCompletionPrompt(
      finalDiffText,
      additionalContext
    );

    progress.report({
      message: additionalContext
        ? 'Generating commit message with additional context...'
        : 'Generating commit message...',
    });

    try {
      const keyStore = KeyStore.getInstance();
      const apiKey = await keyStore.get(activeProfileName);
      const temperature = configManager.getConfig<number>(
        ConfigKeys.TEMPERATURE,
        profile.temperature ?? 0.7
      );

      let commitMessage = await generateCommitMessage(
        profile,
        activeProfileName,
        apiKey,
        messages,
        temperature
      );

      if (commitMessage) {
        commitMessage = commitMessage.replace(/<think>.*?<\/think>/gs, '').trim();
        Logger.info('Commit message generated successfully');
        scmInputBox.value = commitMessage;
      } else {
        throw new Error('Failed to generate commit message');
      }
    } catch (err: any) {
      Logger.error(`Provider "${activeProfileName}" generation failed:`, err);
      let errorMessage =
        (err instanceof Error && err.message) ||
        (typeof err === 'string' ? err : 'An unexpected error occurred');

      if (err?.status) {
        switch (err.status) {
          case 401:
            errorMessage = `Invalid API key or unauthorized access for profile "${activeProfileName}".`;
            break;
          case 429:
            errorMessage = `Rate limit exceeded for profile "${activeProfileName}". Please try again later.`;
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = `Provider server error (${err.status}). Please try again later.`;
            break;
        }
      }

      throw new Error(errorMessage);
    }
  });
}
