import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /audit/retention/apply` (UC-10-09). */
export class RetentionApplyDto {
  @ApiPropertyOptional({
    description: 'Partición de tenant afectada',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Log/partición lógica objetivo',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  scope?: string;

  @ApiPropertyOptional({
    description:
      'Archiva/desprende particiones anteriores a esta fecha ISO-8601',
  })
  @IsOptional()
  @IsISO8601()
  olderThan?: string;
}

/** Resultado de la aplicación de retención. */
export class RetentionResultDto {
  @ApiProperty({ description: 'Id del evento de retención registrado' })
  auditLogId!: string;

  @ApiProperty({ description: 'true si la operación quedó registrada' })
  applied!: boolean;

  @ApiProperty({
    description: 'Nº real de filas purgadas por la política de retención',
  })
  purgedCount!: number;

  @ApiProperty({
    description: 'Momento del registro',
    type: String,
    format: 'date-time',
  })
  recordedAt!: Date;
}

/** Cuerpo de `POST /audit/anomaly/scan` (UC-10-10). */
export class AnomalyScanDto {
  @ApiPropertyOptional({
    description: 'Usuario a evaluar; por defecto el actor',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Tenant del análisis', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Ventana: accesos desde esta fecha ISO-8601',
  })
  @IsOptional()
  @IsISO8601()
  since?: string;
}

/** Resultado del barrido de anomalías. */
export class AnomalyScanResultDto {
  @ApiProperty({ description: 'Nº de accesos evaluados en la ventana' })
  accessCount!: number;

  @ApiProperty({ description: 'true si se detectó un patrón anómalo' })
  anomalous!: boolean;

  @ApiProperty({ description: 'Id del hallazgo de auditoría registrado' })
  auditLogId!: string;
}
