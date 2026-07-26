import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta tras crear/verificar una unidad diagnóstica. */
export class DiagnosticUnitResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'Concept id de estado de verificación', format: 'uuid' })
  verificationStatus!: string;

  @ApiProperty({ description: 'Concept id de estado', format: 'uuid' })
  status!: string;

  @ApiPropertyOptional({ description: 'Perfil público asignado', format: 'uuid' })
  publicProfileId?: string;

  @ApiProperty({ description: 'Nº de sitios creados en el alta' })
  siteCount!: number;

  @ApiProperty({ description: 'Nº de acreditaciones creadas en el alta' })
  accreditationCount!: number;
}

/** Respuesta tras crear/actualizar un sitio operativo. */
export class SiteResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  diagnosticUnitId!: string;

  @ApiProperty({ description: 'Concept id de estado', format: 'uuid' })
  status!: string;
}

/** Respuesta tras publicar una oferta de estudio. */
export class StudyOfferingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  studyCode!: string;

  @ApiProperty({ description: 'Concept id de estado', format: 'uuid' })
  status!: string;

  @ApiProperty({ description: 'Nº de componentes del panel' })
  componentCount!: number;
}

/** Respuesta tras crear un cronograma de precios. */
export class PriceScheduleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ description: 'Concept id de estado', format: 'uuid' })
  status!: string;
}

/** Respuesta tras versionar un precio de estudio. */
export class StudyPriceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Nº de versión (append-only)' })
  versionNumber!: number;

  @ApiProperty({ description: 'Concept id de estado', format: 'uuid' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  effectiveFrom!: Date;
}

/** Respuesta tras registrar/actualizar equipamiento. */
export class EquipmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  diagnosticUnitSiteId!: string;

  @ApiProperty({ description: 'Concept id de estado operativo', format: 'uuid' })
  operationalStatus!: string;
}

/** Respuesta tras registrar/renovar una acreditación. */
export class AccreditationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Concept id de estado de verificación', format: 'uuid' })
  verificationStatus!: string;
}

/** Respuesta tras asignar un especialista. */
export class AssignmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Concept id de estado', format: 'uuid' })
  status!: string;
}

/** Respuesta tras declarar especialidades. */
export class SpecialtiesResultDto {
  @ApiProperty({ description: 'Nº de especialidades vigentes tras el cambio' })
  active!: number;

  @ApiProperty({ description: 'Nº de especialidades cerradas (soft)' })
  closed!: number;
}

/** Respuesta tras reconstruir la proyección del perfil público (UC-23-12). */
export class ReprojectResultDto {
  @ApiProperty({ format: 'uuid' })
  diagnosticUnitId!: string;

  @ApiProperty({ description: 'true si se (re)proyectó el perfil público' })
  projected!: boolean;
}

/** Resultado genérico de una operación de estado (close, retire). */
export class StatusResultDto {
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}
