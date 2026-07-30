import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { PollsRepository, PostsRepository } from '../repositories';
import { COMM } from '../community.concepts';
import {
  CreatePollDto,
  CreateVoteDto,
  PollResponseDto,
  VoteResponseDto,
} from '../dto';

/**
 * Encuestas: creación sobre un post (bootstrap) y voto (UC-19-12). Valida poll
 * abierta, opción perteneciente al poll y regla de opción única cuando el poll no
 * admite selección múltiple.
 */
@Injectable()
export class CommunityPollsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pollsRepo - Valor de polls repo requerido por la operación.
   * @param postsRepo - Valor de posts repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly pollsRepo: PollsRepository,
    private readonly postsRepo: PostsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityPollsService.name);
  }

  /** Bootstrap: crea una encuesta con sus opciones sobre un post existente. */
  async createPoll(
    postId: string,
    dto: CreatePollDto,
    actor: AuthenticatedUser,
  ): Promise<PollResponseDto> {
    return this.em.transactional(async (tx) => {
      const post = await this.postsRepo.findById(tx, postId);
      if (!post)
        throw new ResourceNotFoundException('Post no encontrado', { postId });

      const poll = this.pollsRepo.createPoll(tx, {
        postId,
        question: dto.question,
        allowsMultiple: dto.allowsMultiple ?? false,
        closesAt: dto.closesAt,
        statusConceptId: COMM.POLL_OPEN,
        actorUserId: actor.id,
      });
      await tx.flush();

      const optionIds: string[] = [];
      for (const [i, label] of dto.options.entries()) {
        const option = this.pollsRepo.createOption(
          tx,
          poll.id,
          label,
          i,
          actor.id,
        );
        await tx.flush();
        optionIds.push(option.id);
      }

      return { id: poll.id, optionIds };
    });
  }

  /** UC-19-12: registra un voto en una encuesta. */
  async vote(
    pollId: string,
    dto: CreateVoteDto,
    actor: AuthenticatedUser,
  ): Promise<VoteResponseDto> {
    this.logger.info(
      { operation: 'community.poll.vote', pollId },
      'Casting poll vote',
    );
    return this.em.transactional(async (tx) => {
      const poll = await this.pollsRepo.findPollById(tx, pollId);
      if (!poll)
        throw new ResourceNotFoundException('Encuesta no encontrada', {
          pollId,
        });
      if (
        poll.statusConceptId !== COMM.POLL_OPEN ||
        (poll.closesAt && poll.closesAt.getTime() <= Date.now())
      ) {
        throw new PreconditionFailedException('La encuesta está cerrada', {
          pollId,
        });
      }

      const option = await this.pollsRepo.findOptionById(tx, dto.pollOptionId);
      if (!option || option.pollId !== pollId) {
        throw new ResourceNotFoundException(
          'La opción no pertenece a la encuesta',
          { pollOptionId: dto.pollOptionId },
        );
      }

      const dupOption = await this.pollsRepo.findVote(
        tx,
        pollId,
        dto.pollOptionId,
        dto.voterProfileId,
      );
      if (dupOption)
        throw new ConflictException('Ya votó por esta opción', {
          pollOptionId: dto.pollOptionId,
        });

      if (!poll.allowsMultiple) {
        const already = await this.pollsRepo.countVotesByVoter(
          tx,
          pollId,
          dto.voterProfileId,
        );
        if (already > 0) {
          throw new ConflictException(
            'La encuesta admite un único voto por votante',
            { pollId },
          );
        }
      }

      const vote = this.pollsRepo.createVote(tx, {
        pollId,
        pollOptionId: dto.pollOptionId,
        voterProfileId: dto.voterProfileId,
        actorUserId: actor.id,
      });

      option.voteCount = String(
        (option.voteCount ? BigInt(option.voteCount) : 0n) + 1n,
      );
      poll.totalVotes = String(
        (poll.totalVotes ? BigInt(poll.totalVotes) : 0n) + 1n,
      );
      touch(option, actor.id);
      touch(poll, actor.id);
      await tx.flush();

      return { id: vote.id };
    });
  }
}
