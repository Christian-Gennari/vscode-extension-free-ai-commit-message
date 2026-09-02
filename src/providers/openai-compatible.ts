import OpenAI from 'openai';
import { ProviderProfile, requiresApiKey } from '../profiles';
import { InvalidCommitMessageError } from '../output-cleanup';

export async function generateOpenAICompatible(
  profile: ProviderProfile,
  apiKey: string | undefined,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature?: number,
  profileName: string = 'openai',
  abortSignal?: AbortSignal,
  timeoutMs: number = 120000
): Promise<string> {
  const effectiveKey = apiKey || (!requiresApiKey(profile) ? 'free-quickstart' : undefined);

  if (!effectiveKey) {
    throw new Error(`No API key stored for profile "${profileName}". Run "Free AI Commit: Set API Key".`);
  }

  const client = new OpenAI({
    apiKey: effectiveKey,
    baseURL: profile.baseUrl || undefined,
    timeout: timeoutMs,
  });

  const completion = await client.chat.completions.create(
    {
      model: profile.model,
      messages: messages as any,
      temperature: temperature ?? profile.temperature ?? 0.7,
    },
    {
      signal: abortSignal,
    }
  );

  const choice = completion.choices[0];
  if (choice?.finish_reason === 'length') {
    throw new InvalidCommitMessageError();
  }
  const content = choice?.message?.content;
  if (!content) {
    throw new Error('No commit message returned from OpenAI-compatible provider.');
  }
  return content;
}
