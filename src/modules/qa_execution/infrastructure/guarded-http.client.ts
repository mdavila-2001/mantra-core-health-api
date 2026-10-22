import { Inject, Injectable, Optional } from '@nestjs/common';
import { lookup as dnsLookup } from 'node:dns/promises';
import { request as httpRequest, type IncomingHttpHeaders } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import {
  addressViolation,
  type GuardViolation,
  type TargetAllowlist,
  urlViolations,
} from '../domain/target-guard';

/** Tope de cuerpo de respuesta que se lee y se guarda como evidencia. */
export const MAX_RESPONSE_BYTES = 1_048_576;

export interface GuardedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  timeoutMs: number;
}

export type GuardedResponse =
  | {
      kind: 'RESPONSE';
      status: number;
      headers: IncomingHttpHeaders;
      body: unknown;
      latencyMs: number;
      truncated: boolean;
      /** 3xx: se registra como respuesta; la redirección no se sigue. */
      redirectNotFollowed: boolean;
      connectedAddress: string;
    }
  | { kind: 'BLOCKED'; violations: GuardViolation[] }
  | {
      kind: 'TRANSPORT_ERROR';
      code: string;
      message: string;
      latencyMs: number;
    };

/** Resolución DNS inyectable para poder probar sin red. */
export type Resolver = (
  host: string,
) => Promise<Array<{ address: string; family: number }>>;

const defaultResolver: Resolver = (host) =>
  dnsLookup(host, { all: true, verbatim: true });

/** Token para sustituir la resolución DNS (pruebas). */
export const QA_DNS_RESOLVER = Symbol('QA_DNS_RESOLVER');

/**
 * Cliente HTTP del runner de QA. No usa `fetch` global a propósito: aquí hace
 * falta controlar la conexión.
 *
 * 1. La URL se valida contra el destino (esquema, host, puerto, prefijo).
 * 2. El host se resuelve y se valida CADA dirección devuelta; basta una
 *    prohibida para bloquear (un DNS con una IP pública y una interna es el
 *    truco clásico).
 * 3. La conexión se fija a la dirección validada vía `lookup`, así que un DNS
 *    que cambia entre validar y conectar (rebinding) no tiene efecto. Para
 *    HTTPS el SNI y el certificado siguen validando contra el nombre real.
 * 4. Las redirecciones no se siguen.
 */
@Injectable()
export class GuardedHttpClient {
  private readonly resolve: Resolver;

  constructor(@Optional() @Inject(QA_DNS_RESOLVER) resolver?: Resolver) {
    this.resolve = resolver ?? defaultResolver;
  }

  async send(
    request: GuardedRequest,
    target: TargetAllowlist,
  ): Promise<GuardedResponse> {
    const urlProblems = urlViolations(request.url, target);
    if (urlProblems.length > 0)
      return { kind: 'BLOCKED', violations: urlProblems };

    const url = new URL(request.url);
    const host = url.hostname.replace(/^\[|\]$/g, '');
    let addresses: Array<{ address: string; family: number }>;
    const started = Date.now();
    try {
      addresses = isIP(host)
        ? [{ address: host, family: isIP(host) }]
        : await this.resolve(host);
    } catch (error) {
      return {
        kind: 'TRANSPORT_ERROR',
        code: 'DNS_FAILED',
        message: (error as Error).message.slice(0, 300),
        latencyMs: Date.now() - started,
      };
    }
    if (addresses.length === 0) {
      return {
        kind: 'TRANSPORT_ERROR',
        code: 'DNS_EMPTY',
        message: 'Sin direcciones',
        latencyMs: 0,
      };
    }
    const blocked = addresses
      .map((entry) =>
        addressViolation(entry.address, target.allowPrivateNetwork),
      )
      .filter((violation): violation is GuardViolation => violation !== null);
    if (blocked.length > 0) return { kind: 'BLOCKED', violations: blocked };

    const pinned = addresses[0];
    const payload =
      request.body === undefined || request.body === null
        ? undefined
        : Buffer.from(JSON.stringify(request.body));
    const send = url.protocol === 'https:' ? httpsRequest : httpRequest;

    return new Promise<GuardedResponse>((resolvePromise) => {
      const begin = Date.now();
      let settled = false;
      const done = (result: GuardedResponse) => {
        if (!settled) {
          settled = true;
          resolvePromise(result);
        }
      };
      const req = send(
        url,
        {
          method: request.method,
          headers: {
            accept: 'application/json',
            ...(payload
              ? {
                  'content-type': 'application/json',
                  'content-length': payload.length,
                }
              : {}),
            ...request.headers,
          },
          timeout: request.timeoutMs,
          // Fija la IP ya validada: el socket no vuelve a preguntar al DNS.
          lookup: (_hostname, options, callback) => {
            if ((options as { all?: boolean }).all) {
              (
                callback as (
                  e: null,
                  a: Array<{ address: string; family: number }>,
                ) => void
              )(null, [pinned]);
            } else {
              callback(null, pinned.address, pinned.family);
            }
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          let size = 0;
          let truncated = false;
          res.on('data', (chunk: Buffer) => {
            if (size >= MAX_RESPONSE_BYTES) {
              truncated = true;
              return;
            }
            const room = MAX_RESPONSE_BYTES - size;
            chunks.push(chunk.length > room ? chunk.subarray(0, room) : chunk);
            size += Math.min(chunk.length, room);
            if (chunk.length > room) truncated = true;
          });
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            let body: unknown = text;
            if (
              (res.headers['content-type'] ?? '').includes('json') &&
              !truncated
            ) {
              try {
                body = JSON.parse(text);
              } catch {
                body = text;
              }
            }
            const status = res.statusCode ?? 0;
            done({
              kind: 'RESPONSE',
              status,
              headers: res.headers,
              body,
              latencyMs: Date.now() - begin,
              truncated,
              redirectNotFollowed: status >= 300 && status < 400,
              connectedAddress: pinned.address,
            });
          });
          res.on('error', (error) =>
            done({
              kind: 'TRANSPORT_ERROR',
              code: 'RESPONSE_ERROR',
              message: error.message,
              latencyMs: Date.now() - begin,
            }),
          );
        },
      );
      req.on('timeout', () => {
        req.destroy();
        done({
          kind: 'TRANSPORT_ERROR',
          code: 'TIMEOUT',
          message: `Sin respuesta en ${request.timeoutMs} ms`,
          latencyMs: Date.now() - begin,
        });
      });
      req.on('error', (error: NodeJS.ErrnoException) =>
        done({
          kind: 'TRANSPORT_ERROR',
          code: error.code ?? 'CONNECTION_ERROR',
          message: error.message.slice(0, 300),
          latencyMs: Date.now() - begin,
        }),
      );
      if (payload) req.write(payload);
      req.end();
    });
  }
}
