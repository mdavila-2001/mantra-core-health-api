import { ApiProperty } from '@nestjs/swagger';

/** Respuesta de creación/consulta de un consentimiento. */
export class ConsentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  @ApiProperty({ format: 'uuid' })
  processingPurposeId!: string;

  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una autorización HIPAA. */
export class HipaaAuthorizationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una objeción del paciente. */
export class PatientObjectionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  @ApiProperty({ description: 'Restricción de privacidad creada (si aplica)', nullable: true })
  restrictionId!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una restricción de privacidad. */
export class PrivacyRestrictionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una base legal de procesamiento versionada. */
export class ProcessingLegalBasisResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  processingPurposeId!: string;

  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  @ApiProperty({ description: 'Versión anterior cerrada (si la había)', nullable: true })
  supersededId!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de un consentimiento informado de tratamiento. */
export class TreatmentInformedConsentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  @ApiProperty({ description: 'Decisión (concept id)', format: 'uuid' })
  decision!: string;

  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una fila de evidencia inmutable. */
export class ConsentEvidenceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  subjectId!: string;

  @ApiProperty()
  recordedAt!: Date;
}

/** Resultado genérico de una operación de estado (withdraw, revoke, resolve, amend). */
export class StatusResultDto {
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}

/** Resultado del barrido de expiraciones (UC-07-11). */
export class ExpirationSweepResultDto {
  @ApiProperty({ description: 'Consentimientos expirados' })
  expiredConsents!: number;

  @ApiProperty({ description: 'Autorizaciones HIPAA expiradas' })
  expiredAuthorizations!: number;

  @ApiProperty({ description: 'Restricciones de privacidad expiradas' })
  expiredRestrictions!: number;
}
