import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { canonicalJson, signPayload } from '../crypto/webhook-signature';
import { assertOutboundUrlAllowed } from './ssrf-guard';

/** Timeout por defecto (ms) para el despacho saliente. */
export const DEFAULT_DISPATCH_TIMEOUT_MS = 5000;

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
  /** Timeout en ms (por defecto 5s). */
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
   * Ejecuta la operación post.
   *
   * @param input - Valor de input requerido por la operación.
   * @returns Resultado de post conforme al contrato `Promise<OutboundDispatchResult>`.
   */
  async post(input: OutboundDispatchInput): Promise<OutboundDispatchResult> {
    assertOutboundUrlAllowed(input.url);

    const rawBody = canonicalJson(input.body);
    const signature = signPayload(input.secret, rawBody);
    const startedAt = Date.now();

    try {
      const response = await axios.post(input.url, rawBody, {
        timeout: input.timeoutMs ?? DEFAULT_DISPATCH_TIMEOUT_MS,
        maxRedirects: 0,
        // El cuerpo ya es una cadena firmada: no volver a transformarlo.
        transformRequest: [(data: unknown) => data],
        // Evaluamos nosotros el status; axios no debe lanzar por 4xx/5xx.
        validateStatus: () => true,
        headers: {
          'content-type': 'application/json',
          'x-signature': `sha256=${signature}`,
          'x-signature-algorithm': 'HMAC-SHA256',
          ...input.headers,
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
        errorText: err.code ?? err.message ?? 'dispatch failed',
      };
    }
  }
}

/** Une una URL base con una ruta relativa evitando barras duplicadas. */
export function joinUrl(base: string, path?: string): string {
  if (!path) return base;
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
