import { createHash, createHmac } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * DOBLE DECLARADO de la pasarela de pagos ALOVIDA (`pasarelapago`) para las
 * pruebas del carril INT. **No es la pasarela**: es un servidor HTTP real y
 * mínimo que cumple las reglas de idempotencia de `contracts/openapi/public-v1.yaml`
 * y de `common.yaml`:
 *
 * - `Idempotency-Key` obligatoria en todo `POST` (`400 idempotency_key_required`);
 * - misma clave y mismo cuerpo → la respuesta guardada, con
 *   `Idempotency-Replayed: true` (el cobro NO se crea otra vez);
 * - misma clave y otro cuerpo → `422 idempotency_key_reused`;
 * - cuerpo con campos desconocidos o importes inválidos → `422 validation_failed`;
 * - clave de API ausente o mal formada → `401 unauthorized`.
 *
 * Además se le pueden programar fallos (`script`) para ejercitar los resultados
 * ambiguos de la regla 11: cortar la conexión antes o DESPUÉS de ejecutar,
 * responder 5xx después de ejecutar, `409 idempotency_request_in_progress`, etc.
 *
 * Lo que este doble NO prueba: el comportamiento real de `pay-edge`, las
 * comisiones (`fee_minor` va en 0), el QR (es una cadena sintética), ni el
 * despacho real de webhooks. Un resultado contra este doble nunca se presenta
 * como resultado contra la pasarela real.
 */

/** Fallo programado para la siguiente petición `POST /payment_intents`. */
export type DoubleFault =
  /** Corta la conexión SIN ejecutar la operación. */
  | { kind: 'drop_before' }
  /** Ejecuta la operación y corta la conexión sin responder (resultado ambiguo y EJECUTADO). */
  | { kind: 'execute_then_drop' }
  /** Ejecuta la operación y responde un 5xx (ambiguo y EJECUTADO). */
  | {
      kind: 'execute_then_status';
      status: 500 | 502 | 503 | 504;
      retryAfter?: number;
    }
  /** Ejecuta la operación y tarda más que el plazo del cliente (ambiguo y EJECUTADO). */
  | { kind: 'execute_then_hang'; ms: number }
  /** Responde con un problema sin ejecutar nada. */
  | { kind: 'status'; status: number; code: string; retryAfter?: number }
  /** Responde 201 con un cuerpo que no cumple el contrato (la operación SÍ se ejecutó). */
  | { kind: 'execute_then_garbage' };

/** Una petición registrada por el doble. */
export interface DoubleCall {
  method: string;
  path: string;
  idempotencyKey?: string;
  /** Sólo el esquema de la credencial (`Bearer sk_test_…` se enmascara). */
  authorization?: string;
  requestId?: string;
  body?: unknown;
}

interface StoredIntent {
  bodyHash: string;
  intent: Record<string, unknown>;
}

const ALLOWED_FIELDS = new Set([
  'amount_minor',
  'currency',
  'payment_method',
  'description',
  'payer_name',
  'expires_in_seconds',
  'metadata',
]);

/** Servidor HTTP que se comporta como la API pública v1 de la pasarela (subconjunto). */
export class PayGatewayDouble {
  /** Todas las peticiones recibidas, en orden. */
  readonly calls: DoubleCall[] = [];
  /** Cobros realmente creados, por `Idempotency-Key`. */
  readonly created = new Map<string, StoredIntent>();
  /** Fallos pendientes, uno por petición `POST /payment_intents`. */
  script: DoubleFault[] = [];

  private server?: Server;
  private counter = 0;

  /** URL base con `/v1`, como `servers[0]` del contrato. */
  get baseUrl(): string {
    const address = this.server?.address() as AddressInfo | null | undefined;
    if (!address) throw new Error('El doble no está iniciado');
    return `http://127.0.0.1:${address.port}/v1`;
  }

  /** Cuántos cobros distintos se crearon. */
  get createdCount(): number {
    return this.created.size;
  }

  /** Peticiones `POST /payment_intents` recibidas. */
  get postCalls(): DoubleCall[] {
    return this.calls.filter(
      (c) => c.method === 'POST' && c.path === '/v1/payment_intents',
    );
  }

  async start(): Promise<void> {
    this.server = createServer((req, res) => {
      void this.handle(req, res);
    });
    await new Promise<void>((resolve) =>
      this.server?.listen(0, '127.0.0.1', resolve),
    );
  }

  async stop(): Promise<void> {
    const server = this.server;
    if (!server) return;
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    this.server = undefined;
  }

  private async handle(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const raw = Buffer.concat(chunks).toString('utf8');
    let body: unknown;
    try {
      body = raw ? JSON.parse(raw) : undefined;
    } catch {
      body = undefined;
    }
    const path = (req.url ?? '').split('?')[0];
    const header = (name: string): string | undefined => {
      const value = req.headers[name];
      return Array.isArray(value) ? value[0] : value;
    };
    const authorization = header('authorization');
    this.calls.push({
      method: req.method ?? '',
      path,
      idempotencyKey: header('idempotency-key'),
      authorization: authorization?.startsWith('Bearer sk_test_')
        ? 'Bearer sk_test_***'
        : authorization,
      requestId: header('x-request-id'),
      body,
    });

    if (!authorization?.startsWith('Bearer sk_test_')) {
      return this.problem(res, 401, 'unauthorized');
    }

    if (req.method === 'POST' && path === '/v1/payment_intents') {
      return this.createIntent(req, res, body, header('idempotency-key'));
    }
    const match = /^\/v1\/payment_intents\/(pi_[a-z0-9]+)$/u.exec(path);
    if (req.method === 'GET' && match) {
      const found = [...this.created.values()].find(
        (s) => s.intent.id === match[1],
      );
      return found
        ? this.json(res, 200, found.intent)
        : this.problem(res, 404, 'resource_not_found');
    }
    return this.problem(res, 404, 'resource_not_found');
  }

