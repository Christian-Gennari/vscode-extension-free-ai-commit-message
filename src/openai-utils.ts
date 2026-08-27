import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { ReasoningEffort } from 'openai/resources/shared';
import { ConfigKeys, ConfigurationManager } from './config';

/**
 * Creates and returns an OpenAI configuration object.
 * @returns {Object} - The OpenAI configuration object.
 * @throws {Error} - Throws an error if the API key is missing or empty.
 */
function getOpenAIConfig() {
  const configManager = ConfigurationManager.getInstance();
  const apiKey = configManager.getConfig<string>(ConfigKeys.OPENAI_API_KEY);
  const baseURL = configManager.getConfig<string>(ConfigKeys.OPENAI_BASE_URL);
  const apiVersion = configManager.getConfig<string>(ConfigKeys.AZURE_API_VERSION);

  if (!apiKey) {
    throw new Error('The OPENAI_API_KEY environment variable is missing or empty.');
  }

  const config: {
    apiKey: string;
    baseURL?: string;
    defaultQuery?: { 'api-version': string };
    defaultHeaders?: { 'api-key': string };
  } = {
    apiKey
  };

  if (baseURL) {
    config.baseURL = baseURL;
    if (apiVersion) {
      config.defaultQuery = { 'api-version': apiVersion };
      config.defaultHeaders = { 'api-key': apiKey };
    }
  }

  return config;
}

/**
 * Creates and returns an OpenAI API instance.
 * @returns {OpenAI} - The OpenAI API instance.
 */
export function createOpenAIApi() {
  const config = getOpenAIConfig();
  return new OpenAI(config);
}

/**
 * Sends a chat completion request to the OpenAI API.
 * @param {Array<Object>} messages - The messages to send to the API.
 * @returns {Promise<string>} - A promise that resolves to the API response.
 */
export async function ChatGPTAPI(messages: ChatCompletionMessageParam[]) {
  const openai = createOpenAIApi();
  const configManager = ConfigurationManager.getInstance();
  const model = configManager.getConfig<string>(ConfigKeys.OPENAI_MODEL);
  const temperature = configManager.getConfig<number>(
    ConfigKeys.OPENAI_TEMPERATURE,
    0.7
  );

  const completion = await openai.chat.completions.create({
    model,
    messages: messages as ChatCompletionMessageParam[],
    temperature
  });

  return completion.choices[0]!.message?.content;
}

/**
 * Sends a request to the OpenAI Responses API.
 * Supports reasoning effort and output verbosity configuration.
 * @param {Array<Object>} messages - The messages to send (same format as Chat Completions).
 * @returns {Promise<string>} - A promise that resolves to the API response text.
 */
export async function ResponsesAPI(messages: ChatCompletionMessageParam[]) {
  const openai = createOpenAIApi();
  const configManager = ConfigurationManager.getInstance();
  const model = configManager.getConfig<string>(ConfigKeys.OPENAI_MODEL);
  const reasoningEffort = configManager.getConfig<string>(
    ConfigKeys.OPENAI_REASONING_EFFORT,
    'medium'
  );
  const textVerbosity = configManager.getConfig<string>(
    ConfigKeys.OPENAI_TEXT_VERBOSITY,
    'medium'
  );

  const verbosityTokenMap: Record<string, number> = {
    low: 1000,
    medium: 4000,
    high: 16000
  };
  const maxOutputTokens = verbosityTokenMap[textVerbosity] ?? 4000;

  // Extract system message as instructions; pass the rest as input
  const systemMsg = messages.find((m) => m.role === 'system');
  const instructions = systemMsg
    ? typeof systemMsg.content === 'string'
      ? systemMsg.content
      : undefined
    : undefined;

  const inputMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    }));

  const response = await openai.responses.create({
    model,
    ...(instructions ? { instructions } : {}),
    input: inputMessages,
    reasoning: { effort: reasoningEffort as ReasoningEffort },
    max_output_tokens: maxOutputTokens
  });

  return response.output_text;
}
