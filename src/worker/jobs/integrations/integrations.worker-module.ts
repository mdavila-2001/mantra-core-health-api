import { Module } from '@nestjs/common';
import { MessageDispatchJob } from './message-dispatch.job';
import { MessageRetryJob } from './message-retry.job';
import { MessageCorrelationJob } from './message-correlation.job';

export { MessageDispatchJob } from './message-dispatch.job';
export { MessageRetryJob } from './message-retry.job';
export { MessageCorrelationJob } from './message-correlation.job';

/**
 * Fase 5 del plan de corrección de workers: cierra el bucle de mensajería
 * saliente de `integrations` (UC-12-06/07/08/10) — el propio código de
 * `integrations-messages.controller.ts` ya llamaba a estos tres endpoints
 * "worker" en sus comentarios, pero nada los invocaba automáticamente.
 *
 * No incluye `dead-letter` como job aparte: `MessageRetryJob` decide entre
 * `:retry` y `:dead-letter` según `exhausted`, calculado por el propio
 * endpoint de descubrimiento.
 */
@Module({
  providers: [MessageDispatchJob, MessageRetryJob, MessageCorrelationJob],
})
export class IntegrationsWorkerModule {}
