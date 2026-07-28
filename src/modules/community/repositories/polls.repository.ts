import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Polls, PollOptions, PollVotes } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create poll data.
 */
export interface CreatePollData {
  /**
   * Identificador asociado a post.
   */
  postId: string;
  /**
   * Valor de question mantenido por la instancia.
   */
  question: string;
  /**
   * Valor de allows multiple mantenido por la instancia.
   */
  allowsMultiple: boolean;
  /**
   * Valor de closes at mantenido por la instancia.
   */
  closesAt?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de encuestas: polls, opciones y votos. */
@Injectable()
export class PollsRepository {
  /**
   * Obtiene find poll by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find poll by id conforme al contrato `Promise<Polls | null>`.
   */
  findPollById(em: EntityManager, id: string): Promise<Polls | null> {
    return em.findOne(Polls, { id });
  }

  /**
   * Crea create poll.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create poll conforme al contrato `Polls`.
   */
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

  /**
   * Crea create option.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pollId - Identificador de poll.
   * @param label - Valor de label requerido por la operación.
   * @param ordinal - Valor de ordinal requerido por la operación.
   * @param actorUserId - Identificador de actor user.
   * @returns Resultado de create option conforme al contrato `PollOptions`.
   */
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

  /**
   * Obtiene find option by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find option by id conforme al contrato `Promise<PollOptions | null>`.
   */
  findOptionById(em: EntityManager, id: string): Promise<PollOptions | null> {
    return em.findOne(PollOptions, { id });
  }

  /**
   * Obtiene find vote.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pollId - Identificador de poll.
   * @param pollOptionId - Identificador de poll option.
   * @param voterProfileId - Identificador de voter profile.
   * @returns Resultado de find vote conforme al contrato `Promise<PollVotes | null>`.
   */
  findVote(
    em: EntityManager,
    pollId: string,
    pollOptionId: string,
    voterProfileId: string,
  ): Promise<PollVotes | null> {
    return em.findOne(PollVotes, { pollId, pollOptionId, voterProfileId });
  }

  /**
   * Ejecuta la operación count votes by voter.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pollId - Identificador de poll.
   * @param voterProfileId - Identificador de voter profile.
   * @returns Resultado de count votes by voter conforme al contrato `Promise<number>`.
   */
  countVotesByVoter(
    em: EntityManager,
    pollId: string,
    voterProfileId: string,
  ): Promise<number> {
    return em.count(PollVotes, { pollId, voterProfileId });
  }

  /**
   * Crea create vote.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create vote conforme al contrato `PollVotes`.
   */
  createVote(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a poll.
       */
      pollId: string;
      /**
       * Identificador asociado a poll option.
       */
      pollOptionId: string;
      /**
       * Identificador asociado a voter profile.
       */
      voterProfileId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
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
