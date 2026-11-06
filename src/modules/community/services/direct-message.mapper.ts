import type { DirectMessageDto } from '../dto';
import type { DirectMessages } from '../entities';
import { messageContentTypeOf } from '../message-content-type';

/**
 * A direct message as it travels to the client. A deleted one keeps its place
 * but loses body and attachment: the thread draws «Se eliminó este mensaje»
 * and quotes that pointed to it still know what they pointed to.
 */
export function toDirectMessageDto(message: DirectMessages): DirectMessageDto {
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
  };
}
