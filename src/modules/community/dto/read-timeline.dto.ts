import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostListItemDto } from './read-social.dto';

/** Una entrada del timeline materializado. */
export class FeedListItemDto {
  /** Identificador de la entrada. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Concept id del tipo de entrada. */
  @ApiProperty({ format: 'uuid' })
  itemTypeConceptId!: string;

  /** Concept id del tipo de fuente. */
  @ApiProperty({ format: 'uuid' })
  sourceTypeConceptId!: string;

  /** Id de la fuente (hoy, la publicación). */
  @ApiProperty({ format: 'uuid' })
  sourceRefId!: string;

  /** Concept id del origen (seguidos, grupo, sugerido…). */
  @ApiProperty({ format: 'uuid' })
  originConceptId!: string;

  /** Puntaje de orden. Viaja como texto: la columna es `numeric`. */
  @ApiPropertyOptional({ description: 'Puntaje de orden (numeric como texto)' })
  rankScore?: string | null;

  /** Si ya se mostró. */
  @ApiPropertyOptional()
  isSeen?: boolean | null;

  /** Cuándo entró al timeline. */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  /**
   * La publicación de la entrada, si sigue visible para el lector.
   *
   * Nula cuando la fuente ya no es legible —se retiró, o el autor y el lector
   * se bloquearon después del fan-out—. La entrada igual viaja para que el
   * cliente pueda mostrar el hueco en vez de saltear filas y descuadrar el
   * conteo de la página.
   */
  @ApiPropertyOptional({ type: PostListItemDto, nullable: true })
  post?: PostListItemDto | null;
}

/** Página del timeline (UC-19-13, cara de lectura). */
export class FeedPageDto {
  /** Entradas de la página. */
  @ApiProperty({ type: [FeedListItemDto] })
  items!: FeedListItemDto[];

  /** Cuántas trae esta página. */
  @ApiProperty()
  count!: number;

  /** Tope pedido. */
  @ApiProperty()
  limit!: number;

  /** Cursor de la página siguiente, o `null`. */
  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;
}

/** Una notificación social. */
export class SocialNotificationDto {
  /** Identificador de la notificación. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Concept id del tipo de notificación. */
  @ApiProperty({ format: 'uuid' })
  notificationTypeConceptId!: string;

  /** Perfil que la provocó, si lo hubo. */
  @ApiPropertyOptional({ format: 'uuid' })
  actorProfileId?: string | null;

  /** Concept id del tipo de origen. */
  @ApiProperty({ format: 'uuid' })
  sourceTypeConceptId!: string;

  /** Id del contenido de origen. */
  @ApiProperty({ format: 'uuid' })
  sourceRefId!: string;

  /** Texto corto de vista previa. */
  @ApiPropertyOptional()
  previewText?: string | null;

  /** Si ya se leyó. */
  @ApiProperty()
  isRead!: boolean;

  /** Cuándo se leyó. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  readAt?: Date | null;

  /** Cuándo se generó. */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Página de notificaciones con el total sin leer. */
export class NotificationPageDto {
  /** Notificaciones de la página. */
  @ApiProperty({ type: [SocialNotificationDto] })
  items!: SocialNotificationDto[];

  /** Cuántas trae esta página. */
  @ApiProperty()
  count!: number;

  /** Tope pedido. */
  @ApiProperty()
  limit!: number;

  /** Cursor de la página siguiente, o `null`. */
  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;

  /**
   * Cuántas hay sin leer en total.
   *
   * Se cuenta sobre la bandeja entera y no sobre la página: el globo de la
   * campana no depende de cuántas notificaciones se estén mostrando.
   */
  @ApiProperty()
  unreadCount!: number;
}
