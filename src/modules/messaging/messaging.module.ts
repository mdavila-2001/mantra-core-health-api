import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { WsJwtGuard } from '../../common';
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
import { NotificationsGateway } from './gateways';

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
    // Auth del gateway WS — igual que en `CommunityMessagingModule`, no es un
    // `APP_GUARD` (los gateways no pasan por el pipeline HTTP de Nest) y se
    // provee acá explícitamente para que `NotificationsGateway` lo inyecte.
    WsJwtGuard,
    NotificationsGateway,
  ],
  // `NotificationsService` se exporta para que otros dominios puedan pedir un
  // envío (p. ej. IAM al verificar el correo del auto-registro) sin duplicar la
  // lógica de consentimiento, rebote y evidencia que vive aquí.
  exports: [OutboxService, QueuesService, NotificationsService],
})
export class MessagingModule {}
