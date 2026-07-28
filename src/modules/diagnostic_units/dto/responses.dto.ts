import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta tras crear/verificar una unidad diagnóstica. */
export class DiagnosticUnitResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Valor de verification status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id de estado de verificación',
    format: 'uuid',
  })
  verificationStatus!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id de estado', format: 'uuid' })
  status!: string;

  /**
   * Identificador asociado a public profile.
   */
  @ApiPropertyOptional({
    description: 'Perfil público asignado',
    format: 'uuid',
  })
  publicProfileId?: string;

  /**
   * Valor de site count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de sitios creados en el alta' })
  siteCount!: number;

  /**
   * Valor de accreditation count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de acreditaciones creadas en el alta' })
  accreditationCount!: number;
}

/** Respuesta tras crear/actualizar un sitio operativo. */
export class SiteResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a diagnostic unit.
   */
  @ApiProperty({ format: 'uuid' })
  diagnosticUnitId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id de estado', format: 'uuid' })
  status!: string;
}

/** Respuesta tras publicar una oferta de estudio. */
export class StudyOfferingResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de study code mantenido por la instancia.
   */
  @ApiProperty()
  studyCode!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id de estado', format: 'uuid' })
  status!: string;

  /**
   * Valor de component count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de componentes del panel' })
  componentCount!: number;
}

/** Respuesta tras crear un cronograma de precios. */
export class PriceScheduleResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id de estado', format: 'uuid' })
  status!: string;
}

/** Respuesta tras versionar un precio de estudio. */
export class StudyPriceResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de versión (append-only)' })
  versionNumber!: number;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id de estado', format: 'uuid' })
  status!: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  effectiveFrom!: Date;
}

/** Respuesta tras registrar/actualizar equipamiento. */
export class EquipmentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a diagnostic unit site.
   */
  @ApiProperty({ format: 'uuid' })
  diagnosticUnitSiteId!: string;

  /**
   * Valor de operational status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id de estado operativo',
    format: 'uuid',
  })
  operationalStatus!: string;
}

/** Respuesta tras registrar/renovar una acreditación. */
export class AccreditationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de verification status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id de estado de verificación',
    format: 'uuid',
  })
  verificationStatus!: string;
}

/** Respuesta tras asignar un especialista. */
export class AssignmentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id de estado', format: 'uuid' })
  status!: string;
}

/** Respuesta tras declarar especialidades. */
export class SpecialtiesResultDto {
  /**
   * Valor de active mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de especialidades vigentes tras el cambio' })
  active!: number;

  /**
   * Valor de closed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de especialidades cerradas (soft)' })
  closed!: number;
}

/** Respuesta tras reconstruir la proyección del perfil público (UC-23-12). */
export class ReprojectResultDto {
  /**
   * Identificador asociado a diagnostic unit.
   */
  @ApiProperty({ format: 'uuid' })
  diagnosticUnitId!: string;

  /**
   * Valor de projected mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si se (re)proyectó el perfil público' })
  projected!: boolean;
}

/** Resultado genérico de una operación de estado (close, retire). */
export class StatusResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}
