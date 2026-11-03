import { Injectable } from '@nestjs/common';
import { OutboxService } from '../../../messaging/services';
import type { ClaimDecisionPublisherPort } from '../../application/ports/claim-decision-publisher.port';

@Injectable()
export class ClaimDecisionPublisherAdapter implements ClaimDecisionPublisherPort {
  constructor(private readonly outbox: OutboxService) {}

  async publish(
    tx: Parameters<ClaimDecisionPublisherPort['publish']>[0],
    event: Parameters<ClaimDecisionPublisherPort['publish']>[1],
  ): Promise<void> {
    await this.outbox.publishDomainEvent(tx, event);
  }
}
