// Implementation shared by the app (via ./google, which adds the server-only guard)
// and the offline dictionary script. Never import this from client code.
import { createSign } from 'node:crypto';

/*
 * Google Cloud Translation client (server only — never imported by client code).
 *
 * Credentials, in order of preference (none of them may use a NEXT_PUBLIC_ name):
 *   GOOGLE_TRANSLATE_CREDENTIALS_JSON  service-account key (raw JSON or base64) →
 *                                     Cloud Translation v3 (OAuth access token)
 *   GOOGLE_TRANSLATE_PROJECT_ID        optional; defaults to the key's project_id
 *   GOOGLE_TRANSLATE_API_KEY           API key → Cloud Translation v2 (Basic)
 *
 * Text is sent as HTML; anything wrapped in translate="no" (URLs, emails,
 * phone numbers — see protect.ts) is returned untouched by the service.
 */

/** Environment lookup (process.env in the app; a plain object in tests). */
type Env = Record<string, string | undefined>;

export type TranslationProvider = 'google-v3' | 'google-v2';

export class TranslationConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranslationConfigError';
  }
}

export class TranslationProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'TranslationProviderError';
  }
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id?: string;
  token_uri?: string;
}

type Config =
  | { provider: 'google-v3'; account: ServiceAccount; projectId: string }
  | { provider: 'google-v2'; apiKey: string };

function parseAccount(raw: string): ServiceAccount {
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  let parsed: Partial<ServiceAccount>;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new TranslationConfigError('GOOGLE_TRANSLATE_CREDENTIALS_JSON is not valid JSON (raw or base64-encoded service-account key).');
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new TranslationConfigError('GOOGLE_TRANSLATE_CREDENTIALS_JSON must be a service-account key with client_email and private_key.');
  }
  return parsed as ServiceAccount;
}

/** Reads the configuration; throws an actionable TranslationConfigError when absent. */
export function translationConfig(env: Env = process.env): Config {
  const leaked = Object.keys(env).filter((key) => key.startsWith('NEXT_PUBLIC_') && /TRANSLAT/i.test(key));
  if (leaked.length) {
    throw new TranslationConfigError(`Remove ${leaked.join(', ')}: translation credentials must never use a NEXT_PUBLIC_ variable.`);
  }
  if (env.GOOGLE_TRANSLATE_CREDENTIALS_JSON) {
    const account = parseAccount(env.GOOGLE_TRANSLATE_CREDENTIALS_JSON);
    const projectId = env.GOOGLE_TRANSLATE_PROJECT_ID || account.project_id;
    if (!projectId) throw new TranslationConfigError('Set GOOGLE_TRANSLATE_PROJECT_ID (the service-account key has no project_id).');
    return { provider: 'google-v3', account, projectId };
  }
  if (env.GOOGLE_TRANSLATE_API_KEY) return { provider: 'google-v2', apiKey: env.GOOGLE_TRANSLATE_API_KEY };
  throw new TranslationConfigError(
    'Automatic translation is not configured. Add GOOGLE_TRANSLATE_CREDENTIALS_JSON (service-account key) or GOOGLE_TRANSLATE_API_KEY to the server environment.',
  );
}

