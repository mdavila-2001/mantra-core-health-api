import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Sello de verificación vigente de un perfil (`community.verified_badges`).
 *
 * El sello se muestra sin ninguna evidencia adjunta: `evidence_ref` apunta a
 * documentación de respaldo que es del proceso de verificación, no del muro.
 */
export class VerifiedBadgeDto {
  /** Identificador del sello. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Concept id del tipo de sello. */
  @ApiProperty({ format: 'uuid' })
  badgeTypeConceptId!: string;

  /** Concept id del método con que se verificó. */
  @ApiProperty({ format: 'uuid' })
  verificationMethodConceptId!: string;

  /** Desde cuándo rige. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  validFrom?: Date | null;

  /** Hasta cuándo rige. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  validTo?: Date | null;
}

/** Saldo de prestigio de un perfil (`community.prestige_scores`). */
export class PrestigeScoreDto {
  /** Puntos acumulados. Viaja como texto: la columna es `numeric`. */
  @ApiProperty({ description: 'Puntos acumulados (numeric, viaja como texto)' })
  totalPoints!: string;

  /** Concept id del nivel alcanzado. */
  @ApiPropertyOptional({ format: 'uuid' })
  levelConceptId?: string | null;

  /** Posición en el ranking, si se calculó. */
  @ApiPropertyOptional()
  rankPosition?: number | null;

  /** Cuándo se recalculó por última vez. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  calculatedAt?: Date | null;
}

/** Ficha de un perfil público (UC-19-01, cara de lectura). */
export class PublicProfileDetailDto {
  /** Identificador del perfil. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Organización a la que pertenece. */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /** Concept id del tipo de sujeto (usuario, profesional, organización). */
  @ApiProperty({ format: 'uuid' })
  targetTypeConceptId!: string;

  /** Ruta pública del perfil. */
  @ApiProperty()
  slug!: string;

  /** Nombre visible. */
  @ApiProperty()
  displayName!: string;

  /** Titular o especialidad declarada. */
  @ApiPropertyOptional()
  headline?: string | null;

  /** Descripción larga. */
  @ApiPropertyOptional()
  biography?: string | null;

  /** Foto de perfil (`common.files`). */
  @ApiPropertyOptional({ format: 'uuid' })
  avatarFileId?: string | null;

  /** Imagen de portada (`common.files`). */
  @ApiPropertyOptional({ format: 'uuid' })
  coverFileId?: string | null;

  /** Concept id del estado de verificación. */
  @ApiPropertyOptional({ format: 'uuid' })
  verificationStatusConceptId?: string | null;

  /** Si acepta reseñas de servicio. */
  @ApiPropertyOptional()
  acceptsReviews?: boolean | null;

  /** Concept id del estado del perfil. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /** Sellos de verificación vigentes. */
  @ApiProperty({ type: [VerifiedBadgeDto] })
  badges!: VerifiedBadgeDto[];

  /** Prestigio acumulado, si el perfil tiene saldo calculado. */
  @ApiPropertyOptional({ type: PrestigeScoreDto })
  prestige?: PrestigeScoreDto | null;
}

/** Adjunto de una publicación. */
export class PostMediaDto {
  /** Identificador del adjunto. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Archivo en `common.files`. */
  @ApiProperty({ format: 'uuid' })
  fileId!: string;

  /** Concept id del rol del medio (imagen, video, documento). */
  @ApiProperty({ format: 'uuid' })
  mediaRoleConceptId!: string;

  /** Texto alternativo para lectores de pantalla. */
  @ApiPropertyOptional()
  altText?: string | null;

  /** Orden de despliegue. */
  @ApiPropertyOptional()
  ordinal?: number | null;
}

/** Etiqueta asociada a una publicación. */
export class PostHashtagDto {
  /** Identificador de la etiqueta. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Texto de la etiqueta, listo para mostrar. */
  @ApiProperty()
  tag!: string;
}

/** Mención a un perfil dentro del cuerpo de una publicación. */
export class PostMentionDto {
  /** Identificador de la mención. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Perfil mencionado. */
  @ApiProperty({ format: 'uuid' })
  mentionedProfileId!: string;

  /** Posición inicial dentro del texto. */
  @ApiPropertyOptional()
  offsetStart?: number | null;

