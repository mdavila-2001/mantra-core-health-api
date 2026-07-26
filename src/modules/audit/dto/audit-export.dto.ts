import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

/** Cuerpo de `POST /compliance/audit-export` (UC-10-07). */
export class CreateAuditExportDto {
  @ApiPropertyOptional({ description: 'Entidad cuyo historial se exporta', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entity?: string;

  @ApiPropertyOptional({ description: 'Id del sujeto/registro exportado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Definición de propósito (FK telemetry)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  purposeDefinitionId?: string;

  @ApiPropertyOptional({ description: 'Referencia externa del paquete de evidencia', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  exportReference?: string;

  @ApiPropertyOptional({ description: 'Nº de sujetos afectados', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  affectedSubjectCount?: number;

  @ApiPropertyOptional({ description: 'Hash de la consulta (idempotencia)', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  queryHash?: string;
}

/** Resultado de la exportación de evidencia. */
export class AuditExportResultDto {
  @ApiProperty({ description: 'Id de la fila de gobernanza' })
  id!: string;

  @ApiProperty({ description: 'Referencia del paquete de evidencia' })
  exportReference!: string;

  @ApiProperty({ description: 'Id del evento de auditoría (provenance)' })
  auditLogId!: string;

  @ApiProperty({ description: 'Momento del registro', type: String, format: 'date-time' })
  occurredAt!: Date;
}