export function isTranslationConfigured(env: Env = process.env): boolean {
  try {
    translationConfig(env);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- OAuth (v3)
let cachedToken: { key: string; token: string; expires: number } | null = null;

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function accessToken(account: ServiceAccount, fetcher: typeof fetch): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.key === account.client_email && cachedToken.expires - 60 > now) return cachedToken.token;
  const tokenUri = account.token_uri || 'https://oauth2.googleapis.com/token';
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/cloud-translation', aud: tokenUri, iat: now, exp: now + 3600 }),
  );
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const signature = base64url(signer.sign(account.private_key));
  const response = await fetcher(tokenUri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claims}.${signature}` }),
  });
  if (!response.ok) {
    throw new TranslationProviderError(`Google sign-in for translation failed (HTTP ${response.status}). Check the service-account key.`, response.status, response.status >= 500);
  }
  const body = (await response.json()) as { access_token: string; expires_in?: number };
  cachedToken = { key: account.client_email, token: body.access_token, expires: now + (body.expires_in ?? 3600) };
  return body.access_token;
}

// ---------------------------------------------------------------- requests
/** v2 endpoint. GOOGLE_TRANSLATE_V2_URL lets local development point at a stub;
 *  it is ignored in production builds. */
function v2Endpoint(): string {
  const override = process.env.NODE_ENV !== 'production' ? process.env.GOOGLE_TRANSLATE_V2_URL : undefined;
  return override || 'https://translation.googleapis.com/language/translate/v2';
}
const MAX_SEGMENTS = 100;
const MAX_CHARS = 25_000;

function chunk(texts: string[]): string[][] {
  const batches: string[][] = [];
  let current: string[] = [];
  let size = 0;
  for (const text of texts) {
    if (current.length && (current.length >= MAX_SEGMENTS || size + text.length > MAX_CHARS)) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(text);
    size += text.length;
  }
  if (current.length) batches.push(current);
  return batches;
}

function describe(status: number): string {
  if (status === 400) return 'Google rejected the request (HTTP 400).';
  if (status === 401 || status === 403) return `Google refused access (HTTP ${status}). Check that the Cloud Translation API is enabled and the credentials are allowed to use it.`;
  if (status === 429) return 'Google translation quota or rate limit reached (HTTP 429).';
  return `Google translation is unavailable (HTTP ${status}).`;
}

async function requestBatch(config: Config, batch: string[], target: string, fetcher: typeof fetch): Promise<string[]> {
  let response: Response;
  if (config.provider === 'google-v3') {
    const token = await accessToken(config.account, fetcher);
    response = await fetcher(`https://translation.googleapis.com/v3/projects/${encodeURIComponent(config.projectId)}/locations/global:translateText`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ contents: batch, mimeType: 'text/html', sourceLanguageCode: 'en', targetLanguageCode: target }),
    });
  } else {
    response = await fetcher(v2Endpoint(), {
      method: 'POST',
      // The key travels in a header, so it never appears in URLs or logs.
      headers: { 'x-goog-api-key': config.apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ q: batch, source: 'en', target, format: 'html' }),
    });
  }
  if (!response.ok) {
    throw new TranslationProviderError(describe(response.status), response.status, response.status === 429 || response.status >= 500);
  }
  const body = (await response.json()) as { translations?: Array<{ translatedText: string }>; data?: { translations: Array<{ translatedText: string }> } };
  const list = config.provider === 'google-v3' ? body.translations : body.data?.translations;
  if (!list || list.length !== batch.length) throw new TranslationProviderError('Google returned an incomplete translation.', 502, true);
  return list.map((item) => item.translatedText);
}

export interface TranslateOptions {
  fetcher?: typeof fetch;
  retries?: number;
  /** Base back-off in ms (doubles each retry). */
  backoffMs?: number;
  env?: Env;
}

/** Translates HTML segments from English into `target` ("gu" | "hi"), preserving order. */
export async function translateHtml(
  segments: string[],
  target: string,
  options: TranslateOptions = {},
): Promise<{ provider: TranslationProvider; texts: string[] }> {
  const config = translationConfig(options.env);
  const fetcher = options.fetcher ?? fetch;
  const retries = options.retries ?? 3;
  const backoff = options.backoffMs ?? 800;
  const texts: string[] = [];
  for (const batch of chunk(segments)) {
    for (let attempt = 0; ; attempt += 1) {
      try {
        texts.push(...(await requestBatch(config, batch, target, fetcher)));
        break;
      } catch (error) {
        const retryable = error instanceof TranslationProviderError ? error.retryable : true;
        if (!retryable || attempt >= retries) {
          if (error instanceof TranslationProviderError) throw error;
          throw new TranslationProviderError('Could not reach Google translation.', 0, true);
        }
        await new Promise((resolve) => setTimeout(resolve, backoff * 2 ** attempt));
      }
    }
  }
  return { provider: config.provider, texts };
}
