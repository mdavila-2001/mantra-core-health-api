import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /audit/data-access` (UC-10-01). */
export class RecordDataAccessDto {
  @ApiPropertyOptional({ description: 'Perfil de paciente accedido (FK profiles)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ description: 'Tenant del acceso (FK directory)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Tipo lógico de recurso accedido', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  resourceType?: string;

  @ApiPropertyOptional({ description: 'Id del recurso accedido', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Versión del recurso accedido', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  resourceVersionId?: string;

  @ApiPropertyOptional({ description: 'Propósito legible del acceso', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  purpose?: string;

  @ApiPropertyOptional({
    description: 'Propósito de uso codificado',
    enum: ['TREATMENT', 'PAYMENT', 'OPERATIONS', 'COVERAGE', 'VERIFICATION'],
  })
  @IsOptional()
  @IsIn(['TREATMENT', 'PAYMENT', 'OPERATIONS', 'COVERAGE', 'VERIFICATION'])
  purposeOfUse?: string;

  @ApiPropertyOptional({
    description: 'Base legal del acceso',
    enum: ['TREATMENT', 'CONSENT', 'LEGAL_OBLIGATION'],
  })
  @IsOptional()
  @IsIn(['TREATMENT', 'CONSENT', 'LEGAL_OBLIGATION'])
  legalBasis?: string;

  @ApiPropertyOptional({ description: 'Correlación de petición', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requestId?: string;

  @ApiPropertyOptional({ description: 'Versión de política aplicada', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  policyVersion?: string;
}

/** Respuesta de un acceso registrado. */
export class DataAccessResultDto {
  @ApiProperty({ description: 'Id de la fila de contabilidad de acceso' })
  id!: string;

  @ApiProperty({ description: 'Id del evento de auditoría (provenance) sellado' })
  auditLogId!: string;

  @ApiProperty({ description: 'true si además se registró detalle de contenido del paciente' })
  patientContentLogged!: boolean;

  @ApiProperty({ description: 'Momento del registro', type: String, format: 'date-time' })
  recordedAt!: Date;
}
