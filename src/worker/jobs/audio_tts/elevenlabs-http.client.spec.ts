import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ElevenLabsHttpClient } from './elevenlabs-http.client';
import {
  parseReportedUnits,
  parseRetryAfter,
  toLanguageCode,
  toTransportError,
} from './elevenlabs-http.client';
import { readCappedBody } from './response-reader';
import { TtsProviderError } from '../../../modules/audio_tts/domain';
import type { AudioTtsConfig } from '../../../modules/audio_tts/config/audio-tts.env';

const MP3 = Buffer.concat([
  Buffer.from([0xff, 0xfb, 0x90, 0x64]),
  Buffer.alloc(512, 3),
]);

const config = {
  elevenLabsBaseUrl: 'https://api.elevenlabs.io/',
  elevenLabsApiKey: 'key-1',
  requestTimeoutMs: 5000,
  maxResponseBytes: 1_048_576,
  minResponseBytes: 256,
} as AudioTtsConfig;

const input = {
  text: 'Bienvenido, María.',
  language: 'es-419',
  voiceProfile: 'brand_es_latam_v1',
  providerVoiceRef: 'voice-1',
  model: 'eleven_v3',
  outputFormat: 'mp3_44100_128',
  sampleRate: 44_100,
  requestId: 'req-1',
};

/** Respuesta con cuerpo binario, como la que devuelve `fetch`. */
function audioResponse(
  body: Buffer,
  headers: Record<string, string> = { 'content-type': 'audio/mpeg' },
): Response {
  return new Response(new Uint8Array(body), { status: 200, headers });
}

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('ElevenLabsHttpClient', () => {
  it('llama al endpoint del proveedor con la voz, el formato y el idioma', async () => {
    const fetchMock = mockFn().mockResolvedValue(audioResponse(MP3));
    globalThis.fetch = fetchMock;

    const result = await new ElevenLabsHttpClient(config).synthesize(input);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://api.elevenlabs.io/v1/text-to-speech/voice-1?output_format=mp3_44100_128',
    );
    expect((init.headers as Record<string, string>)['xi-api-key']).toBe(
      'key-1',
    );
    // El idioma forma parte de la identidad del asset: tiene que llegar al proveedor.
    expect(JSON.parse(init.body as string)).toEqual({
      text: 'Bienvenido, María.',
      model_id: 'eleven_v3',
      language_code: 'es',
    });
    expect(result.audio.length).toBe(MP3.length);
    expect(result.mimeType).toBe('audio/mpeg');
  });

  it('clasifica 429 y 5xx como transitorios y 4xx como definitivos', async () => {
    const cases: Array<[number, boolean]> = [
      [408, true],
      [429, true],
      [500, true],
      [503, true],
      [401, false],
      [422, false],
    ];

    for (const [status, retryable] of cases) {
      globalThis.fetch = mockFn().mockResolvedValue(
        new Response('detalle del proveedor', { status }),
      );
      await expect(
        new ElevenLabsHttpClient(config).synthesize(input),
      ).rejects.toMatchObject({
        code: `ELEVENLABS_HTTP_${status}`,
        retryable,
      });
    }
  });

  it('no incluye el cuerpo del error en el mensaje', async () => {
    // Puede contener texto del proveedor, y este mensaje acaba en los logs.
    globalThis.fetch = mockFn().mockResolvedValue(
      new Response('dato sensible del proveedor', { status: 500 }),
    );
    await expect(
      new ElevenLabsHttpClient(config).synthesize(input),
    ).rejects.toMatchObject({ message: 'ElevenLabs respondió 500' });
  });

  it('respeta el Retry-After que impone el servidor', async () => {
    globalThis.fetch = mockFn().mockResolvedValue(
      new Response('', { status: 429, headers: { 'retry-after': '12' } }),
    );
    await expect(
      new ElevenLabsHttpClient(config).synthesize(input),
    ).rejects.toMatchObject({ retryAfterMs: 12_000 });
  });

  it('rechaza como transitorio un cuerpo truncado', async () => {
    globalThis.fetch = mockFn().mockResolvedValue(
      audioResponse(Buffer.alloc(16)),
    );
    await expect(
      new ElevenLabsHttpClient(config).synthesize(input),
    ).rejects.toMatchObject({
      code: 'ELEVENLABS_RESPONSE_TOO_SMALL',
      retryable: true,
    });
  });

  it('rechaza como definitivo un 200 que no es audio', async () => {
    // Es la comprobación más importante del cliente: sin ella, esos bytes quedan
    // cacheados como el audio de esa plantilla para siempre.
    const html = Buffer.from(`<!DOCTYPE html>${'x'.repeat(512)}`);
    globalThis.fetch = mockFn().mockResolvedValue(
      audioResponse(html, { 'content-type': 'text/html' }),
    );
    await expect(
      new ElevenLabsHttpClient(config).synthesize(input),
    ).rejects.toMatchObject({
      code: 'ELEVENLABS_RESPONSE_NOT_AUDIO',
      retryable: false,
    });
  });

  it('prefiere el tipo real del proveedor salvo que diga JSON', async () => {
    globalThis.fetch = mockFn().mockResolvedValue(
      audioResponse(MP3, { 'content-type': 'audio/mp3; charset=utf-8' }),
    );
    await expect(
      new ElevenLabsHttpClient(config).synthesize(input),
    ).resolves.toMatchObject({ mimeType: 'audio/mp3' });

    globalThis.fetch = mockFn().mockResolvedValue(
      audioResponse(MP3, { 'content-type': 'application/json' }),
    );
    await expect(
      new ElevenLabsHttpClient(config).synthesize(input),
    ).resolves.toMatchObject({ mimeType: 'audio/mpeg' });
  });

  it('recoge el consumo declarado por el proveedor cuando lo publica', async () => {
    globalThis.fetch = mockFn().mockResolvedValue(
      audioResponse(MP3, {
        'content-type': 'audio/mpeg',
        'character-cost': '42',
      }),
    );
    await expect(
      new ElevenLabsHttpClient(config).synthesize(input),
    ).resolves.toMatchObject({ reportedUnits: 42 });
  });

  it('traduce un fallo de red en un error del proveedor reintentable', async () => {
    globalThis.fetch = mockFn().mockRejectedValue(
      Object.assign(new TypeError('fetch failed'), {
        cause: Object.assign(new Error('conn reset'), { name: 'ECONNRESET' }),
      }),
    );
    await expect(
      new ElevenLabsHttpClient(config).synthesize(input),
    ).rejects.toMatchObject({
      code: 'ELEVENLABS_NETWORK_ERROR',
      retryable: true,
    });
  });
});

