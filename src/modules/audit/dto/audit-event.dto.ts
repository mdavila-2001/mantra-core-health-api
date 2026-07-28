import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsIP,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /audit/events` — provenance quien-qué-cuándo (UC-10-04). */
export class RecordAuditEventDto {
  /**
   * Valor de action mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Acción realizada (verbo de dominio)',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  action!: string;

  /**
   * Valor de entity mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Entidad objetivo (nombre lógico de tabla)',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  entity!: string;

  /**
   * Identificador asociado a entity.
   */
  @ApiPropertyOptional({
    description: 'Id de la entidad objetivo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Resultado del evento',
    enum: ['SUCCESS', 'FAILURE'],
  })
  @IsIn(['SUCCESS', 'FAILURE'])
  outcome!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant (FK directory)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a branch.
   */
  @ApiPropertyOptional({
    description: 'Sucursal (FK directory)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  /**
   * Valor de ip mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'IP de origen' })
  @IsOptional()
  @IsIP()
  ip?: string;

  /**
   * Identificador asociado a device.
   */
  @ApiPropertyOptional({
    description: 'Dispositivo (FK iam.devices)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  deviceId?: string;
}

/** Respuesta de un evento de auditoría sellado. */
export class AuditEventResultDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ description: 'Id del evento de auditoría' })
  id!: string;

  /**
   * Valor de previous hash mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Hash del eslabón anterior de la cadena',
    nullable: true,
  })
  previousHash!: string | null;

  /**
   * Valor de record hash mantenido por la instancia.
   */
  @ApiProperty({ description: 'Hash sellado de este registro' })
  recordHash!: string;

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
