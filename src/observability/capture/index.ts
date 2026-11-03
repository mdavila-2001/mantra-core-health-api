import { errorSink } from './error-sink';
import { httpSink } from './http-sink';
import { slowRequestSink } from './slow-request-sink';
import { sqlSink } from './sql-sink';
import type { ObservabilityEnv } from './observability.env';

export * from './error-sink';
export * from './http-sink';
export * from './instance-identity';
export * from './observability.env';
export * from './operation-resolver';
export * from './request-context';
export * from './slow-request-sink';
export * from './sql-sink';

/**
 * Enciende o apaga los sinks del proceso según la configuración. Lo llama
 * `main.ts` antes de instalar el middleware y, por si la API arranca por otra
 * vía, el módulo `observability` al construirse. Idempotente.
 */
export function configureCapture(env: ObservabilityEnv): void {
  httpSink.setEnabled(env.enabled);
  errorSink.configure({
    enabled: env.enabled,
    actorHashSecret: env.actorHashSecret,
  });
  sqlSink.setEnabled(env.enabled);
  slowRequestSink.configure({
    enabled: env.enabled,
    slowRequestMs: env.slowRequestMs,
  });
}
