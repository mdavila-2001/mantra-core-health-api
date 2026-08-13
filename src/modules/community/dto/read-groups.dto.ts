import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Un grupo del directorio de la organización. */
export class GroupListItemDto {
  /** Identificador del grupo. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Organización a la que pertenece. */
  @ApiPropertyOptional({ format: 'uuid' })
  tenantId?: string | null;

  /** Ruta del grupo. */
  @ApiProperty()
  slug!: string;

  /** Nombre visible. */
  @ApiProperty()
  name!: string;

  /** Descripción. */
  @ApiPropertyOptional()
  description?: string | null;

  /** Concept id de la visibilidad (pública, privada). */
  @ApiProperty({ format: 'uuid' })
  visibilityConceptId!: string;

  /** Concept id del tipo de grupo. */
  @ApiProperty({ format: 'uuid' })
  groupTypeConceptId!: string;

  /** Perfil dueño. */
  @ApiPropertyOptional({ format: 'uuid' })
  ownerProfileId?: string | null;

  /** Imagen de portada. */
  @ApiPropertyOptional({ format: 'uuid' })
  coverFileId?: string | null;

  /** Cuántos integrantes tiene registrados. */
  @ApiPropertyOptional()
  memberCount?: number | null;

  /** Concept id del estado del grupo. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Página de grupos (UC-19-12, cara de lectura). */
export class GroupPageDto {
  /** Grupos de la página. */
  @ApiProperty({ type: [GroupListItemDto] })
  items!: GroupListItemDto[];

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

/** Un integrante de un grupo. */
export class GroupMemberDto {
  /** Identificador de la membresía. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Perfil integrante. */
  @ApiProperty({ format: 'uuid' })
  memberProfileId!: string;

  /** Concept id del rol dentro del grupo. */
  @ApiProperty({ format: 'uuid' })
  memberRoleConceptId!: string;

  /** Concept id del estado de la membresía. */
  @ApiProperty({ format: 'uuid' })
  joinStatusConceptId!: string;

  /** Cuándo se incorporó. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  joinedAt?: Date | null;

  /** Quién lo invitó, si alguien lo hizo. */
  @ApiPropertyOptional({ format: 'uuid' })
  invitedByProfileId?: string | null;
}

/** Página de integrantes de un grupo. */
export class GroupMemberPageDto {
  /** Integrantes de la página. */
  @ApiProperty({ type: [GroupMemberDto] })
  items!: GroupMemberDto[];

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
