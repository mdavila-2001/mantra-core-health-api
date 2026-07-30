import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /audit/data-access` (UC-10-01). */
export class RecordDataAccessDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({
    description: 'Perfil de paciente accedido (FK profiles)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    description: 'Tenant del acceso (FK directory)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de resource type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo lógico de recurso accedido',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  resourceType?: string;

  /**
   * Identificador asociado a resource.
   */
  @ApiPropertyOptional({
    description: 'Id del recurso accedido',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  /**
   * Identificador asociado a resource version.
   */
  @ApiPropertyOptional({
    description: 'Versión del recurso accedido',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  resourceVersionId?: string;

  /**
   * Valor de purpose mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Propósito legible del acceso',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  purpose?: string;

  /**
   * Valor de purpose of use mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Propósito de uso codificado',
    enum: ['TREATMENT', 'PAYMENT', 'OPERATIONS', 'COVERAGE', 'VERIFICATION'],
  })
  @IsOptional()
  @IsIn(['TREATMENT', 'PAYMENT', 'OPERATIONS', 'COVERAGE', 'VERIFICATION'])
  purposeOfUse?: string;

  /**
   * Valor de legal basis mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Base legal del acceso',
    enum: ['TREATMENT', 'CONSENT', 'LEGAL_OBLIGATION'],
  })
  @IsOptional()
  @IsIn(['TREATMENT', 'CONSENT', 'LEGAL_OBLIGATION'])
  legalBasis?: string;

  /**
   * Identificador asociado a request.
   */
  @ApiPropertyOptional({
    description: 'Correlación de petición',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  requestId?: string;

  /**
   * Valor de policy version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión de política aplicada',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  policyVersion?: string;
}

/** Respuesta de un acceso registrado. */
export class DataAccessResultDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ description: 'Id de la fila de contabilidad de acceso' })
  id!: string;

  /**
   * Identificador asociado a audit log.
   */
  @ApiProperty({
    description: 'Id del evento de auditoría (provenance) sellado',
  })
  auditLogId!: string;

  /**
   * Valor de patient content logged mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si además se registró detalle de contenido del paciente',
  })
  patientContentLogged!: boolean;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Momento del registro',
    type: String,
    format: 'date-time',
  })
  recordedAt!: Date;
}
