import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { Response } from 'express';
import { TELEMETRY_CONFIG, TRACE_ID_HEADER } from './telemetry.constants';
import { currentTraceContext } from './trace-context.service';
import type { TelemetryConfig } from './telemetry.types';

/**
 * Añade la cabecera `x-trace-id` a las respuestas HTTP.
 *
 * Es lo que convierte un reporte de usuario ("me dio error al guardar la
 * receta") en una investigación de treinta segundos: el cliente copia el valor
 * de la cabecera, soporte lo pega en el buscador de Jaeger y ve la traza
 * completa, incluidas las consultas SQL y las llamadas salientes.
 *
 * No modifica el cuerpo de ninguna respuesta: el contrato JSON de los 61 módulos
 * queda intacto. El `correlationId` del modelo de error tampoco se toca — sigue
 * apuntando a la línea de log, y ahora ambos identificadores conviven.
 */
@Injectable()
export class TraceResponseInterceptor implements NestInterceptor {
  constructor(
    @Inject(TELEMETRY_CONFIG)
    private readonly config: TelemetryConfig,
  ) {}

  /**
   * Fija la cabecera **antes** de ejecutar el handler.
   *
   * Hacerlo aquí y no en el flujo de respuesta garantiza que la cabecera esté
   * presente también cuando el handler lanza: el filtro global de excepciones
   * escribe después sobre el mismo objeto `Response`, que ya la lleva.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (this.config.responseHeaderEnabled && context.getType() === 'http') {
      applyTraceHeader(context.switchToHttp().getResponse<Response>());
    }
    return next.handle();
  }
}

/**
 * Escribe la cabecera si hay traza activa y la respuesta aún no se envió.
 *
 * Se exporta para que el filtro global la aplique también en los fallos que
 * ocurren **antes** de los interceptores (un guard que rechaza con 401 o 403
 * nunca llega a este interceptor, y esa respuesta también merece su traza).
 */
export function applyTraceHeader(response: Response): void {
  if (response.headersSent) return;
  const { trace_id: traceId } = currentTraceContext();
  if (traceId) response.setHeader(TRACE_ID_HEADER, traceId);
}
