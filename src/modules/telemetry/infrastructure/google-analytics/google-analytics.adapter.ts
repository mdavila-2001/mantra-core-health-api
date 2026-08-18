import { Injectable, Optional } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  Bulkhead,
  BulkheadFullError,
  CircuitBreaker,
  CircuitOpenError,
  retry,
  withTimeout,
} from '../../../../common/resilience';
import {
  WebAnalyticsError,
  WebAnalyticsUnauthorizedError,
} from '../../domain/web-analytics.errors';
import type {
  WebAnalyticsDispatchResult,
  WebAnalyticsHealth,
  WebAnalyticsHit,
  WebAnalyticsPort,
} from '../../domain/web-analytics.port';
import {
  loadGoogleAnalyticsConfig,
  type GoogleAnalyticsConfig,
} from './google-analytics.config';
import { GoogleAnalyticsHttpClient } from './google-analytics-http.client';
import {
  toMeasurementProtocolPayloads,
  type Ga4Payload,
} from './google-analytics.mapper';

/** Nombre de la operación en logs, métricas y errores de resiliencia. */
const OPERATION = 'telemetry.web-analytics.ga4';

/**
 * Adaptador de analítica web sobre el Measurement Protocol de Google Analytics 4.
 *
 * Es el reenvío **server-side** de la telemetría que ya se persistió: el portal
 * no habla con Google, habla con esta API, y esta API decide qué sale. Eso es
 * justo lo que hace útil al adaptador frente a pegar `gtag.js` en el portal —
 * un bloqueador de anuncios no lo silencia, ningún dato personal se le escapa al
 * navegador, y el consentimiento se aplica una sola vez, aquí, sobre datos que
 * ya pasaron el gate del módulo.
 *
 * Envuelve cada petición en la escalera de resiliencia de la casa, de fuera
 * hacia dentro: mamparo (cuántas caben a la vez) → cortacircuitos (¿está
 * caído?) → reintento (¿se cura solo?) → plazo (¿tarda demasiado?). Ninguna
 * excepción sale de `track`: la analítica es un efecto secundario del producto
 * y no puede degradar la ingesta que sí es fuente de verdad.
 */
@Injectable()
export class GoogleAnalyticsAdapter implements WebAnalyticsPort {
  readonly providerName = 'google_analytics';
  private readonly config: GoogleAnalyticsConfig;
  private readonly bulkhead: Bulkhead;
  private readonly circuit: CircuitBreaker;

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param http - Cliente del Measurement Protocol.
   * @param logger - Logger estructurado del proceso.
   * @param config - Configuración inyectable; por defecto, la del entorno.
   *   Opcional por la misma razón que en `GoogleAnalyticsHttpClient`: su tipo
   *   es una interfaz y Nest no puede resolverla como proveedor.
   */
  constructor(
    private readonly http: GoogleAnalyticsHttpClient,
    private readonly logger: PinoLogger,
    @Optional() config: GoogleAnalyticsConfig = loadGoogleAnalyticsConfig(),
  ) {
    this.logger.setContext(GoogleAnalyticsAdapter.name);
    this.config = config;
    this.bulkhead = new Bulkhead({
      operation: OPERATION,
      maxConcurrent: config.maxConcurrency,
      maxQueued: config.maxQueued,
    });
    this.circuit = new CircuitBreaker({
      operation: OPERATION,
      windowSize: config.circuitFailureThreshold,
      minimumThroughput: config.circuitFailureThreshold,
      failureRateThreshold: 1,
      openDurationMs: config.circuitOpenMs,
      maxOpenDurationMs: config.circuitOpenMs * 8,
      // Un payload que Google rechaza por inválido es culpa nuestra y no mejora
      // por abrir el circuito; lo que sí lo justifica es una dependencia caída
      // o unas credenciales rechazadas, que fallarían igual en cada envío.
      isFailure: (error) =>
        error instanceof WebAnalyticsError &&
        (error.retryable || error instanceof WebAnalyticsUnauthorizedError),
      onStateChange: (change) =>
        this.logger.warn(
          { ...change, component: `${OPERATION}.circuit` },
          'Google Analytics circuit state changed',
        ),
    });
  }

