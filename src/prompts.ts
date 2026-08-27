import { ConfigKeys, ConfigurationManager } from './config';
import { buildSystemPrompt } from './prompt-builder';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Retrieves the main commit prompt as a system message.
 *
 * @returns {Promise<Array<Message>>} - A promise that resolves to an array of prompt messages.
 */
export const getMainCommitPrompt = async (): Promise<Message[]> => {
  const config = ConfigurationManager.getInstance();
  const language = config.getConfig<string>(ConfigKeys.LANGUAGE, 'English');
  const enableGitmoji = config.getConfig<boolean>(ConfigKeys.ENABLE_GITMOJI, false);
  const customSystemPrompt = config.getConfig<string>(ConfigKeys.CUSTOM_SYSTEM_PROMPT, '');

  const content = buildSystemPrompt({
    language,
    gitmoji: enableGitmoji,
    customPrompt: customSystemPrompt,
  });

  return [
    {
      role: 'system',
      content,
    },
  ];
};
