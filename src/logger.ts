import * as vscode from 'vscode';

export class Logger {
  private static outputChannel: vscode.OutputChannel;

  static initialize() {
    this.outputChannel = vscode.window.createOutputChannel('Free AI Commit');
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

  private static redactString(value: string): string {
    return value
      .replace(
        /([?&](?:key|api_key|apikey|token|access_token)=)[^&#\s]+/gi,
        '$1[REDACTED]'
      )
      .replace(
        /(authorization\s*:\s*bearer\s+)[^\s,]+/gi,
        '$1[REDACTED]'
      )
      .replace(
        /(bearer\s+)[^\s,]+/gi,
        '$1[REDACTED]'
      );
  }

  private static sanitize(value: any, keyName = ''): any {
    if (/key|auth|token|secret|password|bearer|header/i.test(keyName)) {
      return '[REDACTED]';
    }

    if (typeof value === 'string') {
      return this.redactString(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }

    if (value && typeof value === 'object') {
      const output: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(value)) {
        output[key] = this.sanitize(child, key);
      }
      return output;
    }

    return value;
  }

  private static formatArg(a: any): string {
    if (a instanceof Error) {
      return `${a.name}: ${this.redactString(a.message)}`;
    }

    if (typeof a === 'string') {
      return this.redactString(a);
    }

    try {
      return JSON.stringify(this.sanitize(a));
    } catch {
      return '[Object]';
    }
  }

  static show() {
    this.outputChannel?.show(true);
  }

  static dispose() {
    this.outputChannel?.dispose();
  }
}
