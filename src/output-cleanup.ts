const CONVENTIONAL_COMMIT_SUBJECT = /^[a-z][a-z0-9-]*(?:\([^)\r\n]+\))?!?: [^\r\n]+$/;
const GITMOJI_PREFIX = /^(?:(?:\p{Extended_Pictographic}(?:\uFE0E|\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0E|\uFE0F)?)*)|(?::[a-z0-9][a-z0-9_+-]*:))\s+/iu;
const REASONING_MARKER = /<\/?(?:think|analysis|reasoning)\b/i;
const PLANNING_PROSE_MARKER = /(?:^|\n)\s*(?:analysis|reasoning|thinking process|here(?:'s| is)\s+(?:the\s+)?commit message|the commit message is)\s*[:\-]/i;
const MARKDOWN_FENCE = /^```(?:commit|text|markdown)?\s*\n([\s\S]*?)\n?```$/i;

export class InvalidCommitMessageError extends Error {
  constructor() {
    super('Invalid commit message returned by provider.');
    this.name = 'InvalidCommitMessageError';
  }
}

export function isValidConventionalCommitMessage(value: string): boolean {
  const subject = value.split('\n', 1)[0] ?? '';
  const conventionalSubject = subject.replace(GITMOJI_PREFIX, '');
  return CONVENTIONAL_COMMIT_SUBJECT.test(conventionalSubject);
}

export function cleanAndValidateCommitMessage(value: unknown): string {
  if (typeof value !== 'string') {
    throw new InvalidCommitMessageError();
  }

  let cleaned = value.replace(/\r\n?/g, '\n').trim();
  if (REASONING_MARKER.test(cleaned) || PLANNING_PROSE_MARKER.test(cleaned)) {
    throw new InvalidCommitMessageError();
  }

  const fenced = cleaned.match(MARKDOWN_FENCE);
  if (fenced) {
    cleaned = fenced[1].trim();
  }

  if (!cleaned || !isValidConventionalCommitMessage(cleaned)) {
    throw new InvalidCommitMessageError();
  }
  return cleaned;
}
