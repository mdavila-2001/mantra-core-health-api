import { Injectable } from '@nestjs/common';
import { OutboxService } from '../../../messaging/services';
import type { DomainEventPublisherPort } from '../../application/ports/domain-event-publisher.port';
import type { PharmacyDomainEventInput } from '../../application/ports/domain-event-publisher.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/** Adaptador del publicador local al outbox del contexto messaging. */
@Injectable()
export class MessagingDomainEventAdapter implements DomainEventPublisherPort {
  constructor(private readonly outbox: OutboxService) {}

  async publish(
    uow: UnitOfWork,
    input: PharmacyDomainEventInput,
  ): Promise<void> {
    await this.outbox.publishDomainEvent(uow, input);
  }
}
