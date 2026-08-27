import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProviderProfile } from '../profiles';

export async function generateGemini(
  profile: ProviderProfile,
  apiKey: string | undefined,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature?: number,
  profileName: string = 'gemini',
  abortSignal?: AbortSignal,
  timeoutMs: number = 120000
): Promise<string> {
  if (!apiKey) {
    throw new Error(`No API key stored for profile "${profileName}". Run "Free AI Commit: Set API Key".`);
  }

  const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
  const userMessages = messages.filter((m) => m.role !== 'system');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: profile.model,
    systemInstruction: systemMessage || undefined,
    generationConfig: {
      temperature: temperature ?? profile.temperature ?? 0.7,
    },
  });

  const chat = model.startChat();
  const combinedUserPrompt = userMessages.map((m) => m.content).join('\n\n');

  const timeoutController = new AbortController();
  const timer = setTimeout(() => {
    timeoutController.abort(new Error(`Gemini request timed out after ${timeoutMs}ms.`));
  }, timeoutMs);

  const mergedController = new AbortController();
  const onUserAbort = () => mergedController.abort(abortSignal?.reason);
  const onTimeoutAbort = () => mergedController.abort(timeoutController.signal.reason);

  if (abortSignal) {
    if (abortSignal.aborted) {
      clearTimeout(timer);
      throw new Error('Generation cancelled by user.');
    }
    abortSignal.addEventListener('abort', onUserAbort);
  }
  timeoutController.signal.addEventListener('abort', onTimeoutAbort);

  try {
    const result = await chat.sendMessage(combinedUserPrompt, {
      signal: mergedController.signal,
    } as any);
    const response = await result.response;
    const text = response.text();
    if (!text) {
      throw new Error('No commit message returned from Gemini.');
    }
    return text;
  } finally {
    clearTimeout(timer);
    if (abortSignal) {
      abortSignal.removeEventListener('abort', onUserAbort);
    }
    timeoutController.signal.removeEventListener('abort', onTimeoutAbort);
  }
}
