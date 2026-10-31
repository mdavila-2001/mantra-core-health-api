import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const MATRIX_DIMENSIONS = ['person', 'doctor', 'service', 'location'] as const;
const ANOMALY_STATUSES = [
  'OPEN',
  'ACKNOWLEDGED',
  'DISMISSED',
  'ESCALATED',
] as const;
const ANOMALY_KINDS = [
  'ANOMALY_SEARCH_SPIKE',
  'ANOMALY_CANCEL_SPIKE',
  'ANOMALY_OFF_HOURS',
  'ANOMALY_DENIED_BURST',
  'ANOMALY_BROWSE_PATIENTS',
  'ANOMALY_INACTIVE_ACCOUNT',
  'ANOMALY_PRIVILEGE_CREEP',
] as const;

/** Consulta de `GET /org/governance/access-matrix`. */
export class AccessMatrixQueryDto {
  /** Dimensión: personas, o quién puede actuar sobre un doctor, servicio o espacio. */
  @ApiProperty({ enum: MATRIX_DIMENSIONS })
  @IsIn(MATRIX_DIMENSIONS)
  by!: (typeof MATRIX_DIMENSIONS)[number];

  /** Agrupa las columnas por categoría o por átomo (con `by = person`). */
  @ApiPropertyOptional({ enum: ['category', 'atom'], default: 'category' })
  @IsOptional()
  @IsIn(['category', 'atom'])
  group?: 'category' | 'atom';

  /** Doctor (asignación de rol o perfil), servicio o espacio (con `by` distinto de `person`). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id?: string;
}

/** Consulta de `GET /org/governance/unused-access`. */
export class UnusedAccessQueryDto {
  /** Días sin uso (por defecto el ajuste `unusedDays`, 60). */
  @ApiPropertyOptional({ minimum: 1, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}

/** Consulta de `GET /org/governance/anomalies`. */
export class AnomaliesQueryDto {
  /** Estado de las anomalías. */
  @ApiPropertyOptional({ enum: ANOMALY_STATUSES })
  @IsOptional()
  @IsIn(ANOMALY_STATUSES)
  status?: (typeof ANOMALY_STATUSES)[number];

  /** Tipo de anomalía. */
  @ApiPropertyOptional({ enum: ANOMALY_KINDS })
  @IsOptional()
  @IsIn(ANOMALY_KINDS)
  kind?: (typeof ANOMALY_KINDS)[number];
}

/** Cuerpo de `POST /org/governance/anomalies/:id/ack`. */
export class AckAnomalyDto {
  /** Qué se hace con la anomalía. */
  @ApiProperty({ enum: ['ACKNOWLEDGED', 'DISMISSED', 'ESCALATED'] })
  @IsIn(['ACKNOWLEDGED', 'DISMISSED', 'ESCALATED'])
  status!: 'ACKNOWLEDGED' | 'DISMISSED' | 'ESCALATED';

  /** Comentario (al menos 10 caracteres para descartar). */
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

/** Clases de motivo de una exportación (lo único del motivo que queda asentado, con su longitud y su huella). */
export const EXPORT_REASON_CODES = [
  'AUDIT_REVIEW',
  'REGULATORY',
  'INTERNAL_CONTROL',
  'INCIDENT',
  'OTHER',
] as const;

/** Cuerpo de `POST /org/governance/reports/:kind/export`. */
export class ExportGovernanceReportDto {
  /** Formato del archivo. */
  @ApiProperty({ enum: ['csv', 'json'] })
  @IsIn(['csv', 'json'])
  format!: 'csv' | 'json';

  /** Para qué se exporta (al menos 10 caracteres; no escriba datos de pacientes). */
  @ApiProperty({ minLength: 10, maxLength: 300 })
  @IsString()
  @MaxLength(300)
  reason!: string;

  /**
   * Clase del motivo, la única parte que se conserva en el asiento junto con la longitud y la
   * huella SHA-256 del texto (el texto libre no se guarda). Por defecto `OTHER`.
   */
  @ApiPropertyOptional({ enum: EXPORT_REASON_CODES, default: 'OTHER' })
  @IsOptional()
  @IsIn(EXPORT_REASON_CODES)
  reasonCode?: (typeof EXPORT_REASON_CODES)[number];

  /** Filtros del informe (los mismos de su consulta). */
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;
}

/** Una respuesta de informe: la forma depende del informe (documentada en la ruta). */
export class GovernanceReportResponseDto {
  /** Instante en que se calculó. */
  @ApiProperty({ format: 'date-time' })
  generatedAt!: string;

  /** Contenido del informe. */
  [key: string]: unknown;
}

/** Una anomalía de actividad. */
export class AnomalyViewDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiPropertyOptional() userName?: string;
  @ApiProperty({ enum: ANOMALY_KINDS }) kind!: string;
  @ApiProperty({ enum: ANOMALY_STATUSES }) status!: string;
  @ApiProperty({ format: 'date-time' }) windowStart!: string;
  @ApiProperty({ format: 'date-time' }) windowEnd!: string;
  @ApiProperty() observed!: number;
  @ApiPropertyOptional({ nullable: true }) baseline!: number | null;
  @ApiProperty() threshold!: number;
  @ApiProperty({ type: 'object', additionalProperties: true })
  evidence!: Record<string, unknown>;
  @ApiPropertyOptional({ format: 'date-time' }) acknowledgedAt?: string;
  @ApiPropertyOptional() resolutionComment?: string;
}

/** Lista de anomalías. */
export class AnomalyListDto {
  @ApiProperty({ type: [AnomalyViewDto] }) items!: AnomalyViewDto[];
  @ApiProperty() count!: number;
}

/** Resultado de reconocer, descartar o escalar una anomalía. */
export class AnomalyResolutionResultDto {
  @ApiProperty() ok!: boolean;
  @ApiProperty({ enum: ['ACKNOWLEDGED', 'DISMISSED', 'ESCALATED'] })
  status!: string;
}

/** Conteos del barrido diario. */
export class GovernanceSweepResultDto {
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  counts!: Record<string, number>;
}
