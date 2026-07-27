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
  @ApiProperty({
    description: 'Canal de acceso de tercero',
    enum: TPA_CHANNELS,
  })
  @IsIn(TPA_CHANNELS)
  channel!: string;

  @ApiProperty({
    description: 'Resultado del acceso',
    enum: ['SUCCESS', 'FAILURE'],
  })
  @IsIn(['SUCCESS', 'FAILURE'])
  outcome!: string;

  @ApiPropertyOptional({
    description: 'Propósito de uso',
    enum: ['TREATMENT', 'PAYMENT', 'OPERATIONS', 'COVERAGE', 'VERIFICATION'],
  })
  @IsOptional()
  @IsIn(['TREATMENT', 'PAYMENT', 'OPERATIONS', 'COVERAGE', 'VERIFICATION'])
  purposeOfUse?: string;

  // --- DELEGATED ---
  @ApiPropertyOptional({
    description: 'DELEGATED: perfil de profesional delegante',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  delegatingPractitionerProfileId?: string;

  @ApiPropertyOptional({
    description: 'DELEGATED/INSURANCE: perfil de paciente',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({
    description: 'DELEGATED: asignación de delegación',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  delegatedAssignmentId?: string;

  @ApiPropertyOptional({ description: 'Recurso accedido', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  // --- INSURANCE ---
  @ApiPropertyOptional({
    description: 'INSURANCE: aseguradora',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  insuranceCarrierId?: string;

  @ApiPropertyOptional({ description: 'INSURANCE: reclamo', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  claimId?: string;

  @ApiPropertyOptional({
    description: 'INSURANCE: solicitud de autorización',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  authorizationRequestId?: string;

  // --- IDENTITY ---
  @ApiPropertyOptional({
    description: 'IDENTITY: caso de verificación',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  verificationCaseId?: string;

  // --- PHARMACY ---
  @ApiPropertyOptional({ description: 'PHARMACY: farmacia', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pharmacyId?: string;

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
  @ApiProperty({ description: 'Id de la fila del log especializado' })
  id!: string;

  @ApiProperty({ description: 'Canal usado' })
  channel!: string;

  @ApiProperty({ description: 'Id del evento de auditoría (provenance)' })
  auditLogId!: string;
}
