import { Injectable } from '@nestjs/common';
import {
  SpanStatusCode,
  trace,
  type Span,
  type SpanKind,
  type Tracer,
} from '@opentelemetry/api';
import { TRACER_NAME } from './telemetry.constants';

/**
 * API de trazas para el código de negocio.
 *
 * Es la única superficie que los 61 módulos de dominio usan para instrumentar
 * sus operaciones. Ningún archivo bajo `src/modules/` importa `@opentelemetry/*`
 * ni sabe que detrás hay Jaeger: reciben `TracingService` por inyección y
 * trabajan con `TraceSpan`, una interfaz de cuatro métodos. Sustituir el backend
 * de trazas es un cambio de variable de entorno, no de código de dominio.
 */

/** Valores admitidos como atributo de span. Escalares o listas de escalares. */
export type TraceAttributeValue =
  string | number | boolean | string[] | number[] | boolean[];

/** Mapa de atributos. Los `undefined` se descartan al aplicarse. */
export type TraceAttributes = Readonly<
  Record<string, TraceAttributeValue | undefined>
>;

/**
 * Vista del span que recibe el código de dominio.
 *
 * Deliberadamente más pequeña que `Span` de OpenTelemetry: no expone `end()`
 * (lo gestiona `runInSpan`, que garantiza el cierre en `finally`) ni
 * `setStatus()` (el estado lo decide la política de errores, no cada dominio).
 */
export interface TraceSpan {
  /** Registra un hito interno de la operación, con su marca de tiempo. */
  addEvent(name: string, attributes?: TraceAttributes): void;
  /** Fija un atributo. Ver los atributos permitidos en `APP_ATTR`. */
  setAttribute(key: string, value: TraceAttributeValue): void;
  /** Fija varios atributos de una vez. */
  setAttributes(attributes: TraceAttributes): void;
  /** Adjunta una excepción al span sin alterar el flujo de control. */
  recordException(error: unknown): void;
}

/**
 * Spans a los que ya se adjuntó una excepción.
 *
 * Evita que el mismo fallo se registre varias veces en el mismo span cuando
 * atraviesa capas instrumentadas (servicio → controlador → filtro global). Un
 * `WeakSet` no impide que el span se libere de memoria.
 */
const spansWithRecordedException = new WeakSet<Span>();

/** Descarta los `undefined` para no emitir atributos vacíos. */
function cleanAttributes(
  attributes: TraceAttributes | undefined,
): Record<string, TraceAttributeValue> {
  const result: Record<string, TraceAttributeValue> = {};
  if (!attributes) return result;
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
}

/** Normaliza cualquier valor lanzado a un `Error` que OpenTelemetry entienda. */
function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Marca un span como fallido y le adjunta la excepción, una sola vez.
 *
 * Se exporta porque el filtro global de excepciones aplica exactamente la misma
 * política sobre el span HTTP activo.
 */
export function markSpanError(span: Span, error: unknown): void {
  const normalized = toError(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: normalized.message });
  if (spansWithRecordedException.has(span)) return;
  spansWithRecordedException.add(span);
  span.recordException(normalized);
}

/** Envuelve un `Span` de OpenTelemetry en la vista reducida del dominio. */
export function asTraceSpan(span: Span): TraceSpan {
  return {
    addEvent: (name, attributes) =>
      void span.addEvent(name, cleanAttributes(attributes)),
    setAttribute: (key, value) => void span.setAttribute(key, value),
    setAttributes: (attributes) =>
      void span.setAttributes(cleanAttributes(attributes)),
    recordException: (error) => void markSpanError(span, error),
  };
}

/**
 * Ejecuta una operación dentro de un span, sin pasar por el contenedor de
 * inyección.
 *
 * Existe para la **infraestructura** que no es un proveedor de NestJS y por
 * tanto no puede inyectar `TracingService`: en concreto `runTick`
 * (`src/worker/run-tick.util.ts`), la función por la que pasan los 30 jobs
 * programados. El código de dominio no debe usarla: para eso está el servicio
 * inyectable, que es lo que `TracingService.runInSpan` delega aquí.
 *
 * @param name nombre estable del span, sin identificadores dinámicos.
 * @param attributes atributos iniciales.
 * @param operation trabajo a ejecutar.
 * @param options `kind` opcional para spans de productor/consumidor.
 */
export async function runInTracedSpan<T>(
  name: string,
  attributes: TraceAttributes,
  operation: (span: TraceSpan) => Promise<T> | T,
  options: { kind?: SpanKind } = {},
): Promise<T> {
  return trace
    .getTracer(TRACER_NAME)
    .startActiveSpan<(span: Span) => Promise<T>>(
      name,
      { attributes: cleanAttributes(attributes), kind: options.kind },
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

@Injectable()
export class TracingService {
  /**
   * Tracer del backend. Se resuelve en cada llamada y no se cachea: con la
   * telemetría deshabilitada devuelve un tracer no-op sin coste, y si el SDK
   * arranca después (pruebas) no queda una referencia obsoleta.
   */
  private get tracer(): Tracer {
    return trace.getTracer(TRACER_NAME);
  }

  /**
   * Ejecuta una operación asíncrona dentro de un span y lo cierra siempre.
   *
   * El span se cierra en `finally`, de modo que una excepción no deja spans
   * abiertos (que en Jaeger aparecen como operaciones que "nunca terminaron").
   * La excepción se registra y **se relanza sin modificar**: la instrumentación
   * observa, no altera el flujo de control ni el tipo del error.
   *
   * @param name nombre estable del span, `<dominio>.<acción>`. Nunca debe
   *             construirse con identificadores dinámicos.
   * @param attributes atributos iniciales; ver `APP_ATTR`.
   * @param operation trabajo a ejecutar; recibe el span para añadir eventos.
   */
  async runInSpan<T>(
    name: string,
    attributes: TraceAttributes,
    operation: (span: TraceSpan) => Promise<T> | T,
  ): Promise<T> {
    return runInTracedSpan(name, attributes, operation);
  }

  /**
   * Variante síncrona de `runInSpan`, para operaciones que no devuelven promesa
   * (cálculos, validaciones, evaluación de reglas en memoria). Evita convertir
   * en asíncrono un camino de código que no lo era.
   */
  runInSpanSync<T>(
    name: string,
    attributes: TraceAttributes,
    operation: (span: TraceSpan) => T,
  ): T {
    return this.tracer.startActiveSpan<(span: Span) => T>(
      name,
      { attributes: cleanAttributes(attributes) },
      (span) => {
        try {
          return operation(asTraceSpan(span));
        } catch (error) {
          markSpanError(span, error);
          throw error;
        } finally {
          span.end();
        }
      },
    );
  }

  /** Añade un evento al span activo, si lo hay. */
  addEvent(name: string, attributes?: TraceAttributes): void {
    trace.getActiveSpan()?.addEvent(name, cleanAttributes(attributes));
  }

  /** Fija un atributo en el span activo, si lo hay. */
  setAttribute(key: string, value: TraceAttributeValue): void {
    trace.getActiveSpan()?.setAttribute(key, value);
  }

  /** Fija varios atributos en el span activo, si lo hay. */
  setAttributes(attributes: TraceAttributes): void {
    trace.getActiveSpan()?.setAttributes(cleanAttributes(attributes));
  }

  /**
   * Marca el span activo como fallido y le adjunta la excepción.
   *
   * No relanza ni transforma el error: quien lo llama decide qué hacer con él.
   */
  recordException(error: unknown): void {
    const span = trace.getActiveSpan();
    if (span) markSpanError(span, error);
  }
}
