import { Injectable } from '@nestjs/common';
import { OutboxService } from '../../../messaging/services/outbox.service';
import type {
  DomainEventPublisherPort,
  SchedulingDomainEventInput,
} from '../../application/ports/domain-event-publisher.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/** Adaptador del publicador de hechos de agenda al outbox transaccional de `messaging`. */
@Injectable()
export class MessagingDomainEventAdapter implements DomainEventPublisherPort {
  /** @param outbox - Outbox transaccional (misma transacción que el cambio). */
  constructor(private readonly outbox: OutboxService) {}

  /** Publica el hecho en la unidad de trabajo activa. */
  async publish(
    uow: UnitOfWork,
    input: SchedulingDomainEventInput,
  ): Promise<void> {
    await this.outbox.publishDomainEvent(uow, input);
  }
}
