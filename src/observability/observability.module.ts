import { Global, Module } from '@nestjs/common';
import { TELEMETRY_CONFIG } from './telemetry.constants';
import { loadTelemetryConfig } from './telemetry.config';
import { TracingService } from './tracing.service';
import { TraceContextService } from './trace-context.service';
import { MessagingTraceService } from './messaging-trace.service';
import { TraceResponseInterceptor } from './trace-response.interceptor';

/**
 * Capa de trazas distribuidas disponible para todo el backend.
 *
 * `@Global` por la misma razón que `LoggingModule`: los 61 módulos de dominio
 * deben poder inyectar `TracingService` sin reimportar nada, igual que hoy
 * inyectan `PinoLogger`. Un módulo transversal que hubiera que declarar 61 veces
 * acabaría instrumentándose a medias.
 *
 * Este módulo **no arranca el SDK**. El SDK se inicializa mucho antes, en
 * `telemetry.bootstrap.ts`, importado en la primera línea de `main.ts` y de
 * `worker/bootstrap.ts`; aquí solo se exponen los servicios que lo consumen. Con
 * `OTEL_ENABLED=false` los servicios siguen siendo inyectables y degradan a
 * no-op, de modo que el código de dominio no necesita ninguna guarda.
 */
@Global()
@Module({
  providers: [
    {
      provide: TELEMETRY_CONFIG,
      // La misma función pura que usa el bootstrap: una sola fuente de verdad
      // para la configuración, leída una vez y compartida por inyección.
      useFactory: () => loadTelemetryConfig(),
    },
    TracingService,
    TraceContextService,
    MessagingTraceService,
    TraceResponseInterceptor,
  ],
  exports: [
    TELEMETRY_CONFIG,
    TracingService,
    TraceContextService,
    MessagingTraceService,
    TraceResponseInterceptor,
  ],
})
export class ObservabilityModule {}
