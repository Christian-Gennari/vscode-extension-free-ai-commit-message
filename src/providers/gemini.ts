import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProviderProfile } from '../profiles';

export async function generateGemini(
  profile: ProviderProfile,
  apiKey: string | undefined,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature?: number,
  profileName: string = 'gemini'
): Promise<string> {
  if (!apiKey) {
    throw new Error(`No API key stored for profile "${profileName}". Run "Free AI Commit: Set API Key".`);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: profile.model,
    generationConfig: {
      temperature: temperature ?? profile.temperature ?? 0.7,
    },
  });

  const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
  const userMessages = messages.filter((m) => m.role !== 'system');

  const chat = model.startChat({
    history: systemMessage
      ? [
          { role: 'user', parts: [{ text: systemMessage }] },
          {
            role: 'model',
            parts: [{ text: 'Understood. I will generate conventional commit messages following these instructions.' }],
          },
        ]
      : [],
  });

  // Preserve all user messages (including additional context + diff)
  const combinedUserPrompt = userMessages.map((m) => m.content).join('\n\n');
  const result = await chat.sendMessage(combinedUserPrompt);
  const response = await result.response;
  const text = response.text();
  if (!text) {
    throw new Error('No commit message returned from Gemini.');
  }
  return text;
}
