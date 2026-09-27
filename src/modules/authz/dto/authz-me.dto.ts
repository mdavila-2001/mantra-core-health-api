import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Estado legible de un acceso, con la vigencia ya considerada. */
export type AccessState = 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'OTHER';

/** Una relación asistencial vista por el paciente. */
export class MyCareRelationshipDto {
  /**
   * Identificador (el que se pasa a `revoke`).
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Organización en la que se estableció.
   */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /**
   * Perfil del profesional.
   */
  @ApiProperty({ format: 'uuid' })
  practitionerProfileId!: string;

  /**
   * Nombre del profesional, para mostrarlo.
   */
  @ApiPropertyOptional()
  practitionerName?: string;

  /**
   * Estado legible; `ACTIVE` con la vigencia vencida figura como `EXPIRED`.
   */
  @ApiProperty({ enum: ['ACTIVE', 'REVOKED', 'EXPIRED', 'OTHER'] })
  state!: AccessState;

  /**
   * Desde cuándo.
   */
  @ApiProperty()
  validFrom!: Date;

  /**
   * Hasta cuándo, si tiene fin.
   */
  @ApiPropertyOptional()
  validTo?: Date;

  /**
   * Propósito acotado (concept id).
   */
  @ApiPropertyOptional({ format: 'uuid' })
  purposeConceptId?: string;
}

/** Un acceso clínico concedido sobre la historia del paciente. */
export class MyClinicalAccessGrantDto {
  /**
   * Identificador (el que se pasa a `revoke`).
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Organización del acceso.
   */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /**
   * Usuario que recibió el acceso.
   */
  @ApiProperty({ format: 'uuid' })
  grantedUserId!: string;

  /**
   * Nombre de quien recibió el acceso, para mostrarlo.
   */
  @ApiPropertyOptional()
  grantedName?: string;

  /**
   * `true` si es un acceso de emergencia (break-the-glass).
   */
  @ApiProperty()
  isEmergency!: boolean;

  /**
   * Estado legible; vencido por vigencia figura como `EXPIRED`.
   */
  @ApiProperty({ enum: ['ACTIVE', 'REVOKED', 'EXPIRED', 'OTHER'] })
  state!: AccessState;

  /**
   * Desde cuándo.
   */
  @ApiProperty()
  validFrom!: Date;

  /**
   * Hasta cuándo.
   */
  @ApiProperty()
  validTo!: Date;

  /**
   * Motivo del acceso (concept id).
   */
  @ApiProperty({ format: 'uuid' })
  reasonConceptId!: string;

  /**
   * Nivel de acceso (concept id).
   */
  @ApiProperty({ format: 'uuid' })
  accessLevelConceptId!: string;
}

/** «Quién ve mi historia»: relaciones y accesos, de una vez. */
export class MyClinicalAccessResponseDto {
  /**
   * Relaciones asistenciales del titular (sin las solicitudes pendientes).
   */
  @ApiProperty({ type: [MyCareRelationshipDto] })
  careRelationships!: MyCareRelationshipDto[];

  /**
   * Accesos clínicos concedidos sobre su historia.
   */
  @ApiProperty({ type: [MyClinicalAccessGrantDto] })
  grants!: MyClinicalAccessGrantDto[];
}
