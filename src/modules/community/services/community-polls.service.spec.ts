import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityPollsService } from './community-polls.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { COMM } from '../community.concepts';

const actor = { id: 'u1', roles: [] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const pollsRepo = {
    createPoll: mockFn(),
    createOption: mockFn(),
    findPollById: mockFn(),
    findOptionById: mockFn(),
    findVote: mockFn(),
    countVotesByVoter: mockFn().mockResolvedValue(0),
    createVote: mockFn(),
  };
  const postsRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityPollsService(
    em as any,
    pollsRepo,
    postsRepo as any,
    logger as any,
  );
  return { service, tx, pollsRepo, postsRepo };
}

describe('CommunityPollsService', () => {
  describe('createPoll (bootstrap)', () => {
    it('throws when the post does not exist', async () => {
      const d = build();
      d.postsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.createPoll(
          'missing',
          { question: 'q', options: ['a', 'b'] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('creates the poll with its options', async () => {
      const d = build();
      d.postsRepo.findById.mockResolvedValue({ id: 'post1' });
      d.pollsRepo.createPoll.mockReturnValue({ id: 'poll1' });
      d.pollsRepo.createOption
        .mockReturnValueOnce({ id: 'o1' })
        .mockReturnValueOnce({ id: 'o2' });
      const res = await d.service.createPoll(
        'post1',
        { question: 'q', options: ['a', 'b'] },
        actor,
      );
      expect(res).toEqual({ id: 'poll1', optionIds: ['o1', 'o2'] });
    });
  });

  describe('vote (UC-19-12)', () => {
    it('throws when the poll does not exist', async () => {
      const d = build();
      d.pollsRepo.findPollById.mockResolvedValue(null);
      await expect(
        d.service.vote(
          'missing',
          { pollOptionId: 'o1', voterProfileId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects voting on a closed poll', async () => {
      const d = build();
      d.pollsRepo.findPollById.mockResolvedValue({
        id: 'poll1',
        statusConceptId: COMM.POLL_CLOSED,
      });
      await expect(
        d.service.vote(
          'poll1',
          { pollOptionId: 'o1', voterProfileId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a second vote in a single-choice poll', async () => {
      const d = build();
      d.pollsRepo.findPollById.mockResolvedValue({
        id: 'poll1',
        statusConceptId: COMM.POLL_OPEN,
        allowsMultiple: false,
      });
      d.pollsRepo.findOptionById.mockResolvedValue({
        id: 'o1',
        pollId: 'poll1',
      });
      d.pollsRepo.findVote.mockResolvedValue(null);
      d.pollsRepo.countVotesByVoter.mockResolvedValue(1);
      await expect(
        d.service.vote(
          'poll1',
          { pollOptionId: 'o1', voterProfileId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('records the vote and bumps counters', async () => {
      const d = build();
      const poll = {
        id: 'poll1',
        statusConceptId: COMM.POLL_OPEN,
        allowsMultiple: true,
        totalVotes: '2',
        updatedAt: new Date(),
      };
      const option = {
        id: 'o1',
        pollId: 'poll1',
        voteCount: '1',
        updatedAt: new Date(),
      };
      d.pollsRepo.findPollById.mockResolvedValue(poll);
      d.pollsRepo.findOptionById.mockResolvedValue(option);
      d.pollsRepo.findVote.mockResolvedValue(null);
      d.pollsRepo.createVote.mockReturnValue({ id: 'v1' });
      const res = await d.service.vote(
        'poll1',
        { pollOptionId: 'o1', voterProfileId: 'p1' },
        actor,
      );
      expect(res).toEqual({ id: 'v1' });
      expect(option.voteCount).toBe('2');
      expect(poll.totalVotes).toBe('3');
    });
  });
});
