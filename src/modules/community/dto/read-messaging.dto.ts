import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Último mensaje de una conversación, para la vista previa de la bandeja. */
export class ConversationPreviewMessageDto {
  /** Identificador del mensaje. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Perfil que lo envió. */
  @ApiProperty({ format: 'uuid' })
  senderProfileId!: string;

  /** Cuerpo del mensaje. */
  @ApiPropertyOptional()
  bodyText?: string | null;

  /** Cuándo se envió. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  sentAt?: Date | null;
}

/** Una conversación de la bandeja del actor. */
export class ConversationListItemDto {
  /** Identificador de la conversación. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Concept id del tipo de conversación (directa, grupal). */
  @ApiProperty({ format: 'uuid' })
  conversationTypeConceptId!: string;

  /** Grupo al que pertenece, si es de grupo. */
  @ApiPropertyOptional({ format: 'uuid' })
  groupId?: string | null;

  /** Cuándo se envió el último mensaje. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  lastMessageAt?: Date | null;

  /** Cuántos mensajes acumula. */
  @ApiPropertyOptional()
  messageCount?: number | null;

  /** Vista previa del último mensaje. */
  @ApiPropertyOptional({ type: ConversationPreviewMessageDto, nullable: true })
  lastMessage?: ConversationPreviewMessageDto | null;

  /** Cuántos mensajes le quedan sin leer al actor. */
  @ApiProperty()
  unreadCount!: number;
}

/** Bandeja de conversaciones (UC-19-14, cara de lectura). */
export class ConversationPageDto {
  /** Conversaciones de la página. */
  @ApiProperty({ type: [ConversationListItemDto] })
  items!: ConversationListItemDto[];

  /** Cuántas trae esta página. */
  @ApiProperty()
  count!: number;

  /** Tope pedido. */
  @ApiProperty()
  limit!: number;

  /**
   * Siempre `null`: la bandeja devuelve las conversaciones activas del actor de
   * una vez, acotadas por el tope. Se mantiene el campo para que la forma de la
   * respuesta sea la misma que la de los demás listados.
   */
  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;
}

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

  /** Cuerpo del mensaje. */
  @ApiPropertyOptional()
  bodyText?: string | null;

  /** Adjunto en `common.files`. */
  @ApiPropertyOptional({ format: 'uuid' })
  attachmentFileId?: string | null;

  /** Si fue editado. */
  @ApiPropertyOptional()
  isEdited?: boolean | null;

  /** Cuándo se envió. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  sentAt?: Date | null;
}

/** Página de mensajes de una conversación. */
export class DirectMessagePageDto {
  /** Mensajes de la página, del más reciente al más antiguo. */
  @ApiProperty({ type: [DirectMessageDto] })
  items!: DirectMessageDto[];

  /** Cuántos trae esta página. */
  @ApiProperty()
  count!: number;

  /** Tope pedido. */
  @ApiProperty()
  limit!: number;

  /** Cursor de la página siguiente, o `null`. */
  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;
}
