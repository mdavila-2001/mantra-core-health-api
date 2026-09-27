import { Module } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { OutboxRelayJob } from './outbox-relay.job';
import { QueueJob } from './queue.job';
import { NotificationDeliveryJob } from './notification-delivery.job';
import { MockProviderWiringService } from './mock-provider-wiring.service';
import { GoogleProviderWiringService } from './google-provider-wiring.service';
import { GuardianLinkSubscriber } from './guardian-link.subscriber';
import { PHONE_MESSAGING_CHANNEL } from './phone/phone-messaging-channel.port';
import {
  loadPhoneMessagingConfig,
  selectPhoneMessagingChannel,
} from './phone/phone-messaging.config';

export { registerQueueJobHandler } from './queue.job';
export { NotificationDeliveryJob } from './notification-delivery.job';

/**
 * Fase 1 (P0) del plan de corrección de workers: cierra el "Bucle del
 * worker" de `messaging/README.md` (relay del outbox, despacho de eventos,
 * drenado de colas y entrega de notificaciones).
 *
 * `GoogleProviderWiringService` se registra DESPUÉS de
 * `MockProviderWiringService` a propósito: `OnModuleInit` corre en el orden
 * de este array, así que si ambos proveedores están configurados a la vez,
 * el real (Google) gana y pisa el adapter que dejó el mock.
 *
 * `GuardianLinkSubscriber` es el primer consumidor interno de una cola del
 * outbox (`guardian-links`): el aviso al tutor del paciente de mostrador. Su
 * canal de teléfono se elige al arrancar —Twilio con credenciales, el doble
 * sin ellas— y queda escrito en el log de arranque. La cola sólo se drena si
 * `MESSAGING_QUEUE_CODES` la incluye (así está en `docker-compose*.yml`).
 */
@Module({
  providers: [
    OutboxRelayJob,
    QueueJob,
    NotificationDeliveryJob,
    MockProviderWiringService,
    GoogleProviderWiringService,
    {
      provide: PHONE_MESSAGING_CHANNEL,
      inject: [PinoLogger],
      useFactory: (logger: PinoLogger) =>
        selectPhoneMessagingChannel(loadPhoneMessagingConfig(), logger),
    },
    GuardianLinkSubscriber,
  ],
})
export class MessagingWorkerModule {}
