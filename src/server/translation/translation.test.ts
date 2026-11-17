import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const { translateHtml, translationConfig, isTranslationConfigured, TranslationConfigError } = await import('./google');
const { prepareSegment, restoreSegment } = await import('./protect');

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('protect / restore', () => {
  it('shields URLs, emails, phones, placeholders and code in plain text', () => {
    const text = 'Write to info@ovsrcsc.org or call +91 281 244 0940, see https://ovsrcsc.org/visit. {count} seats, code `HC-36` & more';
    const prepared = prepareSegment(text, 'text');
    for (const token of ['info@ovsrcsc.org', '+91 281 244 0940', 'https://ovsrcsc.org/visit', '{count}', '`HC-36`']) {
      expect(prepared).toContain(`<span translate="no" class="notranslate">${token}</span>`);
    }
    expect(prepared).toContain('&amp; more');
    expect(restoreSegment(prepared, 'text')).toBe(text);
  });

  it('leaves tags and attributes of HTML untouched', () => {
    const html = '<p>Visit <a href="https://ovsrcsc.org/a">https://ovsrcsc.org/a</a></p>';
    const prepared = prepareSegment(html, 'html');
    expect(prepared).toContain('href="https://ovsrcsc.org/a"');
    expect(prepared).toContain('<span translate="no" class="notranslate">https://ovsrcsc.org/a</span></a>');
    expect(restoreSegment(prepared, 'html')).toBe(html);
  });
});

describe('configuration', () => {
  it('explains what to set when no credentials exist', () => {
    expect(isTranslationConfigured({})).toBe(false);
    expect(() => translationConfig({})).toThrow(/GOOGLE_TRANSLATE_CREDENTIALS_JSON .* or GOOGLE_TRANSLATE_API_KEY/);
  });

  it('refuses credentials exposed through NEXT_PUBLIC_ variables', () => {
    expect(() => translationConfig({ GOOGLE_TRANSLATE_API_KEY: 'k', NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY: 'k' })).toThrow(TranslationConfigError);
  });

  it('rejects malformed service-account JSON clearly', () => {
    expect(() => translationConfig({ GOOGLE_TRANSLATE_CREDENTIALS_JSON: '{nope' })).toThrow(/not valid JSON/);
  });
});

describe('v2 (API key)', () => {
  const env = { GOOGLE_TRANSLATE_API_KEY: 'test-key' };

  it('sends HTML segments with the key in a header, never the URL', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      return json({ data: { translations: body.q.map((q: string) => ({ translatedText: `gu:${q}` })) } });
    });
    const result = await translateHtml(['Hello', 'World'], 'gu', { env, fetcher: fetcher as unknown as typeof fetch });
    expect(result).toEqual({ provider: 'google-v2', texts: ['gu:Hello', 'gu:World'] });
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).not.toContain('test-key');
    expect((init?.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key');
    expect(JSON.parse(String(init?.body))).toMatchObject({ source: 'en', target: 'gu', format: 'html' });
  });

  it('retries rate limits and server errors, then succeeds', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(json({}, 503))
      .mockResolvedValueOnce(json({}, 429))
      .mockResolvedValueOnce(json({ data: { translations: [{ translatedText: 'नमस्ते' }] } }));
    const result = await translateHtml(['Hello'], 'hi', { env, fetcher, backoffMs: 1 });
    expect(result.texts).toEqual(['नमस्ते']);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('does not retry a permission error and reports it without the raw response', async () => {
    const fetcher = vi.fn().mockResolvedValue(json({ error: { message: 'API key not valid. key=test-key' } }, 403));
    await expect(translateHtml(['Hello'], 'hi', { env, fetcher, backoffMs: 1 })).rejects.toThrow(/refused access \(HTTP 403\)/);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('gives up after the retry budget', async () => {
    const fetcher = vi.fn().mockResolvedValue(json({}, 500));
    await expect(translateHtml(['Hello'], 'hi', { env, fetcher, retries: 2, backoffMs: 1 })).rejects.toThrow(/unavailable/);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('splits large inputs into batches and keeps order', async () => {
    const fetcher = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      return json({ data: { translations: body.q.map((q: string) => ({ translatedText: q.toUpperCase() })) } });
    });
    const input = Array.from({ length: 250 }, (_, i) => `item ${i}`);
    const result = await translateHtml(input, 'gu', { env, fetcher: fetcher as unknown as typeof fetch });
    expect(fetcher.mock.calls.length).toBeGreaterThan(1);
    expect(result.texts).toEqual(input.map((value) => value.toUpperCase()));
  });
});

describe('v3 (service account)', () => {
  it('signs a JWT, exchanges it for a token and calls translateText', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const key = { client_email: 'svc@demo.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(), project_id: 'demo-project' };
    const env = { GOOGLE_TRANSLATE_CREDENTIALS_JSON: Buffer.from(JSON.stringify(key)).toString('base64') };
    const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).includes('oauth2')) {
        const assertion = new URLSearchParams(String(init?.body)).get('assertion')!;
        expect(assertion.split('.')).toHaveLength(3);
        return json({ access_token: 'token-123', expires_in: 3600 });
      }
      expect(String(url)).toContain('/v3/projects/demo-project/locations/global:translateText');
      expect((init?.headers as Record<string, string>).authorization).toBe('Bearer token-123');
      const body = JSON.parse(String(init?.body));
      expect(body).toMatchObject({ mimeType: 'text/html', sourceLanguageCode: 'en', targetLanguageCode: 'gu' });
      return json({ translations: body.contents.map((c: string) => ({ translatedText: `gu:${c}` })) });
    });
    const result = await translateHtml(['Science for all'], 'gu', { env, fetcher: fetcher as unknown as typeof fetch });
    expect(result).toEqual({ provider: 'google-v3', texts: ['gu:Science for all'] });
  });
});