  /**
   * Reenvía un lote de eventos a GA4.
   *
   * @param hit - Envío del puerto, ya minimizado y pseudonimizado.
   * @returns Cuántos eventos se entregaron, cuántos se perdieron y por qué.
   */
  async track(hit: WebAnalyticsHit): Promise<WebAnalyticsDispatchResult> {
    const empty = {
      provider: this.providerName,
      delivered: 0,
      dropped: 0,
      requests: 0,
    };
    if (!hit.events.length) return { ...empty, skipReason: 'EMPTY' };
    if (!this.http.configured) {
      return {
        ...empty,
        dropped: hit.events.length,
        skipReason: 'NOT_CONFIGURED',
      };
    }
    const consent = hit.consent ?? {
      analytics: true,
      adUserData: this.config.adUserData,
      adPersonalization: this.config.adPersonalization,
    };
    if (!consent.analytics) {
      return { ...empty, dropped: hit.events.length, skipReason: 'NO_CONSENT' };
    }
    if (!hit.identity.subjectKey && !hit.identity.sessionKey) {
      return {
        ...empty,
        dropped: hit.events.length,
        skipReason: 'NO_IDENTITY',
      };
    }

    const { payloads, dropped } = toMeasurementProtocolPayloads(
      { ...hit, consent },
      {
        subjectSalt: this.config.subjectSalt,
        defaultConsent: consent,
        batchToleranceMs: this.config.batchToleranceMs,
        now: new Date(),
      },
    );

    const result: WebAnalyticsDispatchResult = {
      provider: this.providerName,
      delivered: 0,
      dropped,
      requests: 0,
      validationMessages: [],
    };

    for (const payload of payloads) {
      const outcome = await this.deliver(payload, hit.tenantId);
      result.requests += 1;
      if (outcome.delivered) {
        result.delivered += payload.events.length;
      } else {
        result.dropped += payload.events.length;
      }
      result.validationMessages?.push(...outcome.validationMessages);
      // Con el circuito abierto o el mamparo lleno, el resto del lote correría
      // la misma suerte: se cuenta como perdido y se deja de insistir.
      if (outcome.stopBatch) {
        const remaining = payloads
          .slice(payloads.indexOf(payload) + 1)
          .reduce((sum, next) => sum + next.events.length, 0);
        result.dropped += remaining;
        break;
      }
    }

    if (!result.validationMessages?.length) delete result.validationMessages;
    return result;
  }

  /**
   * Describe el estado del adaptador.
   *
   * @returns Proveedor activo y si tiene credenciales utilizables.
   */
  async health(): Promise<WebAnalyticsHealth> {
    return {
      provider: this.providerName,
      enabled: true,
      configured: this.http.configured,
    };
  }

  /** Entrega una petición con toda la escalera de resiliencia aplicada. */
  private async deliver(
    payload: Ga4Payload,
    tenantId: string | undefined,
  ): Promise<{
    /**
     * `true` si GA4 aceptó la petición.
     */
    delivered: boolean;
    /**
     * `true` si no tiene sentido seguir con el resto del lote.
     */
    stopBatch: boolean;
    /**
     * Diagnóstico devuelto en modo validación.
     */
    validationMessages: string[];
  }> {
    try {
      const response = await this.bulkhead.execute(() =>
        this.circuit.execute(() =>
          retry(
            OPERATION,
            (_attempt, signal) =>
              withTimeout(
                OPERATION,
                this.config.timeoutMs,
                (timeoutSignal) => this.http.send(payload, timeoutSignal),
                signal,
              ),
            {
              attempts: this.config.maxRetries + 1,
              baseDelayMs: this.config.retryBaseMs,
              maxDelayMs: 5_000,
              totalBudgetMs:
                this.config.timeoutMs * (this.config.maxRetries + 1) +
                this.config.retryBaseMs * 4,
              isRetryable: (error) =>
                error instanceof WebAnalyticsError && error.retryable,
            },
          ),
        ),
      );
      const messages = response.validationMessages.map((message) =>
        `${message.validationCode ?? 'VALIDATION'}${message.fieldPath ? ` @${message.fieldPath}` : ''}: ${message.description ?? ''}`.trim(),
      );
      if (messages.length) {
        // GA4 acepta la petición (2xx) aunque descarte los eventos; sin este
        // aviso, un despliegue mal configurado no se entera nunca.
        this.logger.warn(
          { operation: OPERATION, tenantId, messages },
          'Google Analytics returned validation messages',
        );
      }
      return {
        delivered: true,
        stopBatch: false,
        validationMessages: messages,
      };
    } catch (error) {
      const stopBatch =
        error instanceof CircuitOpenError || error instanceof BulkheadFullError;
      this.logger.warn(
        {
          operation: OPERATION,
          tenantId,
          events: payload.events.length,
          code:
            error instanceof WebAnalyticsError
              ? error.code
              : error instanceof Error
                ? error.name
                : 'UNKNOWN',
          reason: error instanceof Error ? error.message : String(error),
        },
        'Google Analytics dispatch failed; telemetry stays persisted',
      );
      return { delivered: false, stopBatch, validationMessages: [] };
    }
  }
}
