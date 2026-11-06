import {
  WebhookVerificationError,
  verifyStandardWebhook,
  type WebhookVerificationFailure,
} from './standard-webhook-signature';

/**
 * Paridad con la librería de referencia `@pay/webhook-signature` (repo
 * `pasarelapago`, `contracts/packages/webhook-signature`).
 *
 * `VECTORS` NO se calculó con el código de este repo: lo generó la librería de
 * referencia con `sign()` y su veredicto por caso (`expected`) con su `verify()`.
 * Procedencia: salida literal de
 *
 *     node vectors.cjs   # require('.../webhook-signature/dist/index.js'); sólo lectura
 *
 * ejecutado el 2026-10-29 contra `pasarelapago` en `main` (`@pay/webhook-signature` 0.1.0).
 * El secreto, la clave Ed25519 y los cuerpos son sintéticos. Si la librería de
 * referencia cambia el algoritmo, estos vectores se regeneran y este spec falla
 * hasta que `standard-webhook-signature.ts` los siga.
 */
const VECTORS: {
  T0: number;
  secretA: string;
  secretB: string;
  publicKey: string;
  cases: {
    name: string;
    headers: Record<string, string>;
    payload: string;
    secrets?: string[];
    publicKeys?: string[];
    now: number;
    toleranceSeconds: number;
    expected: 'ok' | WebhookVerificationFailure;
  }[];
} = {
  T0: 1790000000,
  secretA: 'whsec_AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=',
  secretB: 'whsec_yMfGxcTDwsHAv769vLu6ubi3trW0s7Kx',
  publicKey: 'whpk_NSu4YOSJ1bz9UhMcdewQGkDMaCSSTUxgx40sZfWEU4Y=',
  cases: [
    {
      name: 'v1 HMAC valido',
      headers: {
        'webhook-id': '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11',
        'webhook-timestamp': '1790000000',
        'webhook-signature': 'v1,+24d0VfqYGZXi9Mevv2QSniTiK+WV567IlimfV9UnqU=',
      },
      payload:
        '{"id":"0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11","object":"event","type":"payment_intent.succeeded","created_at":"2026-10-29T15:00:00.000Z","mode":"test","data":{"object":{"payment_intent_id":"pi_c92215200m49","status":"succeeded","amount_minor":15000,"currency":"BOB"}}}',
      secrets: ['whsec_AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA='],
      now: 1790000000,
      toleranceSeconds: 300,
      expected: 'ok',
    },
    {
      name: 'v1 con dos firmas (rotacion): vale el secreto B',
      headers: {
        'webhook-id': '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11',
        'webhook-timestamp': '1790000000',
        'webhook-signature':
          'v1,+24d0VfqYGZXi9Mevv2QSniTiK+WV567IlimfV9UnqU= v1,6aN95mpImFRVnA0khxg56aqtXyXL78s7Z7NbZBzhjuU=',
      },
      payload:
        '{"id":"0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11","object":"event","type":"payment_intent.succeeded","created_at":"2026-10-29T15:00:00.000Z","mode":"test","data":{"object":{"payment_intent_id":"pi_c92215200m49","status":"succeeded","amount_minor":15000,"currency":"BOB"}}}',
      secrets: ['whsec_yMfGxcTDwsHAv769vLu6ubi3trW0s7Kx'],
      now: 1790000000,
      toleranceSeconds: 300,
      expected: 'ok',
    },
    {
      name: 'v1a Ed25519 valido',
      headers: {
        'webhook-id': '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11',
        'webhook-timestamp': '1790000000',
        'webhook-signature':
          'v1a,Wn1B0fntNSkhhpUuZkY9QIURIPKP6DAMsWh/gjJ26V1z5BNMZbl3IrtQfjlZt+WF+m80viB/o37yLdAU9dzGDg==',
      },
      payload:
        '{"id":"0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11","object":"event","type":"payment_intent.succeeded","created_at":"2026-10-29T15:00:00.000Z","mode":"test","data":{"object":{"payment_intent_id":"pi_c92215200m49","status":"succeeded","amount_minor":15000,"currency":"BOB"}}}',
      publicKeys: ['whpk_NSu4YOSJ1bz9UhMcdewQGkDMaCSSTUxgx40sZfWEU4Y='],
      now: 1790000000,
      toleranceSeconds: 300,
      expected: 'ok',
    },
    {
      name: 'cuerpo con UTF-8 y espacios, byte a byte',
      headers: {
        'webhook-id': '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11',
        'webhook-timestamp': '1790000000',
        'webhook-signature': 'v1,V6EXn5N3GgLtAZ3yyBWiL9udqSKUSh9o50299nG5dHo=',
      },
      payload:
        '{"id":"0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11",  "note":"señal – ñandú ✓","n":1}\n',
      secrets: ['whsec_AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA='],
      now: 1790000000,
      toleranceSeconds: 300,
      expected: 'ok',
    },
    {
      name: 'cuerpo alterado (un byte)',
      headers: {
        'webhook-id': '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11',
        'webhook-timestamp': '1790000000',
        'webhook-signature': 'v1,+24d0VfqYGZXi9Mevv2QSniTiK+WV567IlimfV9UnqU=',
      },
      payload:
        '{"id":"0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11","object":"event","type":"payment_intent.succeeded","created_at":"2026-10-29T15:00:00.000Z","mode":"test","data":{"object":{"payment_intent_id":"pi_c92215200m49","status":"succeeded","amount_minor":15001,"currency":"BOB"}}}',
      secrets: ['whsec_AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA='],
      now: 1790000000,
      toleranceSeconds: 300,
      expected: 'no_matching_signature',
    },
    {
      name: 'cuerpo re-serializado (espacios distintos)',
      headers: {
        'webhook-id': '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11',
        'webhook-timestamp': '1790000000',
        'webhook-signature': 'v1,+24d0VfqYGZXi9Mevv2QSniTiK+WV567IlimfV9UnqU=',
      },
      payload:
        '{\n "id": "0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11",\n "object": "event",\n "type": "payment_intent.succeeded",\n "created_at": "2026-10-29T15:00:00.000Z",\n "mode": "test",\n "data": {\n  "object": {\n   "payment_intent_id": "pi_c92215200m49",\n   "status": "succeeded",\n   "amount_minor": 15000,\n   "currency": "BOB"\n  }\n }\n}',
      secrets: ['whsec_AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA='],
      now: 1790000000,
      toleranceSeconds: 300,
      expected: 'no_matching_signature',
    },
    {
      name: 'secreto equivocado',
      headers: {
        'webhook-id': '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11',
        'webhook-timestamp': '1790000000',
        'webhook-signature': 'v1,+24d0VfqYGZXi9Mevv2QSniTiK+WV567IlimfV9UnqU=',
      },
      payload:
        '{"id":"0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11","object":"event","type":"payment_intent.succeeded","created_at":"2026-10-29T15:00:00.000Z","mode":"test","data":{"object":{"payment_intent_id":"pi_c92215200m49","status":"succeeded","amount_minor":15000,"currency":"BOB"}}}',
      secrets: ['whsec_yMfGxcTDwsHAv769vLu6ubi3trW0s7Kx'],
      now: 1790000000,
      toleranceSeconds: 300,
      expected: 'no_matching_signature',
    },
    {
      name: 'id de cabecera distinto del firmado',
      headers: {
        'webhook-id': 'otro-id',
        'webhook-timestamp': '1790000000',
        'webhook-signature': 'v1,+24d0VfqYGZXi9Mevv2QSniTiK+WV567IlimfV9UnqU=',
      },
      payload:
        '{"id":"0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11","object":"event","type":"payment_intent.succeeded","created_at":"2026-10-29T15:00:00.000Z","mode":"test","data":{"object":{"payment_intent_id":"pi_c92215200m49","status":"succeeded","amount_minor":15000,"currency":"BOB"}}}',
      secrets: ['whsec_AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA='],
      now: 1790000000,
      toleranceSeconds: 300,
      expected: 'no_matching_signature',
    },
    {
      name: 'firma v1a con secreto simetrico configurado, sin clave publica',
      headers: {
        'webhook-id': '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11',
        'webhook-timestamp': '1790000000',
        'webhook-signature':
          'v1a,Wn1B0fntNSkhhpUuZkY9QIURIPKP6DAMsWh/gjJ26V1z5BNMZbl3IrtQfjlZt+WF+m80viB/o37yLdAU9dzGDg==',
      },
      payload:
        '{"id":"0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11","object":"event","type":"payment_intent.succeeded","created_at":"2026-10-29T15:00:00.000Z","mode":"test","data":{"object":{"payment_intent_id":"pi_c92215200m49","status":"succeeded","amount_minor":15000,"currency":"BOB"}}}',
      secrets: ['whsec_AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA='],
      now: 1790000000,
      toleranceSeconds: 300,
      expected: 'no_matching_signature',
    },
    {
      name: 'sin cabecera de firma',
      headers: {
        'webhook-id': '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11',
        'webhook-timestamp': '1790000000',
      },
      payload:
        '{"id":"0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11","object":"event","type":"payment_intent.succeeded","created_at":"2026-10-29T15:00:00.000Z","mode":"test","data":{"object":{"payment_intent_id":"pi_c92215200m49","status":"succeeded","amount_minor":15000,"currency":"BOB"}}}',
      secrets: ['whsec_AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA='],
      now: 1790000000,
      toleranceSeconds: 300,
      expected: 'missing_headers',
    },
    {
      name: 'marca de tiempo no numerica',
      headers: {
        'webhook-id': '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11',
        'webhook-timestamp': 'ayer',
        'webhook-signature': 'v1,+24d0VfqYGZXi9Mevv2QSniTiK+WV567IlimfV9UnqU=',
      },
      payload:
        '{"id":"0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11","object":"event","type":"payment_intent.succeeded","created_at":"2026-10-29T15:00:00.000Z","mode":"test","data":{"object":{"payment_intent_id":"pi_c92215200m49","status":"succeeded","amount_minor":15000,"currency":"BOB"}}}',
      secrets: ['whsec_AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA='],
      now: 1790000000,
      toleranceSeconds: 300,
      expected: 'invalid_timestamp',
    },
    {
      name: 'marca de tiempo en el borde (+300 s)',
      headers: {
        'webhook-id': '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11',
        'webhook-timestamp': '1789999700',
        'webhook-signature': 'v1,WmxEmU58Re6nVbCwdEyiU6lNKorGOcy/Hc9iam2wdeQ=',
      },
      payload:
        '{"id":"0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11","object":"event","type":"payment_intent.succeeded","created_at":"2026-10-29T15:00:00.000Z","mode":"test","data":{"object":{"payment_intent_id":"pi_c92215200m49","status":"succeeded","amount_minor":15000,"currency":"BOB"}}}',
      secrets: ['whsec_AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA='],
      now: 1790000000,
      toleranceSeconds: 300,
      expected: 'ok',
    },
    {
      name: 'marca de tiempo justo fuera (+301 s)',
      headers: {
        'webhook-id': '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11',
        'webhook-timestamp': '1789999699',
        'webhook-signature': 'v1,kTo8YqEX4VdagfOLOQB59Kd9xNBmEQ0hYN1U6/Eb3SA=',
      },
      payload:
        '{"id":"0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11","object":"event","type":"payment_intent.succeeded","created_at":"2026-10-29T15:00:00.000Z","mode":"test","data":{"object":{"payment_intent_id":"pi_c92215200m49","status":"succeeded","amount_minor":15000,"currency":"BOB"}}}',
      secrets: ['whsec_AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA='],
      now: 1790000000,
      toleranceSeconds: 300,
      expected: 'timestamp_outside_tolerance',
    },
    {
      name: 'marca de tiempo en el futuro, borde (-300 s)',
      headers: {
        'webhook-id': '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11',
        'webhook-timestamp': '1790000300',
        'webhook-signature': 'v1,9CcD8cE8e9HYXwnc8YhzsNPS0J/qHHnujEFJd0RD9vs=',
      },
      payload:
        '{"id":"0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11","object":"event","type":"payment_intent.succeeded","created_at":"2026-10-29T15:00:00.000Z","mode":"test","data":{"object":{"payment_intent_id":"pi_c92215200m49","status":"succeeded","amount_minor":15000,"currency":"BOB"}}}',
      secrets: ['whsec_AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA='],
      now: 1790000000,
      toleranceSeconds: 300,
      expected: 'ok',
    },
    {
      name: 'marca de tiempo en el futuro, fuera (-301 s)',
      headers: {
        'webhook-id': '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11',
        'webhook-timestamp': '1790000301',
        'webhook-signature': 'v1,JUSz5exnLBteF4pcqyORWZXR8jj80xplb6lc67iglIU=',
      },
      payload:
        '{"id":"0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11","object":"event","type":"payment_intent.succeeded","created_at":"2026-10-29T15:00:00.000Z","mode":"test","data":{"object":{"payment_intent_id":"pi_c92215200m49","status":"succeeded","amount_minor":15000,"currency":"BOB"}}}',
      secrets: ['whsec_AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA='],
      now: 1790000000,
      toleranceSeconds: 300,
      expected: 'timestamp_outside_tolerance',
    },
  ],
};

