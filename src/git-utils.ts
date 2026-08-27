import simpleGit from 'simple-git';
import * as vscode from 'vscode';
import { Logger } from './logger';

export interface StagedDiff {
  diff: string;
  stat: string;
  fileList: string[];
  error?: string;
}

/**
 * Retrieves the staged changes, stat, and file list from the Git repository.
 */
export async function getDiffStaged(repo: any): Promise<StagedDiff> {
  try {
    const rootPath =
      repo?.rootUri?.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;

    if (!rootPath) {
      throw new Error('No workspace folder found');
    }

    const git = simpleGit(rootPath);
    const [diff, stat, nameOnly] = await Promise.all([
      git.diff(['--staged']),
      git.diff(['--staged', '--stat']),
      git.diff(['--staged', '--name-only']),
    ]);

    const fileList = nameOnly
      ? nameOnly
          .split('\n')
          .map((f) => f.trim())
          .filter((f) => f.length > 0)
      : [];

    return {
      diff: diff || '',
      stat: stat || '',
      fileList,
    };
  } catch (error: any) {
    Logger.error('Error reading Git diff:', error);
    return {
      diff: '',
      stat: '',
      fileList: [],
      error: error?.message || String(error),
    };
  }
}
