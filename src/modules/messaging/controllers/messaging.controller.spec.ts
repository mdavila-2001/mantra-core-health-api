import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { MessagingController } from './messaging.controller';

const actor = { id: 'user-1', roles: ['MESSAGING_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';

function build() {
  const queuesService = { enqueueJob: mockFn(), redriveDeadLetter: mockFn() };
  const notificationsService = {
    createRequest: mockFn(),
    markInAppRead: mockFn(),
  };
  return {
    controller: new MessagingController(
      queuesService as any,
      notificationsService as any,
    ),
    queuesService,
    notificationsService,
  };
}

describe('MessagingController', () => {
  it('delegates enqueueing with the queue code (UC-35-05)', async () => {
    const d = build();
    const dto = { jobType: 'x', dedupeKey: 'k', payloadJson: {} } as any;
    d.queuesService.enqueueJob.mockResolvedValue({ id: ID });

    await d.controller.enqueueJob('default', dto, actor);

    expect(d.queuesService.enqueueJob).toHaveBeenCalledWith(
      'default',
      dto,
      actor,
    );
  });

  it('delegates the dead letter redrive (UC-35-09)', async () => {
    const d = build();
    const dto = { reason: 'x' } as any;
    d.queuesService.redriveDeadLetter.mockResolvedValue({ jobId: ID });

    await d.controller.redriveDeadLetter(ID, dto, actor);

    expect(d.queuesService.redriveDeadLetter).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the notification request (UC-35-10)', async () => {
    const d = build();
    const dto = { channelId: ID } as any;
    d.notificationsService.createRequest.mockResolvedValue({ id: ID });

    await d.controller.createNotificationRequest(dto, actor);

    expect(d.notificationsService.createRequest).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates marking the in-app notification as read (UC-35-13)', async () => {
    const d = build();
    d.notificationsService.markInAppRead.mockResolvedValue({ id: ID });

    await d.controller.markInAppRead(ID, actor);

    expect(d.notificationsService.markInAppRead).toHaveBeenCalledWith(
      ID,
      actor,
    );
  });
});
