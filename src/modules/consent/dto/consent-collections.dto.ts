import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de consentimientos (V07-01). */
export class ConsentItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  grantedByUserId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  grantedByRelatedPersonId!: string | null;

  @ApiProperty({ format: 'uuid' })
  categoryConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  processingPurposeId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  processingLegalBasisId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  policyUri!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  policyVersion!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validFrom!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validTo!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  withdrawalReasonConceptId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  withdrawnAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de consentimientos. */
export class ListConsentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  processingPurposeId?: string;
}

/** Página de consentimientos. */
export class ConsentPageDto extends pageResponseOf(
  ConsentItemDto,
  'ConsentPageDto',
) {}

/** Fila de autorizaciones HIPAA (V07-03). */
export class HipaaAuthorizationItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  processingPurposeId!: string;

  @ApiProperty({ type: String })
  recipientDescription!: string;

  @ApiProperty({ type: String })
  informationDescription!: string;

  @ApiProperty({ format: 'uuid' })
  expirationTypeConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  expiresAt!: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  expirationEventText!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  signedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  revokedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de autorizaciones HIPAA. */
export class ListHipaaAuthorizationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de autorizaciones HIPAA. */
export class HipaaAuthorizationPageDto extends pageResponseOf(
  HipaaAuthorizationItemDto,
  'HipaaAuthorizationPageDto',
) {}

/** Fila de objeciones de paciente (V07-04). */
export class PatientObjectionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  processingPurposeId!: string;

  @ApiProperty({ format: 'uuid' })
  objectionTypeConceptId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  reasonText!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  raisedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  resolvedAt!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  resolutionConceptId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de objeciones de paciente. */
export class ListPatientObjectionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de objeciones de paciente. */
export class PatientObjectionPageDto extends pageResponseOf(
  PatientObjectionItemDto,
  'PatientObjectionPageDto',
) {}

/** Fila de restricciones de privacidad (V07-06). */
export class PrivacyRestrictionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  restrictionTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  dataClassConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  targetActorTypeConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  targetActorId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  reasonText!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validFrom!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validTo!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de restricciones de privacidad. */
export class ListPrivacyRestrictionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de restricciones de privacidad. */
export class PrivacyRestrictionPageDto extends pageResponseOf(
  PrivacyRestrictionItemDto,
  'PrivacyRestrictionPageDto',
) {}

/** Fila de bases legales de tratamiento (V07-07). */
export class ProcessingLegalBasisItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  processingPurposeId!: string;

  @ApiProperty({ format: 'uuid' })
  jurisdictionConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  generalLegalBasisConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  specialCategoryConditionConceptId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  policyVersion!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  legalReferenceUri!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  validFrom!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validTo!: Date | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de bases legales de tratamiento. */
export class ListProcessingLegalBasesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  processingPurposeId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de bases legales de tratamiento. */
export class ProcessingLegalBasisPageDto extends pageResponseOf(
  ProcessingLegalBasisItemDto,
  'ProcessingLegalBasisPageDto',
) {}

/** Fila de consentimientos informados de tratamiento (V07-08). */
export class TreatmentInformedConsentItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  encounterId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  procedureCodeConceptId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  informationVersion!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  interpreterUserId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  witnessUserId!: string | null;

  @ApiProperty({ format: 'uuid' })
  decisionConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  signedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  withdrawnAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de consentimientos informados de tratamiento. */
export class ListTreatmentInformedConsentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de consentimientos informados de tratamiento. */
export class TreatmentInformedConsentPageDto extends pageResponseOf(
  TreatmentInformedConsentItemDto,
  'TreatmentInformedConsentPageDto',
) {}
