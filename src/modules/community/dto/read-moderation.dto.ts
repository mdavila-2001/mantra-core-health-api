import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/**
 * Convierte `?status=QUEUED,IN_REVIEW` en un arreglo.
 *
 * Se admite la lista separada por comas además del `?status=a&status=b` que
 * Nest ya entiende, porque es la forma en que una pantalla de filtros compone la
 * URL sin librerías de por medio.
 */
const comoLista = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((parte) => parte.trim())
      .filter((parte) => parte.length > 0);
  }
  return value;
};

/** Query de `GET /community/moderation/queue`. */
@ApiSchema({ name: 'CommunityModerationQueueQueryDto' })
export class ModerationQueueQueryDto {
  /**
   * Estados de cola admitidos.
   */
  @ApiPropertyOptional({
    description: 'Estados admitidos (lista separada por comas)',
    enum: ['QUEUED', 'IN_REVIEW', 'RESOLVED'],
    isArray: true,
  })
  @IsOptional()
  @Transform(comoLista)
  @IsIn(['QUEUED', 'IN_REVIEW', 'RESOLVED'], { each: true })
  status?: ('QUEUED' | 'IN_REVIEW' | 'RESOLVED')[];

  /**
   * Prioridades admitidas.
   */
  @ApiPropertyOptional({
    description: 'Prioridades admitidas (lista separada por comas)',
    enum: ['LOW', 'NORMAL', 'HIGH'],
    isArray: true,
  })
  @IsOptional()
  @Transform(comoLista)
  @IsIn(['LOW', 'NORMAL', 'HIGH'], { each: true })
  priority?: ('LOW' | 'NORMAL' | 'HIGH')[];

  /**
   * Tipos de contenido admitidos.
   */
  @ApiPropertyOptional({
    description: 'Tipos de contenido admitidos (lista separada por comas)',
    enum: ['POST', 'COMMENT', 'PROFILE', 'MESSAGE', 'REVIEW'],
    isArray: true,
  })
  @IsOptional()
  @Transform(comoLista)
  @IsIn(['POST', 'COMMENT', 'PROFILE', 'MESSAGE', 'REVIEW'], { each: true })
  contentType?: ('POST' | 'COMMENT' | 'PROFILE' | 'MESSAGE' | 'REVIEW')[];

