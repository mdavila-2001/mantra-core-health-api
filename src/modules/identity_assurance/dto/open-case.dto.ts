import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /identity/verification-cases` (UC-27-02). */
export class OpenCaseDto {
  /**
   * Identificador asociado a identity verification policy.
   */
  @ApiProperty({
    description: 'Política de verificación vigente',
    format: 'uuid',
  })
  @IsUUID()
  identityVerificationPolicyId!: string;

  /**
   * Identificador asociado a subject type concept.
   */
  @ApiProperty({ description: 'Concepto: tipo de sujeto', format: 'uuid' })
  @IsUUID()
  subjectTypeConceptId!: string;

  /**
   * Identificador asociado a subject entity.
   */
  @ApiProperty({
    description: 'Id de la entidad sujeto (paciente/profesional/representante)',
    format: 'uuid',
  })
  @IsUUID()
  subjectEntityId!: string;

  /**
   * Identificador asociado a requested assurance level concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto: IAL/AAL solicitado (por defecto el de la política)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  requestedAssuranceLevelConceptId?: string;

  /**
   * Identificador asociado a correlation.
   */
  @ApiPropertyOptional({
    description: 'Correlation id para idempotencia de apertura',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  correlationId?: string;

  /**
   * Valor de expires in hours mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'TTL del caso en horas (por defecto 72)',
    default: 72,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInHours?: number;
}