describe('helpers del cliente', () => {
  it('reduce la etiqueta de idioma al código que espera el proveedor', () => {
    expect(toLanguageCode('es-419')).toBe('es');
    expect(toLanguageCode('PT-BR')).toBe('pt');
    expect(toLanguageCode('es')).toBe('es');
  });

  it('acepta Retry-After en segundos y en fecha HTTP', () => {
    expect(parseRetryAfter('5')).toBe(5000);
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter('no-es-fecha')).toBeUndefined();
    const future = new Date(Date.now() + 30_000).toUTCString();
    expect(parseRetryAfter(future)).toBeGreaterThan(0);
    // Una fecha pasada no produce una espera negativa.
    expect(parseRetryAfter(new Date(Date.now() - 60_000).toUTCString())).toBe(
      0,
    );
  });

  it('ignora un coste declarado que no es un número válido', () => {
    expect(
      parseReportedUnits(new Headers({ 'character-cost': 'muchos' })),
    ).toBeUndefined();
    expect(
      parseReportedUnits(new Headers({ 'character-cost': '-3' })),
    ).toBeUndefined();
    expect(parseReportedUnits(new Headers({ 'x-character-cost': '7' }))).toBe(
      7,
    );
    expect(parseReportedUnits(new Headers())).toBeUndefined();
  });

  it('distingue un timeout de un fallo de red mirando la cadena de causas', () => {
    // `undici` envuelve el error real dentro de un TypeError: mirar solo el nivel
    // superior clasificaría todo timeout como fallo de red.
    const wrapped = Object.assign(new TypeError('fetch failed'), {
      cause: Object.assign(new Error('tardó'), { name: 'TimeoutError' }),
    });
    expect(toTransportError(wrapped)).toMatchObject({
      code: 'ELEVENLABS_TIMEOUT',
      retryable: true,
    });
    expect(toTransportError(new Error('otra cosa'))).toMatchObject({
      code: 'ELEVENLABS_NETWORK_ERROR',
    });
    // Un error del propio dominio se propaga sin reclasificarse.
    const original = new TtsProviderError('x', 'CODE', false);
    expect(toTransportError(original)).toBe(original);
  });
});

describe('readCappedBody', () => {
  it('rechaza antes de leer si el content-length declarado supera el techo', async () => {
    const response = new Response(new Uint8Array(Buffer.alloc(10)), {
      headers: { 'content-length': '999999' },
    });
    await expect(readCappedBody(response, 1024)).rejects.toMatchObject({
      code: 'ELEVENLABS_RESPONSE_TOO_LARGE',
      retryable: false,
    });
  });

  it('aborta durante la lectura si el cuerpo real supera el techo', async () => {
    // El content-length es una declaración del servidor; el acumulado durante la
    // lectura es lo que de verdad acota el consumo de memoria.
    const response = new Response(new Uint8Array(Buffer.alloc(4096)));
    await expect(readCappedBody(response, 1024)).rejects.toMatchObject({
      code: 'ELEVENLABS_RESPONSE_TOO_LARGE',
    });
  });

  it('devuelve el cuerpo completo cuando cabe', async () => {
    const response = new Response(new Uint8Array(MP3));
    await expect(readCappedBody(response, 1_048_576)).resolves.toEqual(MP3);
  });
});
