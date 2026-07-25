import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsIP, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /audit/events` — provenance quien-qué-cuándo (UC-10-04). */
export class RecordAuditEventDto {
  @ApiProperty({ description: 'Acción realizada (verbo de dominio)', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  action!: string;

  @ApiProperty({ description: 'Entidad objetivo (nombre lógico de tabla)', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  entity!: string;

  @ApiPropertyOptional({ description: 'Id de la entidad objetivo', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiProperty({ description: 'Resultado del evento', enum: ['SUCCESS', 'FAILURE'] })
  @IsIn(['SUCCESS', 'FAILURE'])
  outcome!: string;

  @ApiPropertyOptional({ description: 'Tenant (FK directory)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Sucursal (FK directory)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'IP de origen' })
  @IsOptional()
  @IsIP()
  ip?: string;

  @ApiPropertyOptional({ description: 'Dispositivo (FK iam.devices)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;
}

/** Respuesta de un evento de auditoría sellado. */
export class AuditEventResultDto {
  @ApiProperty({ description: 'Id del evento de auditoría' })
  id!: string;

  @ApiProperty({ description: 'Hash del eslabón anterior de la cadena', nullable: true })
  previousHash!: string | null;

  @ApiProperty({ description: 'Hash sellado de este registro' })
  recordHash!: string;

  @ApiProperty({ description: 'Momento del registro', type: String, format: 'date-time' })
  recordedAt!: Date;
}
