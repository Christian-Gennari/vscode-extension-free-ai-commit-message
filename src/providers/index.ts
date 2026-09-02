import { ProviderProfile } from '../profiles';
import { cleanAndValidateCommitMessage, InvalidCommitMessageError } from '../output-cleanup';
import { generateOpenAICompatible } from './openai-compatible';
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
  let lastInvalidOutput: InvalidCommitMessageError | undefined;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const rawMessage = await generateRawCommitMessage(
        profile,
        profileName,
        apiKey,
        messages,
        temperature,
        abortSignal,
        timeoutMs
      );
      return cleanAndValidateCommitMessage(rawMessage);
    } catch (error) {
      if (!(error instanceof InvalidCommitMessageError)) {
        throw error;
      }
      lastInvalidOutput = error;
    }
  }

  throw lastInvalidOutput ?? new InvalidCommitMessageError();
}
