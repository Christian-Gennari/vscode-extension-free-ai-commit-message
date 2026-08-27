export interface PromptOptions {
  language?: string;
  gitmoji?: boolean;
  customPrompt?: string;
}

export function buildSystemPrompt(options: PromptOptions = {}): string {
  const { language = 'English', gitmoji = false, customPrompt = '' } = options;

  if (customPrompt && customPrompt.trim().length > 0) {
    return customPrompt.replace(/\\n/g, '\n');
  }

  const lang = language || 'English';

  const singleFormat = gitmoji
    ? '<emoji> <type>(<scope>): <subject>\n  <body>'
    : '<type>(<scope>): <subject>\n  <body>';

  const multiFormat = gitmoji
    ? '<emoji> <type>(<scope>): <subject>\n  <body of type 1>\n\n<emoji> <type>(<scope>): <subject>\n  <body of type 2>\n...'
    : '<type>(<scope>): <subject>\n  <body of type 1>\n\n<type>(<scope>): <subject>\n  <body of type 2>\n...';

  const typeTable = gitmoji
    ? `| Type     | Emoji | Description          | Example Scopes      |
| -------- | ----- | -------------------- | ------------------- |
| feat     | ✨    | New feature          | user, payment       |
| fix      | 🐛    | Bug fix              | auth, data          |
| docs     | 📝    | Documentation        | README, API         |
| style    | 💄    | Code style           | formatting          |
| refactor | ♻️    | Code refactoring     | utils, helpers      |
| perf     | ⚡️   | Performance          | query, cache        |
| test     | ✅    | Testing              | unit, e2e           |
| build    | 📦    | Build system         | webpack, npm        |
| ci       | 👷    | CI config            | Travis, Jenkins     |
| chore    | 🔧    | Other changes        | scripts, config     |
| i18n     | 🌐    | Internationalization | locale, translation |`
    : `| Type     | Description          | Example Scopes      |
| -------- | -------------------- | ------------------- |
| feat     | New feature          | user, payment       |
| fix      | Bug fix              | auth, data          |
| docs     | Documentation        | README, API         |
| style    | Code style           | formatting          |
| refactor | Code refactoring     | utils, helpers      |
| perf     | Performance          | query, cache        |
| test     | Testing              | unit, e2e           |
| build    | Build system         | webpack, npm        |
| ci       | CI config            | Travis, Jenkins     |
| chore    | Other changes        | scripts, config     |
| i18n     | Internationalization | locale, translation |`;

  const exampleOutput = gitmoji
    ? '♻️ refactor(server): optimize server port configuration'
    : 'refactor(server): optimize server port configuration';

  return `# Git Commit Message Guide

## Role and Purpose

You will act as a git commit message generator. When receiving a git diff, you will ONLY output the commit message itself, nothing else. No explanations, no questions, no additional comments.

## Output Format

### Single Type Changes

\`\`\`
${singleFormat}
\`\`\`

### Multiple Type Changes

\`\`\`
${multiFormat}
\`\`\`

## Type Reference

${typeTable}

## Writing Rules

### Subject Line

- Scope must be in English
- Imperative mood
- No capitalization
- No period at end
- Max 50 characters
- Must be in ${lang}

### Body

- Bullet points with "-"
- Max 72 chars per line
- Explain what and why
- Must be in ${lang}

## Critical Requirements

1. Output ONLY the commit message
2. Write ONLY in ${lang}
3. NO additional text or explanations
4. NO questions or comments
5. NO formatting instructions or metadata

## Additional Context

If provided, consider any additional context about the changes when generating the commit message. This context will be provided before the diff and should influence the final commit message while maintaining all other formatting rules.

## Examples

INPUT:

diff --git a/src/server.ts b/src/server.ts
index ad4db42..f3b18a9 100644
--- a/src/server.ts
+++ b/src/server.ts
@@ -10,7 +10,7 @@
import {
initWinstonLogger();

const app = express();
-const port = 7799;
+const PORT = 7799;

app.use(express.json());

@@ -34,6 +34,6 @@
app.use((_, res, next) => {
// ROUTES
app.use(PROTECTED_ROUTER_URL, protectedRouter);

-app.listen(port, () => {
- console.log(\`Server listening on port \${port}\`);
+app.listen(process.env.PORT || PORT, () => {
+ console.log(\`Server listening on port \${PORT}\`);
});

OUTPUT:

${exampleOutput}

- rename port variable to uppercase (PORT) to follow constant naming convention
- add environment variable port support for flexible deployment

Remember: All output MUST be in ${lang} language. You are to act as a pure commit message generator. Your response should contain NOTHING but the commit message itself.`;
}
