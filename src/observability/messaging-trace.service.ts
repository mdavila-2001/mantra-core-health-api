import { Injectable } from '@nestjs/common';
import {
  SpanKind,
  context as otelContext,
  propagation,
  trace,
  type Link,
  type Span,
} from '@opentelemetry/api';
import { TRACER_NAME, TRACE_CARRIER_KEY } from './telemetry.constants';
import {
  asTraceSpan,
  markSpanError,
  type TraceAttributes,
  type TraceSpan,
} from './tracing.service';

/**
 * Propagación del contexto de traza a través del outbox de eventos.
 *
 * El contexto de OpenTelemetry vive en un `AsyncLocalStorage` y **no sobrevive**
 * a que un evento se escriba en PostgreSQL y otro proceso lo recoja minutos
 * después. Sin propagación explícita, la publicación y el consumo aparecen en
 * Jaeger como dos trazas inconexas y se pierde justo la pregunta que motiva todo
 * esto: "¿cuánto tardó desde que se creó la cita hasta que salió el recordatorio?".
 *
 * El contexto viaja dentro del **payload del evento**, bajo la clave reservada
 * `_trace`, y no en una columna nueva: el esquema SQL canónico (`database/**`)
 * no se modifica desde el código. Ver la decisión D10 del diseño.
 */

/** Carrier W3C: `{ traceparent, tracestate?, baggage? }`. */
export type TraceCarrier = Record<string, string>;

/** Payload de evento que puede llevar contexto de traza adjunto. */
export type CarrierPayload = Record<string, unknown>;

@Injectable()
export class MessagingTraceService {
  private get tracer() {
    return trace.getTracer(TRACER_NAME);
  }

  /**
   * Serializa el contexto activo en un carrier nuevo.
   *
   * Sin traza activa devuelve un objeto vacío, no un carrier con valores
   * inventados: un consumidor que reciba `{}` simplemente arranca su propia
   * traza.
   */
  inject(): TraceCarrier {
    const carrier: TraceCarrier = {};
    propagation.inject(otelContext.active(), carrier);
    return carrier;
  }

  /**
   * Adjunta el contexto activo al payload de un evento.
   *
   * Devuelve un objeto nuevo: no muta el payload del llamador, para no
   * introducir efectos laterales en un objeto que probablemente se persiste y
   * se reutiliza. Si no hay traza activa, devuelve el payload tal cual, sin
   * añadir una clave `_trace` vacía que solo ocuparía espacio en la base.
   */
  attach<T extends CarrierPayload>(payload: T): T {
    const carrier = this.inject();
    if (Object.keys(carrier).length === 0) return payload;
    return { ...payload, [TRACE_CARRIER_KEY]: carrier };
  }

  /**
   * Recupera el carrier de un payload recibido.
   *
   * Tolera por diseño los mensajes anteriores a esta iniciativa y los de
   * productores que no propagan contexto: devuelve `{}` en vez de fallar. Un
   * mensaje sin `_trace` se procesa exactamente igual que antes.
   */
  extract(payload: unknown): TraceCarrier {
    if (!payload || typeof payload !== 'object') return {};
    const raw = (payload as CarrierPayload)[TRACE_CARRIER_KEY];
    if (!raw || typeof raw !== 'object') return {};

    const carrier: TraceCarrier = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof value === 'string') carrier[key] = value;
    }
    return carrier;
  }

  /**
   * Ejecuta la publicación de un evento dentro de un span `PRODUCER`.
   *
   * La operación recibe el carrier ya poblado con el contexto **de este span**
   * (no del padre), que es lo que debe viajar en el payload para que el
   * consumidor se cuelgue del productor y no de la petición HTTP entera.
   */
  async runInProducerSpan<T>(
    name: string,
    attributes: TraceAttributes,
    operation: (span: TraceSpan, carrier: TraceCarrier) => Promise<T> | T,
  ): Promise<T> {
    return this.tracer.startActiveSpan<(span: Span) => Promise<T>>(
      name,
      { kind: SpanKind.PRODUCER, attributes: clean(attributes) },
      async (span) => {
        try {
          return await operation(asTraceSpan(span), this.inject());
        } catch (error) {
          markSpanError(span, error);
          throw error;
        } finally {
          span.end();
        }
      },
    );
  }

  /**
   * Ejecuta el consumo de un evento dentro de un span `CONSUMER`.
   *
   * El span se crea como **hijo del contexto extraído**, de modo que publicación
   * y consumo comparten `trace_id` y una sola traza cuenta la historia completa.
   * Además se enlaza (`links`) con el span del tick que lo procesó, para no
   * perder el camino inverso: desde la ejecución del worker se puede llegar a
   * todos los eventos que atendió.
   *
   * Con un carrier vacío (mensaje antiguo, productor sin instrumentar), el
   * contexto extraído es el activo y el span queda como hijo del tick — el
   * comportamiento correcto, sin ninguna rama especial.
   */
  async runInConsumerSpan<T>(
    name: string,
    attributes: TraceAttributes,
    carrier: TraceCarrier,
    operation: (span: TraceSpan) => Promise<T> | T,
  ): Promise<T> {
    const parentContext = propagation.extract(otelContext.active(), carrier);
    const links = this.linkToCurrentSpan(parentContext);

    return this.tracer.startActiveSpan<(span: Span) => Promise<T>>(
      name,
      { kind: SpanKind.CONSUMER, attributes: clean(attributes), links },
      parentContext,
      async (span) => {
        try {
          return await operation(asTraceSpan(span));
        } catch (error) {
          markSpanError(span, error);
          throw error;
        } finally {
          span.end();
        }
      },
    );
  }

  /**
   * Construye el enlace hacia el span activo cuando el mensaje trae una traza
   * distinta. Si el consumidor ya cuelga del tick (mismo `trace_id`), el enlace
   * sería redundante y se omite.
   */
  private linkToCurrentSpan(
    parentContext: ReturnType<typeof propagation.extract>,
  ): Link[] {
    const current = trace.getActiveSpan()?.spanContext();
    const parent = trace.getSpanContext(parentContext);
    if (!current || !parent || current.traceId === parent.traceId) return [];
    return [{ context: current }];
  }
}

/** Descarta atributos `undefined`. Duplicado mínimo para no exportar interno. */
function clean(
  attributes: TraceAttributes,
): Record<string, NonNullable<TraceAttributes[string]>> {
  const result: Record<string, NonNullable<TraceAttributes[string]>> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
}
