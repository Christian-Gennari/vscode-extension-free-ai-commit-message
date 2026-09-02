import OpenAI from 'openai';
import { ProviderProfile, requiresApiKey } from '../profiles';
import { InvalidCommitMessageError } from '../output-cleanup';

export async function generateOpenAICompatible(
  profile: ProviderProfile,
  apiKey: string | undefined,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature?: number,
  profileName: string = 'openai',
  abortSignal?: AbortSignal,
  timeoutMs: number = 120000
): Promise<string> {
  if (requiresApiKey(profile) && !apiKey) {
    throw new Error(`No API key stored for profile "${profileName}". Run "Free AI Commit: Set API Key".`);
  }

  const client = new OpenAI({
    // The SDK requires a constructor credential, but explicitly omit auth for keyless profiles.
    apiKey: apiKey || 'keyless',
    baseURL: profile.baseUrl || undefined,
    timeout: timeoutMs,
    maxRetries: 0,
    defaultHeaders: {
      Accept: 'application/json',
      'User-Agent': 'Free-AI-Commit-Message/1.0',
      ...(requiresApiKey(profile) ? {} : { Authorization: null }),
    },
  });

  const completion = await client.chat.completions.create(
    {
      model: profile.model,
      messages: messages as any,
      temperature: temperature ?? profile.temperature ?? 0.7,
    },
    {
      signal: abortSignal,
    }
  );

  const choice = completion.choices?.[0];
  if (choice?.finish_reason === 'length') {
    throw new InvalidCommitMessageError();
  }
  const content = choice?.message?.content;
  if (!content) {
    throw new InvalidCommitMessageError();
  }
  return content.trim();
}

export function isRetryableProviderError(error: unknown): boolean {
  if (error instanceof InvalidCommitMessageError) {
    return true;
  }

  const candidate = error as any;
  const rawStatus = candidate?.status ?? candidate?.response?.status ?? candidate?.statusCode;
  const status = Number(rawStatus);
  if (Number.isInteger(status)) {
    return status === 408 || status === 429 || (status >= 500 && status <= 599);
  }

  if (candidate?.name === 'AbortError' || candidate?.code === 'ABORT_ERR') {
    return false;
  }

  const values = [candidate, candidate?.cause].filter(Boolean);
  return values.some((value) => {
    const code = String(value.code || '').toUpperCase();
    const name = String(value.name || '').toLowerCase();
    const message = String(value.message || '').toLowerCase();
    return (
      [
        'ECONNREFUSED',
        'ECONNRESET',
        'ENOTFOUND',
        'EAI_AGAIN',
        'ETIMEDOUT',
        'UND_ERR_CONNECT_TIMEOUT',
        'UND_ERR_SOCKET',
        'CERT_HAS_EXPIRED',
        'ERR_TLS_CERT_ALTNAME_INVALID',
        'EPROTO',
      ].includes(code) ||
      /timeout|timed out|dns|tls|ssl|certificate|connection (?:refused|reset|closed)|fetch failed|network error/.test(
        `${name} ${message}`
      )
    );
  });
}
