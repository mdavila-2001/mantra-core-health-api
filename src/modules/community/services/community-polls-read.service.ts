import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ResourceNotFoundException } from '../../../common';
import { PollsRepository, PostsRepository } from '../repositories';
import { CommunityVisibilityService } from './community-visibility.service';
import type { PollDetailDto } from '../dto';

/**
 * Cara de lectura de las encuestas (UC-19-17).
 *
 * Una encuesta cuelga de una publicación, así que hereda su visibilidad: si el
 * post no es legible para quien pregunta, la encuesta tampoco.
 */
@Injectable()
export class CommunityPollsReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param pollsRepo - Acceso a encuestas, opciones y votos.
   * @param postsRepo - Acceso a la publicación que la contiene.
   * @param visibility - Reglas transversales de visibilidad.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly pollsRepo: PollsRepository,
    private readonly postsRepo: PostsRepository,
    private readonly visibility: CommunityVisibilityService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityPollsReadService.name);
  }

  /**
   * Encuesta con sus opciones, recuentos y el voto del actor.
   *
   * @param pollId - Encuesta a leer.
   * @param actorProfileId - Perfil del lector, para marcar lo que votó.
   * @returns Detalle de la encuesta.
   * @throws ResourceNotFoundException si no existe o su publicación no es visible.
   */
  async getPoll(
    pollId: string,
    actorProfileId?: string,
  ): Promise<PollDetailDto> {
    const em = this.em.fork();
    const poll = await this.pollsRepo.findPollById(em, pollId);
    if (!poll)
      throw new ResourceNotFoundException('Encuesta no encontrada', { pollId });

    const post = await this.postsRepo.findById(em, poll.postId);
    if (
      !post ||
      !(await this.visibility.canViewPost(em, post, actorProfileId))
    )
      throw new ResourceNotFoundException('Encuesta no encontrada', { pollId });

    const [options, tallies, votedOptionIds] = await Promise.all([
      this.pollsRepo.listOptions(em, pollId),
      this.pollsRepo.countVotesByOption(em, pollId),
      actorProfileId
        ? this.pollsRepo.listVotedOptionIds(em, pollId, actorProfileId)
        : Promise.resolve(undefined),
    ]);

    const countByOption = new Map(
      tallies.map((tally) => [tally.pollOptionId, tally.count]),
    );

    return {
      id: poll.id,
      postId: poll.postId,
      question: poll.question,
      allowsMultiple: poll.allowsMultiple,
      closesAt: poll.closesAt ?? null,
      statusConceptId: poll.statusConceptId,
      options: options.map((option) => ({
        id: option.id,
        label: option.label,
        ordinal: option.ordinal ?? null,
        voteCount: countByOption.get(option.id) ?? 0,
      })),
      totalVotes: tallies.reduce((sum, tally) => sum + tally.count, 0),
      ...(votedOptionIds ? { actorVotedOptionIds: votedOptionIds } : {}),
    };
  }
}
