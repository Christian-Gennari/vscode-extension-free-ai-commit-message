import OpenAI from 'openai';
import { ProviderProfile, isLocalhost } from '../profiles';

export async function generateOpenAICompatible(
  profile: ProviderProfile,
  apiKey: string | undefined,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature?: number,
  profileName: string = 'openai',
  abortSignal?: AbortSignal
): Promise<string> {
  const effectiveKey =
    apiKey || (profile.baseUrl && isLocalhost(profile.baseUrl) ? 'dummy-key' : undefined);

  if (!effectiveKey) {
    throw new Error(`No API key stored for profile "${profileName}". Run "Free AI Commit: Set API Key".`);
  }

  const client = new OpenAI({
    apiKey: effectiveKey,
    baseURL: profile.baseUrl || undefined,
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

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No commit message returned from OpenAI-compatible provider.');
  }
  return content;
}
