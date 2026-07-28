import { ApiProperty } from '@nestjs/swagger';

/** Respuesta de creación/consulta de un consentimiento. */
export class ConsentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Identificador asociado a processing purpose.
   */
  @ApiProperty({ format: 'uuid' })
  processingPurposeId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una autorización HIPAA. */
export class HipaaAuthorizationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una objeción del paciente. */
export class PatientObjectionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Identificador asociado a restriction.
   */
  @ApiProperty({
    description: 'Restricción de privacidad creada (si aplica)',
    nullable: true,
  })
  restrictionId!: string | null;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una restricción de privacidad. */
export class PrivacyRestrictionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una base legal de procesamiento versionada. */
export class ProcessingLegalBasisResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a processing purpose.
   */
  @ApiProperty({ format: 'uuid' })
  processingPurposeId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Identificador asociado a superseded.
   */
  @ApiProperty({
    description: 'Versión anterior cerrada (si la había)',
    nullable: true,
  })
  supersededId!: string | null;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de un consentimiento informado de tratamiento. */
export class TreatmentInformedConsentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({ description: 'Decisión (concept id)', format: 'uuid' })
  decision!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una fila de evidencia inmutable. */
export class ConsentEvidenceResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a subject.
   */
  @ApiProperty({ format: 'uuid' })
  subjectId!: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @ApiProperty()
  recordedAt!: Date;
}

/** Resultado genérico de una operación de estado (withdraw, revoke, resolve, amend). */
export class StatusResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}

/** Resultado del barrido de expiraciones (UC-07-11). */
export class ExpirationSweepResultDto {
  /**
   * Valor de expired consents mantenido por la instancia.
   */
  @ApiProperty({ description: 'Consentimientos expirados' })
  expiredConsents!: number;

  /**
   * Valor de expired authorizations mantenido por la instancia.
   */
  @ApiProperty({ description: 'Autorizaciones HIPAA expiradas' })
  expiredAuthorizations!: number;

  /**
   * Valor de expired restrictions mantenido por la instancia.
   */
  @ApiProperty({ description: 'Restricciones de privacidad expiradas' })
  expiredRestrictions!: number;
}
