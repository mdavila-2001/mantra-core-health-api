import { context, propagation, trace } from '@opentelemetry/api';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
  type ReadableSpan,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';

/**
 * Proveedor de trazas en memoria para las pruebas.
 *
 * Las pruebas unitarias de esta capa **no** arrancan el `NodeSDK` ni dependen de
 * una instancia de Jaeger: registran un `NodeTracerProvider` con un exportador
 * en memoria y leen los spans terminados. `register()` instala además el gestor
 * de contexto basado en `AsyncLocalStorage`, sin el cual `startActiveSpan` no
 * anidaría y las pruebas de jerarquía padre-hijo no probarían nada.
 *
 * Vive en `src/` porque el proyecto ejecuta las pruebas unitarias con
 * `rootDir: src`. El sufijo `.testing.ts` lo excluye de `tsconfig.build.json`,
 * de modo que no llega a `dist/` ni arrastra `@opentelemetry/sdk-trace-node`
 * (una devDependency) a la imagen de producción.
 */
export interface TestTracer {
  /** Spans ya terminados, en orden de finalización. */
  spans(): ReadableSpan[];
  /** Busca un span por nombre exacto. */
  find(name: string): ReadableSpan | undefined;
  /** Vacía el exportador entre casos. */
  reset(): void;
  /** Desregistra el proveedor global. */
  shutdown(): Promise<void>;
}

/** Registra un proveedor de trazas en memoria y devuelve su controlador. */
export function setupTestTracer(): TestTracer {
  const exporter = new InMemorySpanExporter();
  const provider = new NodeTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  provider.register({
    propagator: new CompositePropagator({
      propagators: [
        new W3CTraceContextPropagator(),
        new W3CBaggagePropagator(),
      ],
    }),
  });

  return {
    spans: () => exporter.getFinishedSpans(),
    find: (name) =>
      exporter.getFinishedSpans().find((span) => span.name === name),
    reset: () => exporter.reset(),
    shutdown: async () => {
      await provider.shutdown();
      trace.disable();
      context.disable();
      propagation.disable();
    },
  };
}
