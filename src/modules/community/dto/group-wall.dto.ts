import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /community/groups/{groupId}/posts` (P7).
 *
 * Una publicación del muro y una respuesta a otra publicación viajan por el
 * mismo cuerpo: lo único que las distingue es `parentCommentId`. Se hace así
 * —y no con dos endpoints— porque en el modelo son la misma fila, y dos
 * endpoints que escriben la misma tabla acaban divergiendo en las validaciones.
 */
export class CreateGroupPostDto {
  /** Perfil que publica. Se verifica contra la sesión. */
  @ApiProperty({ description: 'Perfil autor', format: 'uuid' })
  @IsUUID()
  authorProfileId!: string;

  /** Texto de la publicación. */
  @ApiProperty({ description: 'Cuerpo del mensaje', maxLength: 5000 })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  bodyText!: string;

  /**
   * Publicación del muro a la que responde, si es una respuesta.
   *
   * Debe pertenecer al mismo grupo: responder «dentro» de un grupo a algo
   * publicado en otro colgaría el hilo de un muro que no lo contiene.
   */
  @ApiPropertyOptional({
    description: 'Publicación del muro a la que responde',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}

/**
 * Cuerpo de `PATCH /community/groups/{groupId}/members/{memberId}` (P7).
 *
 * Cubre las dos cosas que un administrador hace sobre una membresía: resolver
 * un alta pendiente y cambiar el rol. Ambas son opcionales y se pueden mandar
 * juntas —aprobar y promover en un solo acto—, pero al menos una tiene que
 * venir.
 */
export class UpdateGroupMemberDto {
  /** Nuevo rol dentro del grupo. `OWNER` no se otorga por acá. */
  @ApiPropertyOptional({
    description: 'Rol dentro del grupo',
    enum: ['MEMBER', 'MODERATOR', 'ADMIN'],
  })
  @IsOptional()
  @IsIn(['MEMBER', 'MODERATOR', 'ADMIN'])
  role?: 'MEMBER' | 'MODERATOR' | 'ADMIN';

  /** Resolución de un alta pendiente. */
  @ApiPropertyOptional({
    description: 'Resolución de la solicitud de ingreso',
    enum: ['APPROVE', 'REJECT'],
  })
  @IsOptional()
  @IsIn(['APPROVE', 'REJECT'])
  decision?: 'APPROVE' | 'REJECT';

  /** Perfil con el que actúa quien administra. Se verifica contra la sesión. */
  @ApiPropertyOptional({ description: 'Perfil administrador', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  actorProfileId?: string;
}

/** Cómo se para el lector frente a un grupo (P7). */
export class GroupViewerMembershipDto {
  /** `true` si el lector tiene membresía activa. */
  @ApiProperty()
  isMember!: boolean;

  /** `true` si puede aprobar altas y moderar el muro. */
  @ApiProperty()
  canAdminister!: boolean;

  /** `true` si puede escribir en el muro. */
  @ApiProperty()
  canPost!: boolean;

  /** Membresía del lector, si tiene una (aunque esté pendiente). */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  membershipId!: string | null;

  /** Concept id del rol del lector, o `null`. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  memberRoleConceptId!: string | null;

  /** Concept id del estado de la membresía del lector, o `null`. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  joinStatusConceptId!: string | null;
}

/** Ficha de un grupo (P7). */
export class GroupDetailDto {
  /** Identificador del grupo. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Organización a la que pertenece. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  /** Ruta del grupo. */
  @ApiProperty()
  slug!: string;

  /** Nombre visible. */
  @ApiProperty()
  name!: string;

  /** Descripción. */
  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  /** Concept id de la visibilidad. */
  @ApiProperty({ format: 'uuid' })
  visibilityConceptId!: string;

  /** Concept id del tipo de grupo. */
  @ApiProperty({ format: 'uuid' })
  groupTypeConceptId!: string;

  /** Tema por el que se clasifica, si tiene uno. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  topicId!: string | null;

  /** Perfil dueño. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ownerProfileId!: string | null;

  /** Imagen de portada. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  coverFileId!: string | null;

  /** Cuántos integrantes activos tiene. */
  @ApiPropertyOptional({ nullable: true })
  memberCount!: number | null;

  /** Cuántas publicaciones lleva el muro. */
  @ApiPropertyOptional({ nullable: true })
  postCount!: number | null;

  /** Altas esperando aprobación. Sólo se informa a quien administra. */
  @ApiPropertyOptional({ nullable: true })
  pendingCount!: number | null;

  /** Concept id del estado del grupo. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /** Cómo se para el lector frente a este grupo. */
  @ApiProperty({ type: GroupViewerMembershipDto })
  viewer!: GroupViewerMembershipDto;
}

/** Una publicación del muro de un grupo, con sus respuestas (P7). */
export class GroupWallItemDto {
  /** Identificador de la publicación. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Perfil autor. */
  @ApiProperty({ format: 'uuid' })
  authorProfileId!: string;

  /** Cuerpo del mensaje. */
  @ApiProperty()
  bodyText!: string;

  /** Publicación a la que responde, si es una respuesta. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentCommentId!: string | null;

  /** Profundidad dentro del hilo. */
  @ApiPropertyOptional({ nullable: true })
  threadDepth!: number | null;

  /** Cuántas respuestas tiene registradas. */
  @ApiPropertyOptional({ nullable: true })
  replyCount!: number | null;

  /** Cuándo se publicó. */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  /** Respuestas anidadas. */
  @ApiProperty({ type: [GroupWallItemDto] })
  replies!: GroupWallItemDto[];
}

/** Página del muro de un grupo (P7). */
export class GroupWallPageDto {
  /** Publicaciones de la página, cada una con su hilo. */
  @ApiProperty({ type: [GroupWallItemDto] })
  items!: GroupWallItemDto[];

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

/** Un tema del árbol de la plataforma (P7). */
export class TopicListItemDto {
  /** Identificador del tema. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Código estable. */
  @ApiProperty()
  code!: string;

  /** Nombre visible. */
  @ApiProperty()
  name!: string;

  /** Tema padre, si cuelga de otro. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentTopicId!: string | null;

  /** Especialidad con la que se corresponde, si se declaró. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  specialtyConceptId!: string | null;
}

/** Listado de temas (P7). */
export class TopicPageDto {
  /** Temas devueltos. */
  @ApiProperty({ type: [TopicListItemDto] })
  items!: TopicListItemDto[];

  /** Cuántos trae. */
  @ApiProperty()
  count!: number;

  /** Tope pedido. */
  @ApiProperty()
  limit!: number;
}

/** Resultado de resolver una membresía (P7). */
export class GroupMemberUpdatedDto {
  /** Membresía afectada. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Concept id del rol resultante. */
  @ApiProperty({ format: 'uuid' })
  memberRoleConceptId!: string;

  /** Concept id del estado resultante. */
  @ApiProperty({ format: 'uuid' })
  joinStatusConceptId!: string;
}
