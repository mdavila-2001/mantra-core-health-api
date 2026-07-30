import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export const TPA_CHANNELS = [
  'DELEGATED',
  'INSURANCE',
  'IDENTITY',
  'PHARMACY',
] as const;

/**
 * Cuerpo de `POST /audit/third-party-access` (UC-10-12). El `channel` decide en qué
 * log especializado se registra; cada canal exige sus FKs NOT NULL propias.
 */
export class RecordThirdPartyAccessDto {
  /**
   * Valor de channel mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Canal de acceso de tercero',
    enum: TPA_CHANNELS,
  })
  @IsIn(TPA_CHANNELS)
  channel!: string;

  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Resultado del acceso',
    enum: ['SUCCESS', 'FAILURE'],
  })
  @IsIn(['SUCCESS', 'FAILURE'])
  outcome!: string;

  /**
   * Valor de purpose of use mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Propósito de uso',
    enum: ['TREATMENT', 'PAYMENT', 'OPERATIONS', 'COVERAGE', 'VERIFICATION'],
  })
  @IsOptional()
  @IsIn(['TREATMENT', 'PAYMENT', 'OPERATIONS', 'COVERAGE', 'VERIFICATION'])
  purposeOfUse?: string;

  // --- DELEGATED ---
  /**
   * Identificador asociado a delegating practitioner profile.
   */
  @ApiPropertyOptional({
    description: 'DELEGATED: perfil de profesional delegante',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  delegatingPractitionerProfileId?: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({
    description: 'DELEGATED/INSURANCE: perfil de paciente',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Identificador asociado a delegated assignment.
   */
  @ApiPropertyOptional({
    description: 'DELEGATED: asignación de delegación',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  delegatedAssignmentId?: string;

  /**
   * Identificador asociado a resource.
   */
  @ApiPropertyOptional({ description: 'Recurso accedido', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  // --- INSURANCE ---
  /**
   * Identificador asociado a insurance carrier.
   */
  @ApiPropertyOptional({
    description: 'INSURANCE: aseguradora',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  insuranceCarrierId?: string;

  /**
   * Identificador asociado a claim.
   */
  @ApiPropertyOptional({ description: 'INSURANCE: reclamo', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  claimId?: string;

  /**
   * Identificador asociado a authorization request.
   */
  @ApiPropertyOptional({
    description: 'INSURANCE: solicitud de autorización',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  authorizationRequestId?: string;

  // --- IDENTITY ---
  /**
   * Identificador asociado a verification case.
   */
  @ApiPropertyOptional({
    description: 'IDENTITY: caso de verificación',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  verificationCaseId?: string;

  // --- PHARMACY ---
  /**
   * Identificador asociado a pharmacy.
   */
  @ApiPropertyOptional({ description: 'PHARMACY: farmacia', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pharmacyId?: string;

  /**
   * Identificador asociado a correlation.
   */
  @ApiPropertyOptional({
    description: 'PHARMACY: correlación end-to-end',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  correlationId?: string;
}

/** Resultado de un acceso de tercero registrado. */
export class ThirdPartyAccessResultDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ description: 'Id de la fila del log especializado' })
  id!: string;

  /**
   * Valor de channel mantenido por la instancia.
   */
  @ApiProperty({ description: 'Canal usado' })
  channel!: string;

  /**
   * Identificador asociado a audit log.
   */
  @ApiProperty({ description: 'Id del evento de auditoría (provenance)' })
  auditLogId!: string;
}
