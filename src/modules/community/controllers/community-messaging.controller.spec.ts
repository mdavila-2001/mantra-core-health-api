import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityMessagingController } from './community-messaging.controller';

const actor = { id: 'u1', roles: [] } as any;

function build() {
  const service = {
    createConversation: mockFn(),
    sendMessage: mockFn(),
    markRead: mockFn(),
  };
  return {
    controller: new CommunityMessagingController(service as any),
    service,
  };
}

describe('CommunityMessagingController', () => {
  it('delegates createConversation', async () => {
    const d = build();
    const dto = { participantProfileIds: ['a', 'b'] };
    await d.controller.createConversation(dto, actor);
    expect(d.service.createConversation).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates sendMessage (UC-19-06)', async () => {
    const d = build();
    const dto = { senderProfileId: 'p1', bodyText: 'hi' };
    await d.controller.sendMessage('conv1', dto, actor);
    expect(d.service.sendMessage).toHaveBeenCalledWith('conv1', dto, actor);
  });

  it('delegates markRead (UC-19-07)', async () => {
    const d = build();
    const dto = { recipientProfileId: 'p1' };
    await d.controller.markRead('conv1', dto, actor);
    expect(d.service.markRead).toHaveBeenCalledWith('conv1', dto, actor);
  });
});
