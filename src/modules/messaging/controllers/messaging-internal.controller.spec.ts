import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { MessagingInternalController } from './messaging-internal.controller';

const actor = { id: 'user-1', roles: ['SYSTEM'] };
const ID = '11111111-1111-1111-1111-111111111111';

function build() {
  const outboxService = {
    runRelay: mockFn(),
    dispatchEvent: mockFn(),
    ackDelivery: mockFn(),
  };
  const queuesService = {
    claimJobs: mockFn(),
    completeJob: mockFn(),
    failJob: mockFn(),
  };
  const notificationsService = { deliverNotification: mockFn() };
  return {
    controller: new MessagingInternalController(
      outboxService as any,
      queuesService as any,
      notificationsService as any,
    ),
    outboxService,
    queuesService,
    notificationsService,
  };
}

describe('MessagingInternalController', () => {
  it('delegates the outbox relay run (UC-35-02)', async () => {
    const d = build();
    const dto = { workerId: 'relay-1' } as any;
    d.outboxService.runRelay.mockResolvedValue({ claimed: 0 });

    await d.controller.runRelay(dto);

    expect(d.outboxService.runRelay).toHaveBeenCalledWith(dto);
  });

  it('delegates the dispatch with the event id (UC-35-03)', async () => {
    const d = build();
    const dto = {} as any;
    d.outboxService.dispatchEvent.mockResolvedValue({ domainEventId: ID });

    await d.controller.dispatchEvent(ID, dto, actor);

    expect(d.outboxService.dispatchEvent).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates the delivery ack (UC-35-04)', async () => {
    const d = build();
    const dto = { outcome: 'HANDLED' } as any;
    d.outboxService.ackDelivery.mockResolvedValue({ id: ID });

    await d.controller.ackDelivery(ID, dto);

    expect(d.outboxService.ackDelivery).toHaveBeenCalledWith(ID, dto);
  });

  it('delegates claiming jobs with the queue code (UC-35-06)', async () => {
    const d = build();
    const dto = { workerId: 'worker-1' } as any;
    d.queuesService.claimJobs.mockResolvedValue({ claimed: 0 });

    await d.controller.claimJobs('default', dto);

    expect(d.queuesService.claimJobs).toHaveBeenCalledWith('default', dto);
  });

  it('delegates completing the job (UC-35-07)', async () => {
    const d = build();
    const dto = { workerId: 'worker-1' } as any;
    d.queuesService.completeJob.mockResolvedValue({ id: ID });

    await d.controller.completeJob(ID, dto);

    expect(d.queuesService.completeJob).toHaveBeenCalledWith(ID, dto);
  });

  it('delegates failing the job (UC-35-08)', async () => {
    const d = build();
    const dto = { workerId: 'worker-1', errorText: 'x' } as any;
    d.queuesService.failJob.mockResolvedValue({ id: ID });

    await d.controller.failJob(ID, dto);

    expect(d.queuesService.failJob).toHaveBeenCalledWith(ID, dto);
  });

  it('delegates the delivery attempt (UC-35-11)', async () => {
    const d = build();
    const dto = { outcome: 'SENT' } as any;
    d.notificationsService.deliverNotification.mockResolvedValue({
      deliveryId: ID,
    });

    await d.controller.deliverNotification(ID, dto, actor);

    expect(d.notificationsService.deliverNotification).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });
});
