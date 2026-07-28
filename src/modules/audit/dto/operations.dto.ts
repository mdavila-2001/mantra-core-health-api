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
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    description: 'Partición de tenant afectada',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de scope mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Log/partición lógica objetivo',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  scope?: string;

  /**
   * Valor de older than mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a audit log.
   */
  @ApiProperty({ description: 'Id del evento de retención registrado' })
  auditLogId!: string;

  /**
   * Valor de applied mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la operación quedó registrada' })
  applied!: boolean;

  /**
   * Valor de purged count mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Nº real de filas purgadas por la política de retención',
  })
  purgedCount!: number;

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

/** Cuerpo de `POST /audit/anomaly/scan` (UC-10-10). */
export class AnomalyScanDto {
  /**
   * Identificador asociado a user.
   */
  @ApiPropertyOptional({
    description: 'Usuario a evaluar; por defecto el actor',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant del análisis', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de since mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Ventana: accesos desde esta fecha ISO-8601',
  })
  @IsOptional()
  @IsISO8601()
  since?: string;
}

/** Resultado del barrido de anomalías. */
export class AnomalyScanResultDto {
  /**
   * Valor de access count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de accesos evaluados en la ventana' })
  accessCount!: number;

  /**
   * Valor de anomalous mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si se detectó un patrón anómalo' })
  anomalous!: boolean;

  /**
   * Identificador asociado a audit log.
   */
  @ApiProperty({ description: 'Id del hallazgo de auditoría registrado' })
  auditLogId!: string;
}
