import { Injectable } from '@nestjs/common';
import type {
  WebAnalyticsDispatchResult,
  WebAnalyticsHealth,
  WebAnalyticsHit,
  WebAnalyticsPort,
} from '../domain/web-analytics.port';

/**
 * Adaptador por defecto: no reenvía nada.
 *
 * Es el que se cablea mientras `TELEMETRY_WEB_ANALYTICS_ENABLED` sea `false`, y
 * a diferencia del adaptador de TTS deshabilitado **no lanza**: aquí no hay un
 * caso de uso esperando un audio, hay una ingesta que ya persistió el evento y
 * a la que no se le puede devolver un fallo por un efecto secundario opcional.
 * Devolver `DISABLED` deja además una respuesta uniforme que las pruebas y el
 * endpoint de estado pueden leer sin distinguir el adaptador activo.
 */
@Injectable()
export class DisabledWebAnalyticsAdapter implements WebAnalyticsPort {
  readonly providerName = 'disabled';

  /**
   * Descarta el envío sin contacto externo.
   *
   * @param hit - Envío que se habría reenviado.
   * @returns Resultado con todos los eventos contados como descartados.
   */
  async track(hit: WebAnalyticsHit): Promise<WebAnalyticsDispatchResult> {
    return {
      provider: this.providerName,
      delivered: 0,
      dropped: hit.events.length,
      requests: 0,
      skipReason: 'DISABLED',
    };
  }

  /**
   * Describe el estado del adaptador.
   *
   * @returns Proveedor inactivo y sin configurar.
   */
  async health(): Promise<WebAnalyticsHealth> {
    return { provider: this.providerName, enabled: false, configured: false };
  }
}
