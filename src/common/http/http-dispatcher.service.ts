import { Injectable } from '@nestjs/common';
import axios, { type AxiosRequestConfig } from 'axios';
import { canonicalJson, signPayload } from '../crypto/webhook-signature';
import { PreconditionFailedException } from '../errors/domain.exception';
import {
  pinnedLookup,
  resolveOutboundDestination,
  systemResolver,
  type OutboundResolver,
} from './ssrf-guard';

/** Timeout por defecto (ms) para el despacho saliente. */
export const DEFAULT_DISPATCH_TIMEOUT_MS = 5000;

/**
 * MCH-035 · presupuesto de recursos del despacho saliente. Son topes duros del
 * transporte: ninguna opción de negocio (timeout del endpoint, cabeceras del
 * mensaje) puede superarlos ni desactivarlos.
 */
/** Plazo total máximo (ms): DNS + conexión + envío + lectura de la respuesta. */
export const MAX_DISPATCH_TIMEOUT_MS = 30_000;
/** Tamaño máximo del cuerpo enviado (bytes, ya serializado). */
export const MAX_DISPATCH_REQUEST_BYTES = 1024 * 1024;
/** Tamaño máximo de la respuesta leída (bytes, contados tras descomprimir). */
export const MAX_DISPATCH_RESPONSE_BYTES = 1024 * 1024;

/**
 * Cabeceras que controla el transporte o la firma. Las del llamador con estos
 * nombres se descartan: no pueden pisar la firma ni el framing HTTP.
 */
const RESERVED_HEADERS: ReadonlySet<string> = new Set([
  'host',
  'content-length',
  'content-type',
  'content-encoding',
  'transfer-encoding',
  'connection',
  'keep-alive',
  'upgrade',
  'te',
  'expect',
  'proxy-authorization',
  'x-signature',
  'x-signature-algorithm',
]);

/**
 * Plazo efectivo del despacho. Un valor ausente, cero, negativo o no numérico
 * usa el de por defecto (no desactiva el plazo); uno mayor se acota al máximo.
 */
export function effectiveDispatchTimeoutMs(timeoutMs?: number): number {
  if (timeoutMs === undefined || Number.isNaN(timeoutMs) || timeoutMs <= 0)
    return DEFAULT_DISPATCH_TIMEOUT_MS;
  return Math.min(timeoutMs, MAX_DISPATCH_TIMEOUT_MS);
}

/** Cabeceras del llamador sin las reservadas (comparación sin mayúsculas). */
function callerHeaders(
  headers: Record<string, string> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers ?? {})) {
    if (!RESERVED_HEADERS.has(name.toLowerCase())) out[name] = value;
  }
  return out;
}

/** Entrada para un despacho HTTP saliente firmado. */
export interface OutboundDispatchInput {
  /** URL absoluta de destino (endpoint del proveedor / callbackUri). */
  url: string;
  /** Cuerpo a enviar; se serializa de forma canónica y se firma tal cual. */
  body: unknown;
  /** Secreto HMAC con el que se firma el cuerpo. */
  secret: string;
  /** Cabeceras adicionales del proveedor. */
  headers?: Record<string, string>;
  /** Plazo total en ms (por defecto 5s, acotado a `MAX_DISPATCH_TIMEOUT_MS`). */
  timeoutMs?: number;
}

/** Resultado real (no simulado) de un despacho saliente. */
export interface OutboundDispatchResult {
  /** true si el proveedor respondió 2xx. */
  ok: boolean;
  /** Código HTTP real (0 si no hubo respuesta: timeout/DNS/conexión). */
  httpStatus: number;
  /** Latencia real medida extremo a extremo. */
  latencyMs: number;
  /** Firma HMAC-SHA256 (hex) enviada en la cabecera `x-signature`. */
  signature: string;
  /** Cuerpo de la respuesta del proveedor (si lo hubo). */
  responseBody: unknown;
  /** Detalle del error cuando `ok` es false. */
  errorText?: string;
}

/**
 * Despacho HTTP saliente real, firmado y protegido contra SSRF.
 *
 * Firma el cuerpo con HMAC-SHA256, aplica la guarda anti-SSRF, hace el POST con
 * timeout y devuelve status y latencia reales. No lanza por códigos HTTP de
 * error (los evalúa el llamador); solo propaga la excepción de la guarda
 * anti-SSRF, que es una precondición de negocio.
 */
@Injectable()
export class HttpDispatcherService {
  /**
   * Resolvedor DNS usado para validar el destino; ausente significa el del
   * sistema. Es opcional y público a propósito: como propiedad obligatoria (o
   * protegida) la clase deja de ser estructuralmente compatible con los dobles
   * `{ post }` que usan las pruebas de los módulos que la consumen.
   */
  resolver?: OutboundResolver;

