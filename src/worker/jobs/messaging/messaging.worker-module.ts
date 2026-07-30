import { Module } from '@nestjs/common';
import { OutboxRelayJob } from './outbox-relay.job';
import { QueueJob } from './queue.job';
import { NotificationDeliveryJob } from './notification-delivery.job';
import { MockProviderWiringService } from './mock-provider-wiring.service';

export { registerQueueJobHandler } from './queue.job';
export { NotificationDeliveryJob } from './notification-delivery.job';

/**
 * Fase 1 (P0) del plan de corrección de workers: cierra el "Bucle del
 * worker" de `messaging/README.md` (relay del outbox, despacho de eventos,
 * drenado de colas y entrega de notificaciones).
 */
@Module({
  providers: [
    OutboxRelayJob,
    QueueJob,
    NotificationDeliveryJob,
    MockProviderWiringService,
  ],
})
export class MessagingWorkerModule {}
