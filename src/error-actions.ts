export function getCommandErrorActions(errMsg: string, profileRequiresApiKey: boolean): string[] {
  const isMissingKey =
    errMsg.includes('No API key') ||
    errMsg.includes('API key required') ||
    errMsg.includes('Invalid API key') ||
    errMsg.includes('unauthorized');
  const isTransient =
    errMsg.includes('timed out') ||
    errMsg.includes('Rate limit') ||
    errMsg.includes('server error') ||
    errMsg.includes('timeout') ||
    errMsg.includes('connection');

  const actions: string[] = [];
  if (isMissingKey && profileRequiresApiKey) {
    actions.push('Set API Key');
  } else if (isTransient) {
    actions.push('Retry');
  }
  if (profileRequiresApiKey) {
    actions.push('Configure');
  }
  return actions;
}
