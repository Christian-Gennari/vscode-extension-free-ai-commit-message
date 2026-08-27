import * as vscode from 'vscode';

export class Logger {
  private static outputChannel: vscode.OutputChannel;

  static initialize() {
    this.outputChannel = vscode.window.createOutputChannel('AI Commit');
  }

  static info(message: string, ...args: any[]) {
    this.log('INFO', message, ...args);
  }

  static warn(message: string, ...args: any[]) {
    this.log('WARN', message, ...args);
  }

  static error(message: string, ...args: any[]) {
    this.log('ERROR', message, ...args);
  }

  private static log(level: string, message: string, ...args: any[]) {
    if (!this.outputChannel) {
      return;
    }
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;

    if (args.length > 0) {
      this.outputChannel.appendLine(
        `${formattedMessage} ${args.map((a) => this.formatArg(a)).join(' ')}`
      );
    } else {
      this.outputChannel.appendLine(formattedMessage);
    }
  }

  private static formatArg(a: any): string {
    if (a instanceof Error) {
      return `${a.message}\n${a.stack || ''}`;
    }
    if (typeof a === 'object') {
      return JSON.stringify(a, null, 2);
    }
    return String(a);
  }

  static show() {
    this.outputChannel?.show(true);
  }

  static dispose() {
    this.outputChannel?.dispose();
  }
}