function verdict(vector: (typeof VECTORS.cases)[number]): string {
  try {
    verifyStandardWebhook({
      headers: vector.headers,
      payload: vector.payload,
      secrets: vector.secrets,
      publicKeys: vector.publicKeys,
      now: vector.now,
      toleranceSeconds: vector.toleranceSeconds,
    });
    return 'ok';
  } catch (error) {
    if (error instanceof WebhookVerificationError) return error.reason;
    throw error;
  }
}

describe('verifyStandardWebhook: paridad con @pay/webhook-signature', () => {
  it.each(VECTORS.cases)('$name', (vector) => {
    expect(verdict(vector)).toBe(vector.expected);
  });

  it('cubre los cuatro motivos de rechazo de la referencia y el caso válido', () => {
    const seen = new Set(VECTORS.cases.map((c) => c.expected));
    expect([...seen].sort()).toEqual(
      [
        'invalid_timestamp',
        'missing_headers',
        'no_matching_signature',
        'ok',
        'timestamp_outside_tolerance',
      ].sort(),
    );
  });

  it('acepta los nombres de cabecera en cualquier capitalización', () => {
    const base = VECTORS.cases[0];
    const upper = Object.fromEntries(
      Object.entries(base.headers).map(([k, v]) => [k.toUpperCase(), v]),
    );
    expect(() =>
      verifyStandardWebhook({
        headers: upper,
        payload: base.payload,
        secrets: base.secrets,
        now: base.now,
      }),
    ).not.toThrow();
  });

  it('una clave pública mal formada lanza RangeError (la configuración ya la rechaza al arrancar)', () => {
    const base = VECTORS.cases[2];
    expect(() =>
      verifyStandardWebhook({
        headers: base.headers,
        payload: base.payload,
        publicKeys: ['whpk_corta'],
        now: base.now,
      }),
    ).toThrow(RangeError);
  });
});