  /**
   * Antigüedad mínima en horas.
   *
   * Es el filtro que sirve para trabajar: «qué lleva más de N horas sin
   * decisión». Se expresa en horas y no como fecha porque lo que el moderador
   * pregunta es cuánto lleva esperando, no desde qué instante.
   */
  @ApiPropertyOptional({
    description: 'Sólo lo encolado hace al menos estas horas',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minAgeHours?: number;

  /** Cursor opaco de la página anterior. */
  @ApiPropertyOptional({ description: 'Cursor de la página anterior' })
  @IsOptional()
  cursor?: string;

  /** Tope de filas. */
  @ApiPropertyOptional({ description: 'Tope de filas', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

/** Query de `GET /community/moderation/decisions`. */
@ApiSchema({ name: 'CommunityModerationDecisionsQueryDto' })
export class ModerationDecisionsQueryDto {
  /** Acota a una entrada de cola concreta. */
  @ApiPropertyOptional({ description: 'Entrada de cola', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  moderationQueueId?: string;

  /**
   * Tipos de decisión admitidos.
   */
  @ApiPropertyOptional({
    description: 'Decisiones admitidas (lista separada por comas)',
    enum: ['REMOVED', 'RESTRICTED', 'WARNED', 'DISMISSED'],
    isArray: true,
  })
  @IsOptional()
  @Transform(comoLista)
  @IsIn(['REMOVED', 'RESTRICTED', 'WARNED', 'DISMISSED'], { each: true })
  decision?: ('REMOVED' | 'RESTRICTED' | 'WARNED' | 'DISMISSED')[];

  /** Cursor opaco de la página anterior. */
  @ApiPropertyOptional({ description: 'Cursor de la página anterior' })
  @IsOptional()
  cursor?: string;

  /** Tope de filas. */
  @ApiPropertyOptional({ description: 'Tope de filas', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

/** Query de `GET /community/moderation/appeals`. */
@ApiSchema({ name: 'CommunityModerationAppealsQueryDto' })
export class ModerationAppealsQueryDto {
  /**
   * Estados de apelación admitidos.
   */
  @ApiPropertyOptional({
    description: 'Estados admitidos (lista separada por comas)',
    enum: ['OPEN', 'UPHELD', 'OVERTURNED', 'PARTIAL'],
    isArray: true,
  })
  @IsOptional()
  @Transform(comoLista)
  @IsIn(['OPEN', 'UPHELD', 'OVERTURNED', 'PARTIAL'], { each: true })
  status?: ('OPEN' | 'UPHELD' | 'OVERTURNED' | 'PARTIAL')[];

  /** Acota a un apelante concreto. */
  @ApiPropertyOptional({ description: 'Perfil que apeló', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  appellantProfileId?: string;

  /** Cursor opaco de la página anterior. */
  @ApiPropertyOptional({ description: 'Cursor de la página anterior' })
  @IsOptional()
  cursor?: string;

  /** Tope de filas. */
  @ApiPropertyOptional({ description: 'Tope de filas', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

/** El reporte que originó una entrada de cola, como contexto. */
export class QueueReportContextDto {
  /** Identificador del reporte. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Concept id de la razón declarada. */
  @ApiProperty({ format: 'uuid' })
  reasonConceptId!: string;

  /**
   * Detalle que escribió quien reportó.
   *
   * Es texto libre de un usuario y puede contener datos de terceros; viaja
   * porque el moderador **necesita** leerlo para decidir, y no sale de esta
   * lectura, que exige rol de moderación.
   */
  @ApiPropertyOptional()
  detailText?: string | null;

  /** Cuándo se reportó. */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Una entrada de la cola de moderación. */
export class ModerationQueueItemDto {
  /** Identificador de la entrada. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Concept id del tipo de contenido en revisión. */
  @ApiProperty({ format: 'uuid' })
  contentTypeConceptId!: string;

  /** Identificador del contenido en revisión. */
  @ApiProperty({ format: 'uuid' })
  contentRefId!: string;

  /** Concept id del origen (reporte de usuario, apelación, automático). */
  @ApiProperty({ format: 'uuid' })
  sourceConceptId!: string;

  /** Concept id de la prioridad. */
  @ApiPropertyOptional({ format: 'uuid' })
  priorityConceptId?: string | null;

  /** Concept id del estado de la entrada. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /** A quién está asignada, si a alguien. */
  @ApiPropertyOptional({ format: 'uuid' })
  assignedToUserId?: string | null;

  /** Cuándo entró a la cola. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  queuedAt?: Date | null;

  /**
   * Cuántos reportes acumula este contenido.
   *
   * La cola deduplica por contenido, así que sin este número una entrada
   * reportada por diez personas se ve igual que una reportada por una.
   */
  @ApiProperty()
  reportCount!: number;

  /** El reporte que abrió la entrada, si lo hubo. */
  @ApiPropertyOptional({ type: QueueReportContextDto, nullable: true })
  report?: QueueReportContextDto | null;
}

/** Página de la cola de moderación. */
export class ModerationQueuePageDto {
  /** Entradas de la página. */
  @ApiProperty({ type: [ModerationQueueItemDto] })
  items!: ModerationQueueItemDto[];

  /** Cuántas trae esta página. */
  @ApiProperty()
  count!: number;

  /** Tope pedido. */
  @ApiProperty()
  limit!: number;

  /** Cursor de la página siguiente, o `null` si no hay más. */
  @ApiPropertyOptional({ nullable: true })
  nextCursor?: string | null;
}

/** Una decisión de moderación ya tomada. */
export class ModerationDecisionItemDto {
  /** Identificador de la decisión. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Entrada de cola que resolvió. */
  @ApiProperty({ format: 'uuid' })
  moderationQueueId!: string;

  /** Concept id de la decisión tomada. */
  @ApiProperty({ format: 'uuid' })
  decisionConceptId!: string;

  /** Concept id de la política aplicada. */
  @ApiProperty({ format: 'uuid' })
  policyConceptId!: string;

  /** Motivo escrito por quien decidió. */
  @ApiPropertyOptional()
  rationaleText?: string | null;

  /** Concept id de la acción ejecutada. */
  @ApiPropertyOptional({ format: 'uuid' })
  actionTakenConceptId?: string | null;

  /** Quién decidió. */
  @ApiProperty({ format: 'uuid' })
  decidedByUserId!: string;

  /** Cuándo se decidió. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  decidedAt?: Date | null;
}

/** Página de decisiones. */
export class ModerationDecisionPageDto {
  /** Decisiones de la página. */
  @ApiProperty({ type: [ModerationDecisionItemDto] })
  items!: ModerationDecisionItemDto[];

  /** Cuántas trae esta página. */
  @ApiProperty()
  count!: number;

  /** Tope pedido. */
  @ApiProperty()
  limit!: number;

  /** Cursor de la página siguiente, o `null` si no hay más. */
  @ApiPropertyOptional({ nullable: true })
  nextCursor?: string | null;
}

/** Una apelación, con la decisión que impugna. */
export class ModerationAppealItemDto {
  /** Identificador de la apelación. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Decisión impugnada. */
  @ApiProperty({ format: 'uuid' })
  moderationDecisionId!: string;

  /** Perfil que apeló. */
  @ApiProperty({ format: 'uuid' })
  appellantProfileId!: string;

  /** Motivo de la apelación. */
  @ApiProperty()
  reasonText!: string;

  /** Concept id del estado de la apelación. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /** Concept id de la resolución, si ya se resolvió. */
  @ApiPropertyOptional({ format: 'uuid' })
  resolutionConceptId?: string | null;

  /** Quién la revisó. */
  @ApiPropertyOptional({ format: 'uuid' })
  reviewedByUserId?: string | null;

  /** Cuándo se resolvió. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  resolvedAt?: Date | null;

  /** Cuándo se presentó. */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  /**
   * La decisión impugnada, resuelta.
   *
   * Va embebida porque resolver una apelación sin leer qué se decidió y por qué
   * es resolverla a ciegas, y pedirla aparte serían N lecturas por pantalla.
   */
  @ApiPropertyOptional({ type: ModerationDecisionItemDto, nullable: true })
  decision?: ModerationDecisionItemDto | null;
}

/** Página de apelaciones. */
export class ModerationAppealPageDto {
  /** Apelaciones de la página. */
  @ApiProperty({ type: [ModerationAppealItemDto] })
  items!: ModerationAppealItemDto[];

  /** Cuántas trae esta página. */
  @ApiProperty()
  count!: number;

  /** Tope pedido. */
  @ApiProperty()
  limit!: number;

  /** Cursor de la página siguiente, o `null` si no hay más. */
  @ApiPropertyOptional({ nullable: true })
  nextCursor?: string | null;
}
