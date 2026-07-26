import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityMessagingService } from './community-messaging.service';
import { PreconditionFailedException, ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: [] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const conversationsRepo = {
    findConversationById: mockFn(),
    createConversation: mockFn(),
    createParticipant: mockFn(),
    findActiveParticipant: mockFn(),
    findParticipants: mockFn().mockResolvedValue([]),
    createMessage: mockFn(),
    findLastMessage: mockFn(),
    createReceipt: mockFn(),
  };
  const blocksRepo = { existsBetween: mockFn().mockResolvedValue(null) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityMessagingService(em as any, conversationsRepo as any, blocksRepo as any, logger as any);
  return { service, tx, conversationsRepo, blocksRepo };
}

describe('CommunityMessagingService', () => {
  it('creates a conversation with its participants', async () => {
    const d = build();
    d.conversationsRepo.createConversation.mockReturnValue({ id: 'conv1' });
    const res = await d.service.createConversation({ participantProfileIds: ['p1', 'p2'] } as any, actor);
    expect(res).toEqual({ id: 'conv1' });
    expect(d.conversationsRepo.createParticipant).toHaveBeenCalledTimes(2);
  });

  describe('sendMessage (UC-19-06)', () => {
    it('throws when the conversation does not exist', async () => {
      const d = build();
      d.conversationsRepo.findConversationById.mockResolvedValue(null);
      await expect(d.service.sendMessage('missing', { senderProfileId: 'p1' } as any, actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('rejects a sender that is not an active participant', async () => {
      const d = build();
      d.conversationsRepo.findConversationById.mockResolvedValue({ id: 'conv1', messageCount: 0, updatedAt: new Date() });
      d.conversationsRepo.findActiveParticipant.mockResolvedValue(null);
      await expect(
        d.service.sendMessage('conv1', { senderProfileId: 'p1' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects when a block exists between participants', async () => {
      const d = build();
      d.conversationsRepo.findConversationById.mockResolvedValue({ id: 'conv1', messageCount: 0, updatedAt: new Date() });
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({ id: 'part1' });
      d.conversationsRepo.findParticipants.mockResolvedValue([
        { participantProfileId: 'p1' },
        { participantProfileId: 'p2' },
      ]);
      d.blocksRepo.existsBetween.mockResolvedValue({ id: 'blk1' });
      await expect(
        d.service.sendMessage('conv1', { senderProfileId: 'p1', bodyText: 'hi' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('sends the message and bumps the conversation counters', async () => {
      const d = build();
      const conversation = { id: 'conv1', messageCount: 4, updatedAt: new Date() };
      d.conversationsRepo.findConversationById.mockResolvedValue(conversation);
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({ id: 'part1' });
      d.conversationsRepo.findParticipants.mockResolvedValue([
        { participantProfileId: 'p1' },
        { participantProfileId: 'p2' },
      ]);
      d.conversationsRepo.createMessage.mockReturnValue({ id: 'msg1' });
      const res = await d.service.sendMessage('conv1', { senderProfileId: 'p1', bodyText: 'hi' } as any, actor);
      expect(res.id).toBe('msg1');
      expect(conversation.messageCount).toBe(5);
      expect(d.conversationsRepo.createReceipt).toHaveBeenCalled();
    });
  });

  describe('markRead (UC-19-07)', () => {
    it('records a read receipt for the last message', async () => {
      const d = build();
      d.conversationsRepo.findConversationById.mockResolvedValue({ id: 'conv1' });
      const participant = { id: 'part1', lastReadMessageId: undefined as string | undefined, updatedAt: new Date() };
      d.conversationsRepo.findActiveParticipant.mockResolvedValue(participant);
      d.conversationsRepo.findLastMessage.mockResolvedValue({ id: 'msg9' });
      const res = await d.service.markRead('conv1', { recipientProfileId: 'p1' } as any, actor);
      expect(res).toEqual({ receiptsRecorded: 1, lastReadMessageId: 'msg9' });
      expect(participant.lastReadMessageId).toBe('msg9');
    });
  });
});
