import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { PeriopEventPublisher } from './periop-event-publisher';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const outbox = {
    publishDomainEvent: mockFn().mockResolvedValue({
      domainEventId: 'ev-1',
      outboxMessageId: 'om-1',
      idempotencyKey: 'k',
      duplicate: false,
    }),
  };
  const notifications = {
    emitInApp: mockFn().mockResolvedValue({ suppressed: false }),
  };
  const casesRepo = {
    findTeamByCase: mockFn().mockResolvedValue([
      {
        practitionerProfileId: 'hp-anest',
        statusConceptId: CONCEPTS.TEAM_ASSIGNED,
      },
      { practitionerProfileId: 'hp-nurse', statusConceptId: 'declined' },
      {
        practitionerProfileId: 'hp-actor',
        statusConceptId: CONCEPTS.TEAM_ASSIGNED,
      },
    ]),
  };
  const accountLinks = {
    findActiveByPerson: mockFn(async (_em: unknown, personId: string) => ({
      userId: `user-of-${personId}`,
    })),
  };
  const publisher = new PeriopEventPublisher(
    outbox as any,
    notifications as any,
    casesRepo as any,
    accountLinks as any,
  );
  return { publisher, tx, outbox, notifications, casesRepo };
}

const event = (eventType: string) => ({
  tenantId: 't1',
  eventType,
  aggregateType: 'procedure_case',
  aggregateId: 'case-1',
  payloadJson: { responsibleProfileId: 'hp-surgeon' },
  actorUserId: 'user-of-hp-actor',
});

describe('PeriopEventPublisher', () => {
  it('a declined participation notifies the responsible surgeon in-app', async () => {
    const d = build();
    const input = event('periop.case.team_participation_declined');

    const result = await d.publisher.publishDomainEvent(d.tx as any, input);

    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(d.tx, input);
    expect(result.domainEventId).toBe('ev-1');
    expect(d.notifications.emitInApp).toHaveBeenCalledTimes(1);
    expect(d.notifications.emitInApp).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'user-of-hp-surgeon',
        category: 'CLINICAL',
        destination: { type: 'PROCEDURE_CASE', id: 'case-1' },
        tenantId: 't1',
        debounceKey: 'periop:event:ev-1:user-of-hp-surgeon',
      }),
    );
  });

  it('a blocked confirmation notifies the responsible surgeon', async () => {
    const d = build();
    await d.publisher.publishDomainEvent(
      d.tx as any,
      event('periop.case.confirmation_blocked'),
    );

    expect(d.notifications.emitInApp).toHaveBeenCalledWith(
      expect.objectContaining({ recipientUserId: 'user-of-hp-surgeon' }),
    );
  });

  it('reacceptance notifies the surgeon and the pending team, never the actor', async () => {
    const d = build();
    await d.publisher.publishDomainEvent(
      d.tx as any,
      event('periop.case.reacceptance_required'),
    );

    const recipients = d.notifications.emitInApp.mock.calls.map(
      (call: any[]) => call[0].recipientUserId,
    );
    expect(recipients).toEqual(['user-of-hp-surgeon', 'user-of-hp-anest']);
  });

  it('integration events only reach the outbox', async () => {
    const d = build();
    await d.publisher.publishDomainEvent(
      d.tx as any,
      event('periop.or_block.created'),
    );

    expect(d.outbox.publishDomainEvent).toHaveBeenCalled();
    expect(d.notifications.emitInApp).not.toHaveBeenCalled();
  });

  it('a duplicate publish does not notify twice', async () => {
    const d = build();
    d.outbox.publishDomainEvent.mockResolvedValue({
      domainEventId: 'ev-1',
      outboxMessageId: 'om-1',
      idempotencyKey: 'k',
      duplicate: true,
    });
    await d.publisher.publishDomainEvent(
      d.tx as any,
      event('periop.case.team_participation_declined'),
    );

    expect(d.notifications.emitInApp).not.toHaveBeenCalled();
  });
});
