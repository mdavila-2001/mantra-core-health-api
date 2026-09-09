import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /community/conversations`. Endpoint de bootstrap de mensajería:
 * crea una conversación con sus participantes (padre de UC-19-06/07).
 */
export class CreateConversationDto {
  /**
   * Valor de participant profile ids mantenido por la instancia.
   */
  @ApiProperty({ description: 'Perfiles participantes', type: [String] })
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('4', { each: true })
  participantProfileIds!: string[];

  /**
   * Valor de conversation type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo de conversación',
    enum: ['DIRECT', 'GROUP'],
  })
  @IsOptional()
  @IsIn(['DIRECT', 'GROUP'])
  conversationType?: 'DIRECT' | 'GROUP';

  /**
   * Identificador asociado a group.
   */
  @ApiPropertyOptional({
    description: 'Grupo asociado (conversaciones de grupo)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  groupId?: string;
}

/** Cuerpo de `POST /community/conversations/{conversationId}/messages` (UC-19-06). */
export class SendMessageDto {
  /**
   * Identificador asociado a sender profile.
   */
  @ApiProperty({
    description: 'Perfil remitente (participante activo)',
    format: 'uuid',
  })
  @IsUUID()
  senderProfileId!: string;

  /**
   * Valor de body text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Texto del mensaje', maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  bodyText?: string;

  /**
   * Valor de content type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo de contenido',
    enum: ['TEXT', 'MEDIA'],
  })
  @IsOptional()
  @IsIn(['TEXT', 'MEDIA'])
  contentType?: 'TEXT' | 'MEDIA';

  /**
   * Identificador asociado a reply to message.
   */
  @ApiPropertyOptional({
    description: 'Mensaje al que responde',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  replyToMessageId?: string;

  /**
   * Identificador asociado a attachment file.
   */
  @ApiPropertyOptional({
    description: 'Archivo adjunto (common.files)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  attachmentFileId?: string;
}

/** Cuerpo de `POST /community/conversations/{conversationId}/read` (UC-19-07). */
export class MarkReadDto {
  /**
   * Identificador asociado a recipient profile.
   */
  @ApiProperty({ description: 'Perfil que marca como leído', format: 'uuid' })
  @IsUUID()
  recipientProfileId!: string;

  /**
   * Identificador asociado a up to message.
   */
  @ApiPropertyOptional({
    description: 'Último mensaje leído (por defecto el más reciente)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  upToMessageId?: string;
}

/**
 * Cuerpo de `PATCH /community/conversations/{conversationId}/participant` (F4.4).
 *
 * Lo que un participante marca **de su lado**: favorita, fijada arriba de su
 * bandeja, archivada. Cada campo es opcional y sólo cambia lo que viene;
 * mandar un cuerpo vacío no toca nada. Archivar quita el favorito: son dos
 * formas opuestas de decir cuánto importa una conversación.
 */
export class UpdateParticipantDto {
  /** Perfil que marca (participante activo; tiene que ser del actor). */
  @ApiProperty({ description: 'Perfil que marca', format: 'uuid' })
  @IsUUID()
  profileId!: string;

  /** Marcar o desmarcar como favorita. */
  @ApiPropertyOptional({ description: 'Favorita' })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  /** Fijar o soltar arriba de la bandeja. */
  @ApiPropertyOptional({ description: 'Fijada arriba de la bandeja' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  /** Archivar (`true`) o desarchivar (`false`). */
  @ApiPropertyOptional({ description: 'Archivada' })
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

/** Cuerpo de `PATCH /community/conversations/{conversationId}/messages/{messageId}` (F4.5). */
export class EditMessageDto {
  /** Perfil autor del mensaje (sólo el autor edita). */
  @ApiProperty({ description: 'Perfil autor del mensaje', format: 'uuid' })
  @IsUUID()
  senderProfileId!: string;

  /** El texto nuevo. */
  @ApiProperty({ description: 'Texto nuevo del mensaje', maxLength: 4000 })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  bodyText!: string;
}

/** Cuerpo de `POST /community/conversations/{conversationId}/pin` (F4.6). */
export class PinMessageDto {
  /** Perfil que fija (participante activo; tiene que ser del actor). */
  @ApiProperty({ description: 'Perfil que fija', format: 'uuid' })
  @IsUUID()
  profileId!: string;

  /** El mensaje a fijar; tiene que ser de esta conversación y no estar borrado. */
  @ApiProperty({ description: 'Mensaje a fijar', format: 'uuid' })
  @IsUUID()
  messageId!: string;
}
