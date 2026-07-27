import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /identity/verification-cases` (UC-27-02). */
export class OpenCaseDto {
  @ApiProperty({
    description: 'Política de verificación vigente',
    format: 'uuid',
  })
  @IsUUID()
  identityVerificationPolicyId!: string;

  @ApiProperty({ description: 'Concepto: tipo de sujeto', format: 'uuid' })
  @IsUUID()
  subjectTypeConceptId!: string;

  @ApiProperty({
    description: 'Id de la entidad sujeto (paciente/profesional/representante)',
    format: 'uuid',
  })
  @IsUUID()
  subjectEntityId!: string;

  @ApiPropertyOptional({
    description: 'Concepto: IAL/AAL solicitado (por defecto el de la política)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  requestedAssuranceLevelConceptId?: string;

  @ApiPropertyOptional({
    description: 'Correlation id para idempotencia de apertura',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  correlationId?: string;

  @ApiPropertyOptional({
    description: 'TTL del caso en horas (por defecto 72)',
    default: 72,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInHours?: number;
}
