import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { NotificationsService, OutboxService } from '../../messaging/services';
import type {
  PublishDomainEventInput,
  PublishDomainEventResult,
} from '../../messaging/services/outbox.service';
import { PersonAccountLinksRepository } from '../../profiles/infrastructure/repositories';
import { PeriopCasesRepository } from '../repositories';

/** The person-facing text of each periop event that promises a notice. */
interface PeriopNotice {
  readonly subject: string;
  readonly bodyText: string;
  /** Besides the responsible surgeon, the team still pending acceptance. */
  readonly toPendingTeam?: boolean;
}

/**
 * Only these three events promise a person a notice (CAN-INT-002, spec 166,
 * reacceptance). The OR events (`checklist`, `room_event`, `or_block`) are
 * integration facts with no recipient and stay outbox-only.
 */
const NOTICES: Readonly<Record<string, PeriopNotice>> = {
  'periop.case.confirmation_blocked': {
    subject: 'No se pudo confirmar una intervención',
    bodyText:
      'Hay integrantes del equipo sin aceptación o sin credencial vigente. Revise el equipo.',
  },
  'periop.case.team_participation_declined': {
    subject: 'Un integrante no aceptó su participación',
    bodyText: 'Revise el equipo de la intervención para cubrir el rol.',
  },
  'periop.case.reacceptance_required': {
    subject: 'La intervención cambió: confirme su participación',
    bodyText:
      'Se modificó la intervención y el equipo debe volver a aceptar su participación.',
    toPendingTeam: true,
  },
};

/**
 * Publishes periop domain events and delivers the in-app notice each event
 * promises (`OutboxService` has no consumer that turns them into a bell).
 *
 * Same signature as `OutboxService.publishDomainEvent`, so the use cases keep
 * their call. It runs inside the use-case transaction: `emitInApp` nests as a
 * savepoint, so the notice commits only with the fact (the reason these
 * events went through the outbox) and never throws. Push and socket wait for
 * the request COMMIT (`PushFanout` queues them on the tenant boundary).
 */
@Injectable()
export class PeriopEventPublisher {
  constructor(
    private readonly outbox: OutboxService,
    private readonly notifications: NotificationsService,
    private readonly casesRepo: PeriopCasesRepository,
    private readonly accountLinks: PersonAccountLinksRepository,
  ) {}

  async publishDomainEvent(
    tx: EntityManager,
    input: PublishDomainEventInput,
  ): Promise<PublishDomainEventResult> {
    const result = await this.outbox.publishDomainEvent(tx, input);
    const notice = NOTICES[input.eventType];
    // A duplicate publish already notified with the original event.
    if (notice && !result.duplicate)
      await this.notify(tx, input, notice, result.domainEventId);
    return result;
  }

  private async notify(
    tx: EntityManager,
    input: PublishDomainEventInput,
    notice: PeriopNotice,
    domainEventId: string,
  ): Promise<void> {
    const recipients = await this.recipientsOf(tx, input, notice);
    if (recipients.length === 0) return;
    // Flush first so the nested in-app savepoint starts from a clean unit of work.
    await tx.flush();
    for (const recipientUserId of recipients) {
      await this.notifications.emitInApp({
        recipientUserId,
        category: 'CLINICAL',
        subject: notice.subject,
        bodyText: notice.bodyText,
        destination: { type: 'PROCEDURE_CASE', id: input.aggregateId },
        tenantId: input.tenantId,
        debounceKey: `periop:event:${domainEventId}:${recipientUserId}`,
        actorUserId: input.actorUserId,
      });
    }
  }

  /** Accounts to notify, without the actor and without repeats. */
  private async recipientsOf(
    tx: EntityManager,
    input: PublishDomainEventInput,
    notice: PeriopNotice,
  ): Promise<string[]> {
    const payload = (input.payloadJson ?? {}) as {
      responsibleProfileId?: string;
    };
    const profileIds = new Set<string>();
    if (payload.responsibleProfileId)
      profileIds.add(payload.responsibleProfileId);
    if (notice.toPendingTeam) {
      const team = await this.casesRepo.findTeamByCase(tx, input.aggregateId);
      for (const member of team) {
        if (member.statusConceptId === CONCEPTS.TEAM_ASSIGNED)
          profileIds.add(member.practitionerProfileId);
      }
    }
    const users = new Set<string>();
    for (const personId of profileIds) {
      // Practitioner profile ids are person ids.
      const link = await this.accountLinks.findActiveByPerson(tx, personId);
      if (link?.userId && link.userId !== input.actorUserId)
        users.add(link.userId);
    }
    return [...users];
  }
}
