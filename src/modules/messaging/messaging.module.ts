import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  MessagingController,
  MessagingInternalController,
  ProviderWebhooksController,
} from './controllers';
import { OutboxService, QueuesService, NotificationsService } from './services';
import {
  OutboxRepository,
  QueuesRepository,
  NotificationsRepository,
  DeliveryStatusTransitionsRepository,
} from './repositories';

/**
 * Módulo de mensajería: outbox transaccional, colas de trabajo con reintento y
 * cola muerta, y notificación multicanal con acuses del proveedor
 * (UC-35-01 … 13).
 *
 * **Exporta `OutboxService`** a propósito: `publishDomainEvent()` es la API que
 * el resto de módulos usa para publicar sus hechos dentro de su propia
 * transacción. Es la pieza que faltaba para que los "Pendiente / Outbox" de los
 * otros módulos dejen de estar pendientes.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    MessagingController,
    MessagingInternalController,
    ProviderWebhooksController,
  ],
  providers: [
    OutboxRepository,
    QueuesRepository,
    NotificationsRepository,
    DeliveryStatusTransitionsRepository,
    OutboxService,
    QueuesService,
    NotificationsService,
  ],
  exports: [OutboxService],
})
export class MessagingModule {}