  /**
   * Ejecuta la operación post.
   *
   * @param input - Valor de input requerido por la operación.
   * @returns Resultado de post conforme al contrato `Promise<OutboundDispatchResult>`.
   */
  async post(input: OutboundDispatchInput): Promise<OutboundDispatchResult> {
    const rawBody = canonicalJson(input.body);
    const requestBytes = Buffer.byteLength(rawBody, 'utf8');
    if (requestBytes > MAX_DISPATCH_REQUEST_BYTES) {
      // Reintentar no lo arregla: es una precondición, no un fallo de entrega.
      throw new PreconditionFailedException(
        'El cuerpo del despacho excede el tamaño permitido',
        { bytes: requestBytes, maxBytes: MAX_DISPATCH_REQUEST_BYTES },
      );
    }
    const signature = signPayload(input.secret, rawBody);
    const startedAt = Date.now();

    // Plazo total: el `timeout` de axios mide inactividad del socket y un
    // proveedor que gotea bytes lo evita; la señal corta la operación completa.
    const timeoutMs = effectiveDispatchTimeoutMs(input.timeoutMs);
    const deadline = new AbortController();
    const timer = setTimeout(() => deadline.abort(), timeoutMs);

    try {
      // MCH-006: la política valida todas las direcciones del destino y la
      // conexión sólo puede ir a esas (lookup anclado). Un rechazo de la política
      // es una precondición y se propaga; un fallo de DNS es fallo de entrega.
      const destination = await Promise.race([
        resolveOutboundDestination(input.url, this.resolver ?? systemResolver),
        new Promise<never>((_, reject) =>
          deadline.signal.addEventListener('abort', () =>
            reject(
              Object.assign(new Error('deadline'), { code: 'ERR_CANCELED' }),
            ),
          ),
        ),
      ]);
      const response = await axios.post(destination.url.href, rawBody, {
        timeout: timeoutMs,
        signal: deadline.signal,
        maxBodyLength: MAX_DISPATCH_REQUEST_BYTES,
        maxContentLength: MAX_DISPATCH_RESPONSE_BYTES,
        // Sin redirecciones: un 3xx se devuelve como respuesta, no se sigue.
        maxRedirects: 0,
        // Axios tipa `lookup` más estrecho que Node: no admite la forma de una
        // sola dirección en texto, que sí es parte del contrato de
        // `net.connect` y la que usa el agente cuando no pide `all`. El
        // comportamiento es el de Node; la aserción sólo salva esa diferencia.
        lookup: pinnedLookup(
          destination,
        ) as unknown as AxiosRequestConfig['lookup'],
        // Un proxy de entorno recibiría la conexión en lugar del destino validado.
        proxy: false,
        // El cuerpo ya es una cadena firmada: no volver a transformarlo.
        transformRequest: [(data: unknown) => data],
        // Evaluamos nosotros el status; axios no debe lanzar por 4xx/5xx.
        validateStatus: () => true,
        headers: {
          ...callerHeaders(input.headers),
          'content-type': 'application/json',
          'x-signature': `sha256=${signature}`,
          'x-signature-algorithm': 'HMAC-SHA256',
        },
      });

      const latencyMs = Date.now() - startedAt;
      const ok = response.status >= 200 && response.status < 300;
      return {
        ok,
        httpStatus: response.status,
        latencyMs,
        signature,
        responseBody: response.data,
        errorText: ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      if (error instanceof PreconditionFailedException) throw error;
      const latencyMs = Date.now() - startedAt;
      const err = error as {
        /**
         * Valor de code mantenido por la instancia.
         */
        code?: string; /**
         * Valor de message mantenido por la instancia.
         */
        message?: string;
      };
      return {
        ok: false,
        httpStatus: 0,
        latencyMs,
        signature,
        responseBody: undefined,
        errorText: dispatchErrorText(err, deadline.signal.aborted),
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Texto de error estable para los cortes del presupuesto de recursos. */
function dispatchErrorText(
  err: { code?: string; message?: string },
  deadlineExceeded: boolean,
): string {
  if (deadlineExceeded) return 'DEADLINE_EXCEEDED';
  if (err.message?.includes('maxContentLength')) return 'RESPONSE_TOO_LARGE';
  return err.code ?? err.message ?? 'dispatch failed';
}

/** Une una URL base con una ruta relativa evitando barras duplicadas. */
export function joinUrl(base: string, path?: string): string {
  if (!path) return base;
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
