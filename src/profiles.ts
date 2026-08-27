export type ProviderKind = 'openai-compatible' | 'gemini' | 'claude';

export interface ProviderProfile {
  kind: ProviderKind;
  baseUrl?: string; // openai-compatible only
  model: string;
  temperature?: number;
}

export type ProfilesMap = Record<string, ProviderProfile>;

export const DEFAULT_PROFILES: ProfilesMap = {
  free: {
    kind: 'openai-compatible',
    baseUrl: 'https://commit.cgennari.com/v1',
    model: 'free',
  },
  gemini: {
    kind: 'gemini',
    model: 'gemini-3.5-flash-lite',
  },
  openrouter: {
    kind: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'cohere/north-mini-code:free',
  },
  groq: {
    kind: 'openai-compatible',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'openai/gpt-oss-120b',
  },
  ollama: {
    kind: 'openai-compatible',
    baseUrl: 'http://localhost:11434/v1',
    model: 'qwen2.5-coder:3b',
  },
  github: {
    kind: 'openai-compatible',
    baseUrl: 'https://models.inference.ai.azure.com',
    model: 'gpt-4o-mini',
  },
  deepseek: {
    kind: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
  openai: {
    kind: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  claude: {
    kind: 'claude',
    model: 'claude-3-5-haiku-20241022',
  },
};

export function isFreeProxy(urlStr?: string): boolean {
  if (!urlStr) {
    return false;
  }
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.toLowerCase() === 'commit.cgennari.com';
  } catch {
    return false;
  }
}

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

export function resolveProfiles(userProfiles: Record<string, any> = {}): ProfilesMap {
  if (!userProfiles || typeof userProfiles !== 'object' || Array.isArray(userProfiles)) {
    return { ...DEFAULT_PROFILES };
  }

  const result: ProfilesMap = { ...DEFAULT_PROFILES };
  for (const [name, custom] of Object.entries(userProfiles)) {
    if (custom && typeof custom === 'object' && !Array.isArray(custom)) {
      if (result[name]) {
        // Deep/per-profile merge with existing default preset
        result[name] = { ...result[name], ...custom };
      } else {
        result[name] = custom as ProviderProfile;
      }
    }
  }
  return result;
}

export function assertValidProfile(
  profileName: string,
  profile: unknown
): asserts profile is ProviderProfile {
  if (!profileName || typeof profileName !== 'string' || profileName.trim() === '') {
    throw new Error('Profile name must be a non-empty string.');
  }

  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
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
    if (p.kind !== 'openai-compatible') {
      throw new Error(`Profile "${profileName}" (${p.kind}) does not support custom baseUrl.`);
    }
    if (typeof p.baseUrl !== 'string' || p.baseUrl.trim() === '') {
      throw new Error(`Profile "${profileName}" baseUrl must be a non-empty string URL.`);
    }
    try {
      const parsed = new URL(p.baseUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`Profile "${profileName}" baseUrl must use http: or https: protocol.`);
      }
    } catch (err: any) {
      throw new Error(`Profile "${profileName}" baseUrl "${p.baseUrl}" is invalid: ${err.message}`);
    }
  }
}
