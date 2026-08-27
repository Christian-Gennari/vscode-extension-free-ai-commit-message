import * as fs from 'fs-extra';
import * as path from 'path';
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
    try {
      const resourceUri = arg.rootUri;
      const realResourcePath = fs.realpathSync(resourceUri.fsPath);
      for (let i = 0; i < gitApi.repositories.length; i++) {
        const repo = gitApi.repositories[i];
        const repoRoot = repo.rootUri?.fsPath ? fs.realpathSync(repo.rootUri.fsPath) : '';
        if (repoRoot && (realResourcePath === repoRoot || realResourcePath.startsWith(repoRoot + path.sep))) {
          return repo;
        }
      }
    } catch (err: any) {
      Logger.warn('Error resolving realpath for repository URI:', err?.message || err);
    }
  }

  if (gitApi.repositories && gitApi.repositories.length > 0) {
    return gitApi.repositories[0];
  }

  throw new Error('No Git repository found in workspace');
}

function normalizeErrorMessage(err: any, profileName: string): string {
  if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
    return 'Commit message generation was cancelled.';
  }

  const status = err?.status || err?.response?.status;
  if (status) {
    switch (status) {
      case 400:
        return `Bad request (${err.message || 'Invalid parameters'}) for profile "${profileName}".`;
      case 401:
        return `Invalid API key or unauthorized access for profile "${profileName}". Run "Free AI Commit: Set API Key".`;
      case 403:
        return `Access forbidden for profile "${profileName}". Check your account permissions or API key scope.`;
      case 404:
        return `Model or endpoint not found for profile "${profileName}". ${err?.message ? `(${err.message})` : 'Verify model name and baseUrl in settings.'}`;
      case 408:
        return `Request timed out for profile "${profileName}".`;
      case 429:
        return `Rate limit exceeded for profile "${profileName}". Please wait before trying again.`;
      case 500:
      case 502:
      case 503:
      case 504:
        return `Provider server error (${status}) for profile "${profileName}". Please try again later.`;
    }
  }

  const code = err?.code;
  if (code === 'ECONNREFUSED') {
    return `Connection refused to provider for profile "${profileName}". If using local Ollama, ensure the server is running.`;
  }
  if (code === 'ENOTFOUND') {
    return `Could not resolve provider host for profile "${profileName}". Check your network connection and baseUrl.`;
  }

  return (err instanceof Error && err.message) || (typeof err === 'string' ? err : 'An unexpected error occurred');
}

/**
 * Generates a commit message based on the changes staged in the repository.
 */
export async function generateCommitMsg(arg: any): Promise<void> {
  return ProgressHandler.withProgress('', async (progress, token) => {
    const configManager = ConfigurationManager.getInstance();
    const repo = await getRepo(arg);

    const { name: activeProfileName, profile } = configManager.getActiveProfile();
    Logger.info(`Using active provider profile: "${activeProfileName}" (${profile.kind})`);

    if (token.isCancellationRequested) {
      return;
    }

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

    let summaryExtra = '';
    if (fileList.length > 0) {
      summaryExtra += `\n\n---\nSummary of changed files:\n${fileList.slice(0, 50).join('\n')}`;
      if (stat) {
        summaryExtra += `\n${stat}`;
      }
    }

    const diffBudget = Math.max(1000, maxDiffChars - summaryExtra.length);
    const truncation = truncateDiff(diff, diffBudget, diffStrategy);
    if (truncation.truncated) {
      vscode.window.showWarningMessage(
        `Staged diff exceeded limit (${maxDiffChars} chars) and was truncated (head and tail preserved).`
      );
    }

    const finalDiffText = truncation.truncated ? truncation.text + summaryExtra : truncation.text;
    const additionalContext = scmInputBox.value.trim();

    if (token.isCancellationRequested) {
      return;
    }

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

    const abortController = new AbortController();
    const cancelListener = token.onCancellationRequested(() => {
      abortController.abort();
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
        temperature,
        abortController.signal
      );

      if (token.isCancellationRequested) {
        return;
      }

      if (commitMessage) {
        commitMessage = commitMessage.replace(/<think>.*?<\/think>/gs, '').trim();
        Logger.info('Commit message generated successfully');
        scmInputBox.value = commitMessage;
      } else {
        throw new Error('Failed to generate commit message');
      }
    } catch (err: any) {
      Logger.error(`Provider "${activeProfileName}" generation failed:`, {
        message: err?.message,
        code: err?.code,
        status: err?.status,
      });

      const userMessage = normalizeErrorMessage(err, activeProfileName);
      throw new Error(userMessage);
    } finally {
      cancelListener.dispose();
    }
  });
}
