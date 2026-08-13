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

  /** Opciones de una encuesta, en orden de presentación. */
  listOptions(em: EntityManager, pollId: string): Promise<PollOptions[]> {
    return em.find(
      PollOptions,
      { pollId },
      { orderBy: { ordinal: 'ASC', id: 'ASC' } },
    );
  }

  /**
   * Votos emitidos por un perfil en una encuesta.
   *
   * Devuelve las opciones y no un booleano porque una encuesta de opción
   * múltiple necesita marcar cada casilla que la persona eligió, no sólo saber
   * que votó.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pollId - Encuesta consultada.
   * @param voterProfileId - Perfil votante.
   * @returns Ids de las opciones que ese perfil votó.
   */
  async listVotedOptionIds(
    em: EntityManager,
    pollId: string,
    voterProfileId: string,
  ): Promise<string[]> {
    const votes = await em.find(PollVotes, { pollId, voterProfileId });
    return votes.map((vote) => vote.pollOptionId);
  }

  /**
   * Recuento real de votos por opción.
   *
   * `poll_options.vote_count` es un contador denormalizado; esta consulta es la
   * verdad contra la que se lo compara.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pollId - Encuesta a contar.
   * @returns Pares opción → cantidad de votos.
   */
  async countVotesByOption(
    em: EntityManager,
    pollId: string,
  ): Promise<{ pollOptionId: string; count: number }[]> {
    const rows = await em
      .getConnection()
      .execute<Array<{ poll_option_id: string; count: number }>>(
        `select poll_option_id, count(*)::int as count
           from community.poll_votes
          where poll_id=?
          group by poll_option_id`,
        [pollId],
        'all',
      );

    return rows.map((row) => ({
      pollOptionId: row.poll_option_id,
      count: row.count,
    }));
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
