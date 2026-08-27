import * as vscode from 'vscode';

/**
 * Adds progress handling functionality.
 */
export class ProgressHandler {
  static async withProgress<T>(
    title: string,
    task: (
      progress: vscode.Progress<{ message?: string; increment?: number }>,
      token: vscode.CancellationToken
    ) => Promise<T>
  ): Promise<T> {
    const displayTitle = title ? `[Free AI Commit] ${title}` : '[Free AI Commit]';
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: displayTitle,
        cancellable: true,
      },
      task
    );
  }
}
