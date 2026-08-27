export type ProviderKind = 'openai-compatible' | 'gemini' | 'claude';

export interface ProviderProfile {
  kind: ProviderKind;
  baseUrl?: string; // openai-compatible only
  model: string;
  temperature?: number;
}

export type ProfilesMap = Record<string, ProviderProfile>;

export const DEFAULT_PROFILES: ProfilesMap = {
  openai: {
    kind: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  groq: {
    kind: 'openai-compatible',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
  },
  openrouter: {
    kind: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'deepseek/deepseek-chat',
  },
  deepseek: {
    kind: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
  ollama: {
    kind: 'openai-compatible',
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3.2',
  },
  gemini: {
    kind: 'gemini',
    model: 'gemini-2.0-flash',
  },
  claude: {
    kind: 'claude',
    model: 'claude-sonnet-4-5',
  },
};

export function isLocalhost(urlStr?: string): boolean {
  if (!urlStr) {
    return false;
  }
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();
    return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname);
  } catch {
    return false;
  }
}

export function resolveProfiles(userProfiles: ProfilesMap = {}): ProfilesMap {
  return { ...DEFAULT_PROFILES, ...userProfiles };
}

export function assertValidProfile(
  profileName: string,
  profile: unknown
): asserts profile is ProviderProfile {
  if (!profile || typeof profile !== 'object') {
    throw new Error(`Profile "${profileName}" is not configured.`);
  }
  const p = profile as Partial<ProviderProfile>;
  if (!p.kind || !['openai-compatible', 'gemini', 'claude'].includes(p.kind)) {
    throw new Error(
      `Profile "${profileName}" has invalid kind "${p.kind}". Supported kinds: openai-compatible, gemini, claude.`
    );
  }
  if (!p.model || typeof p.model !== 'string' || p.model.trim() === '') {
    throw new Error(`Profile "${profileName}" must specify a model.`);
  }
  if (p.temperature !== undefined) {
    if (typeof p.temperature !== 'number' || isNaN(p.temperature) || p.temperature < 0 || p.temperature > 2) {
      throw new Error(`Profile "${profileName}" temperature must be a number between 0.0 and 2.0.`);
    }
  }
  if (p.baseUrl !== undefined) {
    if (typeof p.baseUrl !== 'string' || p.baseUrl.trim() === '') {
      throw new Error(`Profile "${profileName}" baseUrl must be a non-empty string URL.`);
    }
    try {
      new URL(p.baseUrl);
    } catch {
      throw new Error(`Profile "${profileName}" baseUrl "${p.baseUrl}" is not a valid URL.`);
    }
  }
}
