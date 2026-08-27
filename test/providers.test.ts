import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateOpenAICompatible } from '../src/providers/openai-compatible';
import { generateGemini } from '../src/providers/gemini';
import { generateClaude } from '../src/providers/claude';
import { generateCommitMessage } from '../src/providers/index';

const createMock = vi.fn();
vi.mock('openai', () => {
  return {
    default: class OpenAI {
      chat = {
        completions: {
          create: createMock,
        },
      };
      constructor(public options: any) {}
    },
  };
});

const sendMessageMock = vi.fn();
const startChatMock = vi.fn().mockImplementation(() => ({
  sendMessage: sendMessageMock,
}));
const getGenerativeModelMock = vi.fn().mockImplementation(() => ({
  startChat: startChatMock,
}));

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class GoogleGenerativeAI {
      getGenerativeModel = getGenerativeModelMock;
      constructor(public apiKey: string) {}
    },
  };
});

const anthropicCreateMock = vi.fn();
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class Anthropic {
      messages = {
        create: anthropicCreateMock,
      };
      constructor(public options: any) {}
    },
  };
});

describe('providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('openai-compatible', () => {
    it('throws when api key is missing on non-localhost', async () => {
      await expect(
        generateOpenAICompatible(
          { kind: 'openai-compatible', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
          undefined,
          [{ role: 'user', content: 'diff' }],
          0.7,
          'openai'
        )
      ).rejects.toThrow(/No API key stored for profile "openai"/);
    });

    it('allows missing api key for localhost baseUrl', async () => {
      createMock.mockResolvedValueOnce({
        choices: [{ message: { content: 'feat: add local ollama support' } }],
      });

      const result = await generateOpenAICompatible(
        { kind: 'openai-compatible', baseUrl: 'http://localhost:11434/v1', model: 'qwen2.5-coder:3b' },
        undefined,
        [{ role: 'user', content: 'diff' }],
        0.7,
        'ollama'
      );

      expect(result).toBe('feat: add local ollama support');
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'qwen2.5-coder:3b',
          temperature: 0.7,
        })
      );
    });

    it('calls chat completion with custom parameters', async () => {
      createMock.mockResolvedValueOnce({
        choices: [{ message: { content: 'fix: resolve bug' } }],
      });

      const result = await generateOpenAICompatible(
        { kind: 'openai-compatible', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
        'gsk-secret',
        [{ role: 'user', content: 'diff' }],
        0.5,
        'groq'
      );

      expect(result).toBe('fix: resolve bug');
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'llama-3.3-70b-versatile',
          temperature: 0.5,
        })
      );
    });
  });

  describe('gemini', () => {
    it('throws when api key is missing', async () => {
      await expect(
        generateGemini(
          { kind: 'gemini', model: 'gemini-2.0-flash' },
          undefined,
          [{ role: 'user', content: 'diff' }],
          0.7,
          'gemini'
        )
      ).rejects.toThrow(/No API key stored for profile "gemini"/);
    });

    it('generates message using GoogleGenerativeAI chat', async () => {
      sendMessageMock.mockResolvedValueOnce({
        response: { text: () => 'docs: update readme' },
      });

      const result = await generateGemini(
        { kind: 'gemini', model: 'gemini-2.0-flash' },
        'aiza-key',
        [
          { role: 'system', content: 'system instructions' },
          { role: 'user', content: 'staged diff' },
        ],
        0.7,
        'gemini'
      );

      expect(result).toBe('docs: update readme');
      expect(getGenerativeModelMock).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.0-flash',
          generationConfig: { temperature: 0.7 },
        })
      );
      expect(sendMessageMock).toHaveBeenCalledWith('staged diff');
    });
  });

  describe('claude', () => {
    it('throws when api key is missing', async () => {
      await expect(
        generateClaude(
          { kind: 'claude', model: 'claude-sonnet-4-5' },
          undefined,
          [{ role: 'user', content: 'diff' }],
          0.7,
          'claude'
        )
      ).rejects.toThrow(/No API key stored for profile "claude"/);
    });

    it('generates message using Anthropic messages API', async () => {
      anthropicCreateMock.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'refactor: simplify code' }],
      });

      const result = await generateClaude(
        { kind: 'claude', model: 'claude-sonnet-4-5' },
        'sk-ant-key',
        [
          { role: 'system', content: 'system instructions' },
          { role: 'user', content: 'staged diff' },
        ],
        0.7,
        'claude'
      );

      expect(result).toBe('refactor: simplify code');
      expect(anthropicCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-5',
          max_tokens: 1024,
          system: 'system instructions',
          messages: [{ role: 'user', content: 'staged diff' }],
          temperature: 0.7,
        })
      );
    });
  });

  describe('generateCommitMessage dispatch', () => {
    it('dispatches to openai-compatible', async () => {
      createMock.mockResolvedValueOnce({
        choices: [{ message: { content: 'chore: bump version' } }],
      });

      const result = await generateCommitMessage(
        { kind: 'openai-compatible', baseUrl: 'http://localhost:11434/v1', model: 'llama3.2' },
        'ollama',
        undefined,
        [{ role: 'user', content: 'diff' }],
        0.7
      );

      expect(result).toBe('chore: bump version');
    });

    it('throws on unsupported kind', async () => {
      await expect(
        generateCommitMessage(
          { kind: 'unknown' as any, model: 'foo' },
          'custom',
          'key',
          [{ role: 'user', content: 'diff' }]
        )
      ).rejects.toThrow(/Unsupported provider kind/);
    });
  });
});
