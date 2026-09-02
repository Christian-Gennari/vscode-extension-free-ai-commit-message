import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateOpenAICompatible } from '../src/providers/openai-compatible';
import { generateGemini } from '../src/providers/gemini';
import { generateClaude } from '../src/providers/claude';
import { generateCommitMessage } from '../src/providers/index';

const createMock = vi.fn();
const openAiOptions: any[] = [];
vi.mock('openai', () => {
  return {
    default: class OpenAI {
      chat = {
        completions: {
          create: createMock,
        },
      };
      constructor(public options: any) {
        openAiOptions.push(options);
      }
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
    openAiOptions.length = 0;
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

    it('allows missing api key for genuine localhost baseUrl', async () => {
      createMock.mockResolvedValueOnce({
        choices: [{ message: { content: '  feat: add local ollama support  ' } }],
      });

      const result = await generateOpenAICompatible(
        { kind: 'openai-compatible', baseUrl: 'http://127.0.0.1:11434/v1', model: 'qwen2.5-coder:3b' },
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
        }),
        expect.anything()
      );
    });

    it('retries when the provider returns reasoning instead of a commit message', async () => {
      createMock.mockReset();
      createMock
        .mockResolvedValueOnce({
          choices: [{ message: { content: '<think>internal reasoning</think>\n\nfix: retry invalid output' } }],
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'fix: retry invalid output' } }],
        });

      const result = await generateCommitMessage(
        { kind: 'openai-compatible', baseUrl: 'https://commit.cgennari.com/v1', model: 'free' },
        'free',
        undefined,
        [{ role: 'user', content: 'diff' }],
        0.7
      );

      expect(result).toBe('fix: retry invalid output');
      expect(createMock).toHaveBeenCalledTimes(2);
    });

    it('retries when an OpenAI-compatible response is truncated', async () => {
      createMock.mockReset();
      createMock
        .mockResolvedValueOnce({
          choices: [{ finish_reason: 'length', message: { content: 'feat: add' } }],
        })
        .mockResolvedValueOnce({
          choices: [{ finish_reason: 'stop', message: { content: 'feat: add employment report endpoint' } }],
        });

      const result = await generateCommitMessage(
        { kind: 'openai-compatible', baseUrl: 'https://commit.cgennari.com/v1', model: 'free' },
        'free',
        undefined,
        [{ role: 'user', content: 'diff' }],
        0.7
      );

      expect(result).toBe('feat: add employment report endpoint');
      expect(createMock).toHaveBeenCalledTimes(2);
    });

    it('allows missing api key for the free proxy regardless of profile name', async () => {
      createMock.mockResolvedValueOnce({
        choices: [{ message: { content: 'feat: use free proxy' } }],
      });

      const result = await generateOpenAICompatible(
        { kind: 'openai-compatible', baseUrl: 'https://commit.cgennari.com/v1', model: 'free' },
        undefined,
        [{ role: 'user', content: 'diff' }],
        0.7,
        'custom-free-proxy'
      );

      expect(result).toBe('feat: use free proxy');
    });

    it('rejects missing api key for lookalike localhost domain', async () => {
      await expect(
        generateOpenAICompatible(
          { kind: 'openai-compatible', baseUrl: 'https://localhost.attacker.com/v1', model: 'gpt-4o' },
          undefined,
          [{ role: 'user', content: 'diff' }],
          0.7,
          'fake-local'
        )
      ).rejects.toThrow(/No API key stored for profile "fake-local"/);
    });

    it('passes abort signal when provided', async () => {
      createMock.mockResolvedValueOnce({
        choices: [{ message: { content: 'fix: cancellation support' } }],
      });

      const controller = new AbortController();
      await generateOpenAICompatible(
        { kind: 'openai-compatible', baseUrl: 'http://localhost:11434/v1', model: 'llama3.2' },
        undefined,
        [{ role: 'user', content: 'diff' }],
        0.7,
        'ollama',
        controller.signal
      );

      expect(createMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ signal: controller.signal })
      );
    });
    it('falls back to Cloudflare after a connection failure without forwarding credentials', async () => {
      createMock
        .mockRejectedValueOnce(Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' }))
        .mockResolvedValueOnce({ choices: [{ message: { content: 'fix: use fallback endpoint' } }] });

      const result = await generateCommitMessage(
        { kind: 'openai-compatible', baseUrl: 'https://commit.cgennari.com/v1', model: 'free' },
        'free',
        undefined,
        [{ role: 'user', content: 'diff' }]
      );

      expect(result).toBe('fix: use fallback endpoint');
      expect(openAiOptions.map((options) => options.baseURL)).toEqual([
        'https://commit.cgennari.com/v1',
        'https://free-ai-commit-fallback.api-9d5.workers.dev/v1',
      ]);
      expect(openAiOptions[1].defaultHeaders.Authorization).toBeNull();
      expect(openAiOptions[1].apiKey).toBe('keyless');
    });

    it('does not fall back for an ordinary authorization error', async () => {
      createMock.mockRejectedValueOnce(Object.assign(new Error('unauthorized'), { status: 401 }));

      await expect(
        generateCommitMessage(
          { kind: 'openai-compatible', baseUrl: 'https://commit.cgennari.com/v1', model: 'free' },
          'free',
          undefined,
          [{ role: 'user', content: 'diff' }]
        )
      ).rejects.toThrow('unauthorized');
      expect(createMock).toHaveBeenCalledTimes(1);
      expect(openAiOptions).toHaveLength(1);
    });

    it.each([400, 403])('does not fall back for ordinary HTTP %s errors', async (status) => {
      createMock.mockRejectedValueOnce(Object.assign(new Error(`http ${status}`), { status }));

      await expect(
        generateCommitMessage(
          { kind: 'openai-compatible', baseUrl: 'https://commit.cgennari.com/v1', model: 'free' },
          'free',
          undefined,
          [{ role: 'user', content: 'diff' }]
        )
      ).rejects.toThrow(`http ${status}`);
      expect(createMock).toHaveBeenCalledTimes(1);
      expect(openAiOptions).toHaveLength(1);
    });

    it('falls back on rate limits and server errors', async () => {
      createMock
        .mockRejectedValueOnce(Object.assign(new Error('rate limited'), { status: 429 }))
        .mockResolvedValueOnce({ choices: [{ message: { content: 'fix: recover from rate limit' } }] });

      await expect(
        generateCommitMessage(
          { kind: 'openai-compatible', baseUrl: 'https://commit.cgennari.com/v1', model: 'free' },
          'free',
          undefined,
          [{ role: 'user', content: 'diff' }]
        )
      ).resolves.toBe('fix: recover from rate limit');

      createMock.mockReset();
      openAiOptions.length = 0;
      createMock
        .mockRejectedValueOnce(Object.assign(new Error('server unavailable'), { status: 503 }))
        .mockResolvedValueOnce({ choices: [{ message: { content: 'fix: recover from server error' } }] });

      await expect(
        generateCommitMessage(
          { kind: 'openai-compatible', baseUrl: 'https://commit.cgennari.com/v1', model: 'free' },
          'free',
          undefined,
          [{ role: 'user', content: 'diff' }]
        )
      ).resolves.toBe('fix: recover from server error');
    });

    it('falls back when primary output is invalid or truncated', async () => {
      createMock
        .mockResolvedValueOnce({ choices: [{ message: { content: 'not a commit message' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'feat: recover invalid output' } }] });

      await expect(
        generateCommitMessage(
          { kind: 'openai-compatible', baseUrl: 'https://commit.cgennari.com/v1', model: 'free' },
          'free',
          undefined,
          [{ role: 'user', content: 'diff' }]
        )
      ).resolves.toBe('feat: recover invalid output');

      createMock.mockReset();
      openAiOptions.length = 0;
      createMock
        .mockResolvedValueOnce({ choices: [{ finish_reason: 'length', message: { content: 'feat: truncated' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'feat: recover truncation' } }] });

      await expect(
        generateCommitMessage(
          { kind: 'openai-compatible', baseUrl: 'https://commit.cgennari.com/v1', model: 'free' },
          'free',
          undefined,
          [{ role: 'user', content: 'diff' }]
        )
      ).resolves.toBe('feat: recover truncation');
    });

    it('retries invalid output after primary and fallback before succeeding', async () => {
      createMock
        .mockResolvedValueOnce({ choices: [{ message: { content: 'not a commit message' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'still not a commit message' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'fix: recover after automatic retry' } }] });

      await expect(
        generateCommitMessage(
          { kind: 'openai-compatible', baseUrl: 'https://commit.cgennari.com/v1', model: 'free' },
          'free',
          undefined,
          [{ role: 'user', content: 'diff' }]
        )
      ).resolves.toBe('fix: recover after automatic retry');
      expect(createMock).toHaveBeenCalledTimes(3);
    });

    it('does not retry invalid output when automatic retry is disabled', async () => {
      createMock.mockResolvedValueOnce({ choices: [{ message: { content: 'not a commit message' } }] });

      await expect(
        generateCommitMessage(
          { kind: 'openai-compatible', baseUrl: 'https://commit.cgennari.com/v1', model: 'free' },
          'free',
          undefined,
          [{ role: 'user', content: 'diff' }],
          undefined,
          undefined,
          120000,
          false
        )
      ).rejects.toThrow(/Invalid commit message returned by provider/);
      expect(createMock).toHaveBeenCalledTimes(1);
    });

    it('never exposes an invalid fallback response to the caller', async () => {
      createMock
        .mockRejectedValueOnce(Object.assign(new Error('primary timeout'), { code: 'ETIMEDOUT' }))
        .mockResolvedValueOnce({ choices: [{ message: { content: 'analysis: plan then commit' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'still not a commit message' } }] });

      await expect(
        generateCommitMessage(
          { kind: 'openai-compatible', baseUrl: 'https://commit.cgennari.com/v1', model: 'free' },
          'free',
          undefined,
          [{ role: 'user', content: 'diff' }]
        )
      ).rejects.toThrow(/Invalid commit message returned by provider/);
      expect(createMock).toHaveBeenCalledTimes(3);
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

    it('preserves all user messages including additional context and diff', async () => {
      sendMessageMock.mockResolvedValueOnce({
        response: { text: () => 'docs: update readme' },
      });

      const result = await generateGemini(
        { kind: 'gemini', model: 'gemini-2.0-flash' },
        'aiza-key',
        [
          { role: 'system', content: 'system instructions' },
          { role: 'user', content: 'Additional context for the changes: Ticket-42' },
          { role: 'user', content: 'staged diff content' },
        ],
        0.7,
        'gemini'
      );

      expect(result).toBe('docs: update readme');
      expect(sendMessageMock).toHaveBeenCalledWith(
        'Additional context for the changes: Ticket-42\n\nstaged diff content',
        expect.anything()
      );
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

    it('generates message using Anthropic messages API and forwards abort signal', async () => {
      anthropicCreateMock.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'refactor: simplify code' }],
      });

      const controller = new AbortController();
      const result = await generateClaude(
        { kind: 'claude', model: 'claude-sonnet-4-5' },
        'sk-ant-key',
        [
          { role: 'system', content: 'system instructions' },
          { role: 'user', content: 'staged diff' },
        ],
        0.7,
        'claude',
        controller.signal
      );

      expect(result).toBe('refactor: simplify code');
      expect(anthropicCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-5',
          max_tokens: 1024,
          system: 'system instructions',
          messages: [{ role: 'user', content: 'staged diff' }],
          temperature: 0.7,
        }),
        expect.objectContaining({ signal: controller.signal })
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
