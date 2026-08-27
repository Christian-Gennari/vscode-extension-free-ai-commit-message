import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../src/prompt-builder';
import { generateOpenAICompatible } from '../src/providers/openai-compatible';
import { DEFAULT_PROFILES } from '../src/profiles';

describe('Live Ollama Smoke Test', () => {
  it('generates a conventional commit message from a real diff using local Ollama', async () => {
    const systemPrompt = buildSystemPrompt({
      language: 'English',
      gitmoji: false,
    });

    const sampleDiff = `diff --git a/src/server.ts b/src/server.ts
index 1234567..89abcdef 100644
--- a/src/server.ts
+++ b/src/server.ts
@@ -10,7 +10,7 @@
 import { logger } from './logger';
 
-const PORT = 3000;
+const PORT = process.env.PORT || 3000;
 
 app.listen(PORT, () => {
-  console.log('Server started');
+  logger.info(\`Server listening on port \${PORT}\`);
 });
`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: sampleDiff },
    ];

    const ollamaProfile = {
      ...DEFAULT_PROFILES.ollama,
      model: 'qwen2.5-coder:3b',
    };

    const commitMessage = await generateOpenAICompatible(
      ollamaProfile,
      undefined,
      messages,
      0.7,
      'ollama'
    );

    console.log('Generated Commit Message from Ollama:\n' + commitMessage);

    expect(commitMessage).toBeDefined();
    expect(commitMessage.length).toBeGreaterThan(5);
    // Should contain conventional commit pattern (e.g. feat:, fix:, refactor:)
    expect(commitMessage).toMatch(/^(feat|fix|refactor|perf|chore|docs|style|test|build|ci)(\([a-zA-Z0-9_-]+\))?:/m);
  }, 30000);
});
