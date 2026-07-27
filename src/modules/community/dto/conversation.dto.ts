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
  @ApiProperty({ description: 'Perfiles participantes', type: [String] })
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('4', { each: true })
  participantProfileIds!: string[];

  @ApiPropertyOptional({
    description: 'Tipo de conversación',
    enum: ['DIRECT', 'GROUP'],
  })
  @IsOptional()
  @IsIn(['DIRECT', 'GROUP'])
  conversationType?: 'DIRECT' | 'GROUP';

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
  @ApiProperty({
    description: 'Perfil remitente (participante activo)',
    format: 'uuid',
  })
  @IsUUID()
  senderProfileId!: string;

  @ApiPropertyOptional({ description: 'Texto del mensaje', maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  bodyText?: string;

  @ApiPropertyOptional({
    description: 'Tipo de contenido',
    enum: ['TEXT', 'MEDIA'],
  })
  @IsOptional()
  @IsIn(['TEXT', 'MEDIA'])
  contentType?: 'TEXT' | 'MEDIA';

  @ApiPropertyOptional({
    description: 'Mensaje al que responde',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  replyToMessageId?: string;

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
  @ApiProperty({ description: 'Perfil que marca como leído', format: 'uuid' })
  @IsUUID()
  recipientProfileId!: string;

  @ApiPropertyOptional({
    description: 'Último mensaje leído (por defecto el más reciente)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  upToMessageId?: string;
}
