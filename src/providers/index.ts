import { ProviderProfile } from '../profiles';
import { generateOpenAICompatible } from './openai-compatible';
import { generateGemini } from './gemini';
import { generateClaude } from './claude';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateCommitMessage(
  profile: ProviderProfile,
  profileName: string,
  apiKey: string | undefined,
  messages: ChatMessage[],
  temperature?: number,
  abortSignal?: AbortSignal
): Promise<string> {
  switch (profile.kind) {
    case 'openai-compatible':
      return generateOpenAICompatible(profile, apiKey, messages, temperature, profileName, abortSignal);
    case 'gemini':
      return generateGemini(profile, apiKey, messages, temperature, profileName);
    case 'claude':
      return generateClaude(profile, apiKey, messages, temperature, profileName, abortSignal);
    default:
      throw new Error(`Unsupported provider kind: ${(profile as any).kind}`);
  }
}
