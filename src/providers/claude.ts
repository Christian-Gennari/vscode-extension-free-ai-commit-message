import Anthropic from '@anthropic-ai/sdk';
import { ProviderProfile } from '../profiles';

export async function generateClaude(
  profile: ProviderProfile,
  apiKey: string | undefined,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature?: number,
  profileName: string = 'claude',
  abortSignal?: AbortSignal,
  timeoutMs: number = 120000
): Promise<string> {
  if (!apiKey) {
    throw new Error(`No API key stored for profile "${profileName}". Run "Free AI Commit: Set API Key".`);
  }

  const anthropic = new Anthropic({ apiKey, timeout: timeoutMs });

  const systemMessage = messages.find((m) => m.role === 'system')?.content;
  const userMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const response = await anthropic.messages.create(
    {
      model: profile.model,
      max_tokens: 1024,
      temperature: temperature ?? profile.temperature ?? 0.7,
      system: systemMessage,
      messages: userMessages,
    },
    {
      signal: abortSignal,
    }
  );

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block: any) => block.text)
    .join('');

  if (!text) {
    throw new Error('No commit message returned from Claude.');
  }

  return text;
}
