import type { DirectMessageDto, MessageReactionDto } from '../dto';
import type { DirectMessages, MessageReactions } from '../entities';
import { messageContentTypeOf } from '../message-content-type';

/**
 * A direct message as it travels to the client. A deleted one keeps its place
 * but loses body and attachment: the thread draws «Se eliminó este mensaje»
 * and quotes that pointed to it still know what they pointed to.
 */
export function toDirectMessageDto(
  message: DirectMessages,
  reactions?: MessageReactionDto[],
): DirectMessageDto {
  const deleted = message.deletedAt !== undefined && message.deletedAt !== null;
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderProfileId: message.senderProfileId,
    replyToMessageId: message.replyToMessageId ?? null,
    contentTypeConceptId: message.contentTypeConceptId,
    contentType: messageContentTypeOf(message.contentTypeConceptId),
    bodyText: deleted ? null : (message.bodyText ?? null),
    attachmentFileId: deleted ? null : (message.attachmentFileId ?? null),
    isEdited: message.isEdited ?? null,
    deletedAt: message.deletedAt ?? null,
    sentAt: message.sentAt ?? null,
    ...(reactions ? { reactions } : {}),
  };
}

/** Groups reaction rows (oldest first) by message and then by emoji. */
export function groupReactions(
  rows: readonly MessageReactions[],
): Map<string, MessageReactionDto[]> {
  const byMessage = new Map<string, MessageReactionDto[]>();
  for (const row of rows) {
    const list = byMessage.get(row.directMessageId) ?? [];
    const same = list.find((r) => r.emoji === row.emoji);
    if (same) same.profileIds.push(row.profileId);
    else list.push({ emoji: row.emoji, profileIds: [row.profileId] });
    byMessage.set(row.directMessageId, list);
  }
  return byMessage;
}
