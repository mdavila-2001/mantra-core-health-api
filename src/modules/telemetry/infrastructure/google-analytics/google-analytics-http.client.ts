import { Injectable, Optional } from '@nestjs/common';
import axios from 'axios';
import { WebAnalyticsNotConfiguredError } from '../../domain/web-analytics.errors';
import {
  loadGoogleAnalyticsConfig,
  type GoogleAnalyticsConfig,
} from './google-analytics.config';
import {
  mapGoogleAnalyticsError,
  type Ga4Payload,
} from './google-analytics.mapper';

/** Diagnóstico que devuelve GA4 cuando se usa el endpoint de validación. */
export interface Ga4ValidationMessage {
  /**
   * Ruta del campo señalado dentro del payload.
   */
  fieldPath?: string;
  /**
   * Descripción legible del problema.
   */
  description?: string;
  /**
   * Código de validación de Google.
   */
  validationCode?: string;
}

/** Lo que se sabe de una petición al Measurement Protocol tras responder. */
export interface Ga4SendResult {
  /**
   * Código HTTP devuelto (`204` en recolección real).
   */
  status: number;
  /**
   * Mensajes de validación; sólo llegan con `GA4_DEBUG_VALIDATION=true`.
   */
  validationMessages: Ga4ValidationMessage[];
}

/**
 * Cliente HTTP del Measurement Protocol de GA4. Única pieza que conoce la URL,
 * las credenciales y el formato de la respuesta.
 *
 * El endpoint real responde `204 No Content` **tanto si el evento se cuenta
 * como si se descarta**: no hay forma de distinguirlo desde el código de
 * estado. Por eso existe el modo validación (`/debug/mp/collect`), que sí
 * devuelve el motivo, y por eso el adaptador lo registra en el log en lugar de
 * tragárselo: es el único canal por el que un despliegue mal configurado se
 * entera de que lleva semanas enviando eventos que nadie cuenta.
 */
@Injectable()
export class GoogleAnalyticsHttpClient {
  private readonly config: GoogleAnalyticsConfig;

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param config - Configuración inyectable; por defecto, la del entorno.
   *   Va marcada como opcional porque su tipo es una interfaz: sin ese
   *   marcado, Nest intentaría resolverla como si fuera un proveedor y el
   *   contenedor fallaría al arrancar. Marcada, Nest pasa `undefined` y entra
   *   el valor por defecto, que es lo que quiere producción; las pruebas la
   *   inyectan a mano.
   */
  constructor(
    @Optional() config: GoogleAnalyticsConfig = loadGoogleAnalyticsConfig(),
  ) {
    this.config = config;
  }

  /** `true` si hay credenciales suficientes para enviar. */
  get configured(): boolean {
    return Boolean(this.config.measurementId && this.config.apiSecret);
  }

  /**
   * Envía una petición al Measurement Protocol.
   *
   * @param payload - Cuerpo ya construido por el mapper.
   * @param signal - Señal de cancelación del plazo/apagado.
   * @returns Estado HTTP y mensajes de validación si los hubo.
   * @throws WebAnalyticsNotConfiguredError si faltan credenciales.
   * @throws WebAnalyticsError con la causa traducida ante cualquier fallo HTTP.
   */
  async send(
    payload: Ga4Payload,
    signal?: AbortSignal,
  ): Promise<Ga4SendResult> {
    if (!this.configured) {
      throw new WebAnalyticsNotConfiguredError(
        'GA4_MEASUREMENT_ID/GA4_API_SECRET no configurados',
      );
    }
    const path = this.config.debugValidation
      ? '/debug/mp/collect'
      : '/mp/collect';
    try {
      const response = await axios.post<{
        /**
         * Mensajes de validación devueltos por el endpoint de depuración.
         */
        validationMessages?: Ga4ValidationMessage[];
      }>(`${this.config.baseUrl}${path}`, payload, {
        params: {
          measurement_id: this.config.measurementId,
          api_secret: this.config.apiSecret,
        },
        headers: { 'Content-Type': 'application/json' },
        timeout: this.config.timeoutMs,
        signal,
        // El Measurement Protocol responde 204 sin cuerpo; cualquier 2xx es
        // aceptación. Se deja que axios trate el resto como error para que el
        // mapper decida transitoriedad en un solo sitio.
        validateStatus: (status) => status >= 200 && status < 300,
      });
      return {
        status: response.status,
        validationMessages: response.data?.validationMessages ?? [],
      };
    } catch (error) {
      throw mapGoogleAnalyticsError(error);
    }
  }
}
