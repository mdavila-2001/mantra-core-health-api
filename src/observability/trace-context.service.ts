import { Injectable } from '@nestjs/common';
import { trace } from '@opentelemetry/api';

/**
 * Lectura del contexto de traza activo.
 *
 * Es la pieza que conecta tres mundos que hasta ahora no se hablaban: los logs
 * de pino, la respuesta HTTP que ve el cliente y la traza almacenada en Jaeger.
 * Todos usan el **mismo** `trace_id`, y ese identificador procede siempre del
 * contexto activo de OpenTelemetry — nunca de una cabecera enviada por el
 * cliente, que sería un valor no verificable y falsificable.
 */

/** Contexto de traza tal como se serializa en un log estructurado. */
export interface TraceLogContext {
  /** Identificador de la traza completa (32 hex). */
  trace_id?: string;
  /** Identificador del span concreto que emitió la línea (16 hex). */
  span_id?: string;
  /** Banderas W3C; `1` indica que la traza fue muestreada. */
  trace_flags?: number;
}

/**
 * Devuelve el contexto de traza activo, o un objeto vacío si no hay ninguno.
 *
 * Es una **función pura y sin dependencias de NestJS** a propósito: la consume
 * también el `mixin` de pino (`src/logging/pino-options.ts`), que se construye
 * al evaluar `LoggingModule`, antes de que exista el contenedor de inyección.
 *
 * Devolver `{}` cuando no hay span activo es deliberado: un log emitido fuera de
 * toda traza (arranque, tarea de fondo sin instrumentar) no debe llevar un
 * `trace_id` inventado que no corresponda a ninguna traza real.
 */
export function currentTraceContext(): TraceLogContext {
  const span = trace.getActiveSpan();
  if (!span) return {};

  const context = span.spanContext();
  // Un span no grabable (muestreo negativo, SDK deshabilitado) tiene un
  // `spanContext` de ceros: incluirlo en el log sería peor que no incluir nada.
  if (
    !context.traceId ||
    context.traceId === '00000000000000000000000000000000'
  ) {
    return {};
  }

  return {
    trace_id: context.traceId,
    span_id: context.spanId,
    trace_flags: context.traceFlags,
  };
}

@Injectable()
export class TraceContextService {
  /** `trace_id` activo, o `undefined` fuera de toda traza. */
  getActiveTraceId(): string | undefined {
    return currentTraceContext().trace_id;
  }

  /** `span_id` activo, o `undefined` fuera de toda traza. */
  getActiveSpanId(): string | undefined {
    return currentTraceContext().span_id;
  }

  /** Contexto completo, listo para adjuntar a un log estructurado. */
  getLogContext(): TraceLogContext {
    return currentTraceContext();
  }
}
