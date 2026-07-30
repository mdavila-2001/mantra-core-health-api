import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
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