  /** Posición final dentro del texto. */
  @ApiPropertyOptional()
  offsetEnd?: number | null;
}

/** Cuántas reacciones de cada tipo tiene un contenido. */
export class ReactionTallyDto {
  /** Concept id del tipo de reacción. */
  @ApiProperty({ format: 'uuid' })
  reactionTypeConceptId!: string;

  /**
   * El código del tipo (`LIKE`, `INSIGHTFUL`, …), el mismo con el que se escribe.
   *
   * Viaja junto al uuid porque el módulo **se escribe con la palabra y se leía
   * sólo con el uuid**, y una interfaz que recibe el uuid no puede marcar el
   * botón que le corresponde sin resolver terminología en cada render.
   *
   * Nulo sólo si la fila guarda un concepto que no está en el enum del módulo
   * —dato viejo o escrito por fuera—: en ese caso se dice que no se pudo
   * resolver, en lugar de inventar un código.
   */
  @ApiPropertyOptional({ nullable: true })
  reactionType?: string | null;

  /** Cantidad de reacciones de ese tipo. */
  @ApiProperty()
  count!: number;
}

/** Resumen de reacciones de un contenido (UC-19-03, cara de lectura). */
export class ReactionSummaryDto {
  /** Recuento por tipo. */
  @ApiProperty({ type: [ReactionTallyDto] })
  tallies!: ReactionTallyDto[];

  /** Total de reacciones. */
  @ApiProperty()
  total!: number;

  /**
   * Concept id de la reacción del propio actor, si preguntó por sí mismo.
   *
   * `null` distingue «no reaccionó» de `undefined` «no preguntó»: la interfaz
   * necesita saber si puede pintar el botón como activo o si directamente no
   * tiene esa información.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  actorReactionTypeConceptId?: string | null;

  /**
   * El código de la reacción del propio actor, resuelto del concepto.
   *
   * Es lo que la interfaz necesita para pintar activo el botón correcto tras
   * recargar. Sigue la misma distinción que el campo de arriba: ausente si no se
   * preguntó, `null` si no reaccionó.
   */
  @ApiPropertyOptional({ nullable: true })
  actorReactionType?: string | null;
}

/** Fila del muro: una publicación sin sus hijos. */
export class PostListItemDto {
  /** Identificador de la publicación. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Perfil autor. */
  @ApiProperty({ format: 'uuid' })
  authorPublicProfileId!: string;

  /** Concept id del tipo de publicación. */
  @ApiProperty({ format: 'uuid' })
  postTypeConceptId!: string;

  /** Cuerpo del texto. */
  @ApiProperty()
  bodyText!: string;

  /** Concept id de la visibilidad declarada; nulo se lee como pública. */
  @ApiPropertyOptional({ format: 'uuid' })
  visibilityConceptId?: string | null;

  /** Si admite comentarios. */
  @ApiPropertyOptional()
  commentsEnabled?: boolean | null;

  /** Cuándo se publicó. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  publishedAt?: Date | null;

  /** Si fue editada, cuándo. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  editedAt?: Date | null;

  /**
   * Reacciones de la publicación, con la del propio lector si tiene perfil.
   *
   * **Viaja con la fila y no en una lectura aparte** porque si no, la única
   * forma de saber cuántas reacciones tiene cada publicación era pedir
   * `GET /posts/{id}/reactions` una vez por tarjeta: cincuenta publicaciones,
   * cincuenta peticiones. Sin esto, el conteo de la interfaz sólo podía ser el
   * del gesto que el usuario acababa de hacer, y **al recargar volvía a cero**
   * aunque la reacción estuviera guardada.
   */
  @ApiProperty({ type: ReactionSummaryDto })
  reactions!: ReactionSummaryDto;

  /**
   * Comentarios vigentes del hilo completo, raíces y respuestas.
   *
   * Por la misma razón que el resumen de reacciones: el contador no existe como
   * columna —y agregarla sería agregar esquema por comodidad de una lectura—, se
   * calcula agrupado al leer la página.
   */
  @ApiProperty()
  commentCount!: number;
}

/** Publicación con sus adjuntos, etiquetas y menciones (UC-19-01). */
export class PostDetailDto extends PostListItemDto {
  /** Adjuntos, en orden de despliegue. */
  @ApiProperty({ type: [PostMediaDto] })
  media!: PostMediaDto[];

