import Anthropic from '@anthropic-ai/sdk';
import { ConfigKeys, ConfigurationManager } from './config';
import { Logger } from './logger';

/**
 * Sends a chat completion request to Claude using the Anthropic API.
 * @param {Array<Object>} messages - The messages to send to Claude.
 * @returns {Promise<string>} - A promise that resolves to the API response.
 */
export async function ClaudeAPI(messages: any[]): Promise<string> {
  try {
    const configManager = ConfigurationManager.getInstance();
    const apiKey = configManager.getConfig<string>(ConfigKeys.CLAUDE_API_KEY, '');

    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Claude API Key not configured');
    }

    const model = configManager.getConfig<string>(
      ConfigKeys.CLAUDE_MODEL,
      'claude-sonnet-4-5'
    );
    const temperature = configManager.getConfig<number>(
      ConfigKeys.CLAUDE_TEMPERATURE,
      0.7
    );

    const anthropic = new Anthropic({ apiKey });

    const systemMessage = messages.find((msg) => msg.role === 'system');
    const conversationMessages = messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      temperature,
      system: systemMessage?.content,
      messages: conversationMessages
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (textContent && textContent.type === 'text') {
      return textContent.text;
    }
    return '';
  } catch (error: any) {
    Logger.error('Claude API call failed:', error);
    throw error;
  }
}
