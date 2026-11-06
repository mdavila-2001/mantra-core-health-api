import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MESSAGE_CONTENT_TYPES,
  type MessageContentType,
} from '../message-content-type';
import { MessageReactionDto } from './message-reaction.dto';

/** Un mensaje directo. */
export class DirectMessageDto {
  /** Identificador del mensaje. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Conversación a la que pertenece. */
  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  /** Perfil que lo envió. */
  @ApiProperty({ format: 'uuid' })
  senderProfileId!: string;

  /** Mensaje al que responde, si responde a alguno. */
  @ApiPropertyOptional({ format: 'uuid' })
  replyToMessageId?: string | null;

  /** Concept id del tipo de contenido. */
  @ApiProperty({ format: 'uuid' })
  contentTypeConceptId!: string;

  /**
   * Tipo de contenido legible: `STICKER` lo dibuja el cliente sin burbuja.
   * Ausente si el concepto no es uno de los tipos de mensaje conocidos.
   */
  @ApiPropertyOptional({ enum: MESSAGE_CONTENT_TYPES })
  contentType?: MessageContentType;

  /** Cuerpo del mensaje. */
  @ApiPropertyOptional()
  bodyText?: string | null;

  /** Adjunto en `common.files`. */
  @ApiPropertyOptional({ format: 'uuid' })
  attachmentFileId?: string | null;

  /** Si fue editado (F4.5). */
  @ApiPropertyOptional()
  isEdited?: boolean | null;

  /**
   * Cuándo se eliminó (F4.5). Un mensaje eliminado **sigue viajando** —con
   * `bodyText` y `attachmentFileId` en `null`— para que el hilo muestre «Se
   * eliminó este mensaje» en su lugar y no un hueco que descoloca las citas.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  deletedAt?: Date | null;

  /** Cuándo se envió. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  sentAt?: Date | null;

  /** Reacciones con emoji, agrupadas por emoji (v4.2.91). */
  @ApiPropertyOptional({ type: () => MessageReactionDto, isArray: true })
  reactions?: MessageReactionDto[];
}
