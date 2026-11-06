import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { CommunityErrorReason } from '../community.error-reasons';
import type { DirectMessageDto, ReactToMessageDto } from '../dto';
import { MessageReactions } from '../entities';
import { CommunityMessagingGateway } from '../gateways/community-messaging.gateway';
import { BlocksRepository, ConversationsRepository } from '../repositories';
import { CommunityVisibilityService } from './community-visibility.service';
import { groupReactions, toDirectMessageDto } from './direct-message.mapper';

/**
 * Reactions to direct messages (patch v4.2.91).
 *
 * Until 2026-11-06 the web client called
 * `PUT /community/conversations/:id/messages/:messageId/reaction` but only the
 * mock answered it: reacting always failed against the real API. One reaction
 * per profile and message, like WhatsApp: another emoji replaces it and `null`
 * removes it. The unique index enforces that in the database too.
 */
@Injectable()
export class CommunityMessageReactionsService {
  constructor(
    private readonly em: EntityManager,
    private readonly conversationsRepo: ConversationsRepository,
    private readonly blocksRepo: BlocksRepository,
    private readonly visibility: CommunityVisibilityService,
    private readonly gateway: CommunityMessagingGateway,
  ) {}

  /**
   * Sets, replaces or removes the profile's reaction.
   *
   * @returns The message with its reactions up to date.
   * @throws ResourceNotFoundException when the profile does not take part in
   *   the conversation or the message is not there (404, as the reads).
   * @throws PreconditionFailedException when a block stands between participants.
   */
  async react(
    conversationId: string,
    messageId: string,
    dto: ReactToMessageDto,
    actor: AuthenticatedUser,
  ): Promise<DirectMessageDto> {
    const { result, recipients } = await this.em.transactional(async (tx) => {
      await this.visibility.assertActsAsMessagingProfile(
        tx,
        dto.profileId,
        actor,
      );
      const participant = await this.conversationsRepo.findActiveParticipant(
        tx,
        conversationId,
        dto.profileId,
        CONCEPTS.STATE_ACTIVE,
      );
      if (!participant)
        throw new ResourceNotFoundException(
          'Conversación no encontrada',
          { conversationId },
          CommunityErrorReason.CONVERSATION_NOT_FOUND,
        );
      const message = await this.conversationsRepo.findMessageInConversation(
        tx,
        conversationId,
        messageId,
      );
      if (!message || message.deletedAt)
        throw new ResourceNotFoundException('Mensaje no encontrado', {
          conversationId,
          messageId,
        });
      const others = (
        await this.conversationsRepo.findParticipants(tx, conversationId)
      )
        .map((p) => p.participantProfileId)
        .filter((id) => id !== dto.profileId);
      for (const other of others) {
        if (
          await this.blocksRepo.existsBetween(
            tx,
            dto.profileId,
            other,
            CONCEPTS.STATE_ACTIVE,
          )
        )
          throw new PreconditionFailedException(
            'Existe un bloqueo entre los participantes',
            { conversationId },
            CommunityErrorReason.BLOCKED_BETWEEN_PARTICIPANTS,
          );
      }

      if (dto.emoji === null) {
        await tx.nativeDelete(MessageReactions, {
          directMessageId: messageId,
          profileId: dto.profileId,
        });
      } else {
        // ON CONFLICT: two taps at once from the same profile must not be a 500.
        await tx.execute(
          `insert into community.message_reactions
             (id, direct_message_id, profile_id, emoji, created_at, updated_at, created_by_user_id)
           values (gen_random_uuid(), ?, ?, ?, now(), now(), ?)
           on conflict (direct_message_id, profile_id)
           do update set emoji = excluded.emoji, updated_at = now()`,
          [messageId, dto.profileId, dto.emoji, actor.id],
        );
      }
      const rows = await tx.find(
        MessageReactions,
        { directMessageId: messageId },
        { orderBy: { createdAt: 'asc', id: 'asc' } },
      );
      const reactions = groupReactions(rows).get(messageId) ?? [];
      return {
        result: toDirectMessageDto(message, reactions),
        recipients: others,
      };
    });

    // After the commit, like edits: the others see it live.
    this.gateway.emitMessageUpdated(result, recipients);
    return result;
  }

  /**
   * Adds the reactions to a page of messages with a single query.
   *
   * @param em - Persistence context of the read.
   * @param items - Messages already mapped.
   */
  async attach(
    em: EntityManager,
    items: DirectMessageDto[],
  ): Promise<DirectMessageDto[]> {
    if (items.length === 0) return items;
    const rows = await em.find(
      MessageReactions,
      { directMessageId: { $in: items.map((i) => i.id) } },
      { orderBy: { createdAt: 'asc', id: 'asc' } },
    );
    const grouped = groupReactions(rows);
    // A deleted message travels blank: who reacted with what goes too.
    return items.map((i) => ({
      ...i,
      reactions: i.deletedAt ? [] : (grouped.get(i.id) ?? []),
    }));
  }
}
