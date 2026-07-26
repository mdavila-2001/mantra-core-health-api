import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Polls, PollOptions, PollVotes } from '../entities';
import { createdBy } from '../../../common';

export interface CreatePollData {
  postId: string;
  question: string;
  allowsMultiple: boolean;
  closesAt?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de encuestas: polls, opciones y votos. */
@Injectable()
export class PollsRepository {
  findPollById(em: EntityManager, id: string): Promise<Polls | null> {
    return em.findOne(Polls, { id });
  }

  createPoll(em: EntityManager, data: CreatePollData): Polls {
    return em.create(
      Polls,
      {
        postId: data.postId,
        question: data.question,
        allowsMultiple: data.allowsMultiple,
        closesAt: data.closesAt,
        totalVotes: '0',
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createOption(
    em: EntityManager,
    pollId: string,
    label: string,
    ordinal: number,
    actorUserId?: string,
  ): PollOptions {
    return em.create(
      PollOptions,
      {
        pollId,
        label,
        ordinal,
        voteCount: '0',
        ...createdBy(actorUserId),
      },
      { partial: true },
    );
  }

  findOptionById(em: EntityManager, id: string): Promise<PollOptions | null> {
    return em.findOne(PollOptions, { id });
  }

  findVote(
    em: EntityManager,
    pollId: string,
    pollOptionId: string,
    voterProfileId: string,
  ): Promise<PollVotes | null> {
    return em.findOne(PollVotes, { pollId, pollOptionId, voterProfileId });
  }

  countVotesByVoter(em: EntityManager, pollId: string, voterProfileId: string): Promise<number> {
    return em.count(PollVotes, { pollId, voterProfileId });
  }

  createVote(
    em: EntityManager,
    data: { pollId: string; pollOptionId: string; voterProfileId: string; actorUserId?: string },
  ): PollVotes {
    return em.create(
      PollVotes,
      {
        pollId: data.pollId,
        pollOptionId: data.pollOptionId,
        voterProfileId: data.voterProfileId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
