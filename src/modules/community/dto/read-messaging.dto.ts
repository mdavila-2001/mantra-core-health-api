import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Último mensaje de una conversación, para la vista previa de la bandeja. */
export class ConversationPreviewMessageDto {
  /** Identificador del mensaje. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Perfil que lo envió. */
  @ApiProperty({ format: 'uuid' })
  senderProfileId!: string;

  /** Cuerpo del mensaje; `null` si era sólo un adjunto o si se eliminó. */
  @ApiPropertyOptional()
  bodyText?: string | null;

  /**
   * Concept id del tipo de contenido (texto o media). F4.3: con esto la fila
   * de la bandeja dice «Foto» o «Documento» sin adivinarlo por el cuerpo vacío.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  contentTypeConceptId?: string | null;

  /** Adjunto en `common.files`, si el último mensaje era uno. */
  @ApiPropertyOptional({ format: 'uuid' })
  attachmentFileId?: string | null;

  /** Cuándo se eliminó, si el último mensaje está eliminado (F4.5). */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  deletedAt?: Date | null;

  /** Cuándo se envió. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  sentAt?: Date | null;
}

/** Si alguien está en línea, y si no, cuándo se lo vio por última vez (F4.2). */
export class ProfilePresenceDto {
  /** Perfil público. */
  @ApiProperty({ format: 'uuid' })
  profileId!: string;

  /** `true` si tiene la mensajería abierta ahora mismo. */
  @ApiProperty()
  online!: boolean;

  /**
   * Última vez que se lo vio conectado; `null` si nunca, o si la presencia
   * no está disponible (Redis caído: se responde «no se sabe», no un 500).
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastSeenAt!: Date | null;
}

/** Presencia de los demás participantes de una conversación. */
export class ConversationPresenceDto {
  /** Conversación consultada. */
  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  /** Los otros participantes, sin el propio. */
  @ApiProperty({ type: [ProfilePresenceDto] })
  peers!: ProfilePresenceDto[];
}

/** Lo que devuelve `PATCH …/participant`: cómo quedó la conversación de este lado. */
export class ParticipantPreferencesDto {
  /** Conversación. */
  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  /** Favorita para este participante. */
  @ApiProperty()
  isFavorite!: boolean;

  /** Fijada arriba de la bandeja de este participante. */
  @ApiProperty()
  isPinned!: boolean;

  /** Desde cuándo está archivada; `null` si no lo está. */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  archivedAt!: Date | null;
}

/** Lo que devuelve fijar o soltar un mensaje. */
export class PinnedMessageResponseDto {
  /** Conversación. */
  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  /** El mensaje fijado, o `null` si se soltó. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  pinnedMessageId!: string | null;
}

/**
 * El otro lado de una conversación.
 *
 * Carril P2. La bandeja devolvía la conversación sin decir **con quién** es:
 * una lista de «Conversación · hace 2 h» no es una bandeja, es un registro de
 * actividad. El nombre no puede resolverlo el cliente sin una llamada por
 * fila, así que viaja con la lectura.
 */
export class ConversationPeerDto {
  /** Perfil público del participante. */
  @ApiProperty({ format: 'uuid' })
  profileId!: string;

  /** Cómo se llama, para poder pintar la fila. */
  @ApiPropertyOptional()
  displayName?: string | null;

  /** Su avatar público, o `null` si no subió ninguno. Misma regla que la ficha pública. */
  @ApiPropertyOptional({ nullable: true })
  avatarUrl?: string | null;
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

  /**
   * Si el otro lado ya leyó el último mensaje, cuando ese mensaje es del
   * actor y la conversación es directa. `null` si no se sabe (grupo, o el
   * último no es propio). Con esto la bandeja pinta el doble tilde sin mentir (F4.3).
   */
  @ApiPropertyOptional({ nullable: true })
  lastMessageReadByPeer?: boolean | null;

  /** Favorita para el actor (F4.4). */
  @ApiProperty()
  isFavorite!: boolean;

  /** Fijada arriba de la bandeja del actor (F4.4). Las fijadas van primero. */
  @ApiProperty()
  isPinned!: boolean;

  /** Desde cuándo la archivó el actor; `null` si no está archivada (F4.4). */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  archivedAt?: Date | null;

  /** El mensaje fijado en la barra superior, si hay uno (F4.6). */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  pinnedMessageId?: string | null;

  /**
   * Los demás participantes, sin el propio.
   *
   * Sin el propio porque la bandeja se lee desde un lado: incluirse a uno
   * mismo obligaría a cada pantalla a filtrarse, y la que se olvide muestra
   * «Conversación con vos».
   */
  @ApiProperty({ type: [ConversationPeerDto] })
  peers!: ConversationPeerDto[];
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
   * Cursor de la página siguiente, o `null` si no hay más (F4.3).
   *
   * Se pagina sobre el orden de la bandeja —fijadas primero, después por
   * último mensaje— y dentro del mismo recorte que aplique `q`.
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

  /**
   * Hasta qué `sentAt` leyó el otro lado, en una conversación DIRECT.
   *
   * `null` si es de grupo (no hay "el otro lado") o si el peer no marcó nada
   * todavía como leído. Con esto el frente pinta ✓✓ en los mensajes propios
   * cuyo `sentAt` sea anterior o igual a esta marca.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  peerReadUpTo?: Date | null;

  /**
   * El mensaje fijado en la conversación, completo, o `null` (F4.6). Viaja
   * con la primera página para que la barra superior se pinte sin otra
   * llamada, aunque el mensaje sea de hace meses y no esté en la página.
   */
  @ApiPropertyOptional({ type: DirectMessageDto, nullable: true })
  pinnedMessage?: DirectMessageDto | null;
}

/** Lo que devuelve eliminar un mensaje (F4.5). */
export class DeletedMessageResponseDto {
  /** Conversación. */
  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  /** El mensaje eliminado. */
  @ApiProperty({ format: 'uuid' })
  messageId!: string;

  /** Cuándo. */
  @ApiProperty({ type: String, format: 'date-time' })
  deletedAt!: Date;
}