  private async createIntent(
    req: IncomingMessage,
    res: ServerResponse,
    body: unknown,
    key: string | undefined,
  ): Promise<void> {
    const fault = this.script.shift();

    if (fault?.kind === 'drop_before') return void req.socket.destroy();
    if (fault?.kind === 'status') {
      return this.problem(res, fault.status, fault.code, fault.retryAfter);
    }

    if (!key) return this.problem(res, 400, 'idempotency_key_required');
    const invalid = this.validate(body);
    if (invalid)
      return this.problem(res, 422, 'validation_failed', undefined, invalid);

    const bodyHash = createHash('sha256')
      .update(JSON.stringify(body))
      .digest('hex');
    const stored = this.created.get(key);
    let replayed = false;
    if (stored) {
      if (stored.bodyHash !== bodyHash) {
        return this.problem(res, 422, 'idempotency_key_reused');
      }
      replayed = true;
    } else {
      this.counter += 1;
      const input = body as {
        amount_minor: number;
        payment_method: { type: string };
      };
      const now = '2026-10-29T15:00:00.000Z';
      this.created.set(key, {
        bodyHash,
        intent: {
          id: `pi_dbl${String(this.counter).padStart(10, '0')}`,
          object: 'payment_intent',
          amount_minor: input.amount_minor,
          currency: 'BOB',
          status: 'requires_action',
          payment_method_type: input.payment_method.type,
          fee_minor: 0,
          net_minor: input.amount_minor,
          next_action: {
            type: 'display_qr',
            qr: {
              payload: '000201-DOBLE-SINTETICO-6304ABCD',
              expires_at: '2026-10-29T16:00:00.000Z',
            },
          },
          last_error: null,
          created_at: now,
          expires_at: '2026-10-29T16:00:00.000Z',
          succeeded_at: null,
        },
      });
    }
    const intent = this.created.get(key)?.intent;

    switch (fault?.kind) {
      case 'execute_then_drop':
        return void req.socket.destroy();
      case 'execute_then_status':
        return this.problem(
          res,
          fault.status,
          'upstream_error',
          fault.retryAfter,
        );
      case 'execute_then_hang':
        await new Promise((resolve) => setTimeout(resolve, fault.ms));
        return void res.destroy();
      case 'execute_then_garbage':
        return this.json(res, 201, { ok: true });
      default:
        return this.json(
          res,
          201,
          intent,
          replayed ? { 'Idempotency-Replayed': 'true' } : {},
        );
    }
  }

  private validate(body: unknown): string | undefined {
    if (typeof body !== 'object' || body === null) return 'body';
    const b = body as Record<string, unknown>;
    for (const field of Object.keys(b)) {
      if (!ALLOWED_FIELDS.has(field)) return `unknown_field:${field}`;
    }
    if (
      !Number.isSafeInteger(b.amount_minor) ||
      (b.amount_minor as number) < 1
    ) {
      return 'amount_minor';
    }
    if (b.currency !== 'BOB') return 'currency';
    const method = b.payment_method as { type?: unknown } | undefined;
    if (
      !['qr', 'card', 'bank_transfer', 'wallet'].includes(String(method?.type))
    ) {
      return 'payment_method';
    }
    return undefined;
  }

  private json(
    res: ServerResponse,
    status: number,
    payload: unknown,
    extra: Record<string, string> = {},
  ): void {
    res.writeHead(status, { 'Content-Type': 'application/json', ...extra });
    res.end(JSON.stringify(payload));
  }

  private problem(
    res: ServerResponse,
    status: number,
    code: string,
    retryAfter?: number,
    detail?: string,
  ): void {
    res.writeHead(status, {
      'Content-Type': 'application/problem+json',
      ...(retryAfter !== undefined
        ? { 'Retry-After': String(retryAfter) }
        : {}),
    });
    res.end(
      JSON.stringify({
        type: `urn:alovida:pay:problem:${code}`,
        title: code,
        status,
        code,
        ...(detail ? { detail } : {}),
        request_id: 'req_double',
      }),
    );
  }
}

/** Secreto `whsec_…` fijo y sintético para las pruebas (32 bytes 0x01…0x20). */
export const TEST_WEBHOOK_SECRET = `whsec_${Buffer.from(
  Array.from({ length: 32 }, (_, i) => i + 1),
).toString('base64')}`;

/**
 * Firma un webhook como lo haría la pasarela (Standard Webhooks v1, HMAC-SHA256).
 * Réplica de prueba: la verificación de la API se contrasta además contra
 * vectores generados por la librería de referencia
 * (`standard-webhook-signature.parity.spec.ts`).
 */
export function signTestWebhook(input: {
  id: string;
  timestamp: number;
  payload: string;
  secret?: string;
}): Record<string, string> {
  const secret = Buffer.from(
    (input.secret ?? TEST_WEBHOOK_SECRET).replace(/^whsec_/u, ''),
    'base64',
  );
  const content = Buffer.concat([
    Buffer.from(`${input.id}.${input.timestamp}.`),
    Buffer.from(input.payload),
  ]);
  const signature = createHmac('sha256', secret)
    .update(content)
    .digest('base64');
  return {
    'webhook-id': input.id,
    'webhook-timestamp': String(input.timestamp),
    'webhook-signature': `v1,${signature}`,
  };
}