  /** Etiquetas resueltas a texto. */
  @ApiProperty({ type: [PostHashtagDto] })
  hashtags!: PostHashtagDto[];

  /** Menciones activas del cuerpo. */
  @ApiProperty({ type: [PostMentionDto] })
  mentions!: PostMentionDto[];
}

/** Página de publicaciones. */
export class PostPageDto {
  /** Publicaciones de la página. */
  @ApiProperty({ type: [PostListItemDto] })
  items!: PostListItemDto[];

  /** Cuántas trae esta página. */
  @ApiProperty()
  count!: number;

  /** Tope pedido. */
  @ApiProperty()
  limit!: number;

  /** Cursor de la página siguiente, o `null` si no hay más. */
  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;
}

/** Un comentario y sus respuestas directas. */
export class CommentThreadItemDto {
  /** Identificador del comentario. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Perfil autor. */
  @ApiProperty({ format: 'uuid' })
  authorProfileId!: string;

  /** Cuerpo del comentario. */
  @ApiProperty()
  bodyText!: string;

  /** Comentario padre, si es una respuesta. */
  @ApiPropertyOptional({ format: 'uuid' })
  parentCommentId?: string | null;

  /** Profundidad dentro del hilo. */
  @ApiPropertyOptional()
  threadDepth?: number | null;

  /** Cuántas respuestas tiene registradas. */
  @ApiPropertyOptional()
  replyCount?: number | null;

  /** Cuándo se creó. */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  /** Respuestas anidadas de este comentario. */
  @ApiProperty({ type: [CommentThreadItemDto] })
  replies!: CommentThreadItemDto[];
}

/** Página de comentarios raíz con sus hilos. */
export class CommentThreadPageDto {
  /** Comentarios raíz de la página, cada uno con sus respuestas. */
  @ApiProperty({ type: [CommentThreadItemDto] })
  items!: CommentThreadItemDto[];

  /** Cuántas raíces trae esta página. */
  @ApiProperty()
  count!: number;

  /** Tope pedido. */
  @ApiProperty()
  limit!: number;

  /** Cursor de la página siguiente, o `null`. */
  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;
}

/** Un seguimiento vigente. */
export class FollowListItemDto {
  /** Identificador del seguimiento. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Perfil que sigue. */
  @ApiProperty({ format: 'uuid' })
  followerProfileId!: string;

  /** Concept id del tipo de objeto seguido. */
  @ApiProperty({ format: 'uuid' })
  followableTypeConceptId!: string;

  /** Id del objeto seguido. */
  @ApiProperty({ format: 'uuid' })
  followableRefId!: string;

  /** Concept id del nivel de notificación elegido. */
  @ApiPropertyOptional({ format: 'uuid' })
  notificationLevelConceptId?: string | null;

  /** Cuándo empezó a seguir. */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Página de seguimientos. */
export class FollowPageDto {
  /** Seguimientos de la página. */
  @ApiProperty({ type: [FollowListItemDto] })
  items!: FollowListItemDto[];

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

/** Un marcador guardado. */
export class BookmarkListItemDto {
  /** Identificador del marcador. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Concept id del tipo de contenido guardado. */
  @ApiProperty({ format: 'uuid' })
  bookmarkableTypeConceptId!: string;

  /** Id del contenido guardado. */
  @ApiProperty({ format: 'uuid' })
  bookmarkableRefId!: string;

  /** Colección en la que se guardó. */
  @ApiPropertyOptional()
  collectionName?: string | null;

  /** Cuándo se guardó. */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Página de marcadores. */
export class BookmarkPageDto {
  /** Marcadores de la página. */
  @ApiProperty({ type: [BookmarkListItemDto] })
  items!: BookmarkListItemDto[];

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

/** Un bloqueo emitido por el actor. */
export class BlockListItemDto {
  /** Identificador del bloqueo. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Perfil bloqueado. */
  @ApiProperty({ format: 'uuid' })
  blockedProfileId!: string;

  /** Concept id del motivo declarado. */
  @ApiPropertyOptional({ format: 'uuid' })
  reasonConceptId?: string | null;

  /** Cuándo se bloqueó. */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Página de bloqueos. */
export class BlockPageDto {
  /** Bloqueos de la página. */
  @ApiProperty({ type: [BlockListItemDto] })
  items!: BlockListItemDto[];

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
