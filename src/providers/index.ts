import { FREE_FALLBACK_BASE_URL, isFreeProfile, ProviderProfile } from '../profiles';
import { cleanAndValidateCommitMessage, InvalidCommitMessageError } from '../output-cleanup';
import { generateOpenAICompatible, isRetryableProviderError } from './openai-compatible';
import { generateGemini } from './gemini';
import { generateClaude } from './claude';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function generateRawCommitMessage(
  profile: ProviderProfile,
  profileName: string,
  apiKey: string | undefined,
  messages: ChatMessage[],
  temperature?: number,
  abortSignal?: AbortSignal,
  timeoutMs: number = 120000
): Promise<string> {
  switch (profile.kind) {
    case 'openai-compatible':
      return generateOpenAICompatible(profile, apiKey, messages, temperature, profileName, abortSignal, timeoutMs);
    case 'gemini':
      return generateGemini(profile, apiKey, messages, temperature, profileName, abortSignal, timeoutMs);
    case 'claude':
      return generateClaude(profile, apiKey, messages, temperature, profileName, abortSignal, timeoutMs);
    default:
      throw new Error(`Unsupported provider kind: ${(profile as any).kind}`);
  }
}

export async function generateCommitMessage(
  profile: ProviderProfile,
  profileName: string,
  apiKey: string | undefined,
  messages: ChatMessage[],
  temperature?: number,
  abortSignal?: AbortSignal,
  timeoutMs: number = 120000
): Promise<string> {
  const profiles = isFreeProfile(profile)
    ? [profile, { ...profile, baseUrl: FREE_FALLBACK_BASE_URL }]
    : [profile, profile];
  let lastInvalidOutput: InvalidCommitMessageError | undefined;

  for (let attempt = 0; attempt < profiles.length; attempt += 1) {
    try {
      const rawMessage = await generateRawCommitMessage(
        profiles[attempt],
        profileName,
        apiKey,
        messages,
        temperature,
        abortSignal,
        timeoutMs
      );
      return cleanAndValidateCommitMessage(rawMessage);
    } catch (error) {
      const mayRetry =
        error instanceof InvalidCommitMessageError ||
        (attempt === 0 && isFreeProfile(profile) && isRetryableProviderError(error));
      if (!mayRetry || attempt >= profiles.length - 1) {
        throw error;
      }
      lastInvalidOutput = error as InvalidCommitMessageError;
    }
  }

  throw lastInvalidOutput ?? new InvalidCommitMessageError();
}
