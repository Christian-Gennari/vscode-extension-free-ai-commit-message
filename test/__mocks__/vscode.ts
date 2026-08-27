export const ConfigurationTarget = {
  Global: 1,
  Workspace: 2,
  WorkspaceFolder: 3
};

export const window = {
  showInformationMessage: () => Promise.resolve(),
  showWarningMessage: () => Promise.resolve(),
  showErrorMessage: () => Promise.resolve(),
  showInputBox: () => Promise.resolve(),
  showQuickPick: () => Promise.resolve(),
  createOutputChannel: () => ({
    append: () => {},
    appendLine: () => {},
    clear: () => {},
    show: () => {},
    dispose: () => {}
  })
};

export const workspace = {
  getConfiguration: () => ({
    get: () => undefined,
    update: () => Promise.resolve()
  }),
  onDidChangeConfiguration: () => ({ dispose: () => {} })
};

export const commands = {
  registerCommand: () => ({ dispose: () => {} }),
  executeCommand: () => Promise.resolve()
};
