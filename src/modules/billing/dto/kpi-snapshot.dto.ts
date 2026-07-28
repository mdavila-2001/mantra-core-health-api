import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /billing/kpi-snapshots:compute` (UC-17-12). */
export class ComputeKpiSnapshotDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ description: 'Práctica (practice.practices)', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /**
   * Identificador asociado a fiscal period.
   */
  @ApiPropertyOptional({
    description: 'Periodo fiscal (accounting.fiscal_periods)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fiscalPeriodId?: string;

  /**
   * Valor de kpi code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código de KPI (p. ej. DSO, AR_AGING, CASH_POSITION)',
  })
  @IsString()
  @MaxLength(60)
  kpiCode!: string;

  /**
   * Valor de value numeric mantenido por la instancia.
   */
  @ApiProperty({ description: 'Valor calculado del KPI', example: '42.50' })
  @IsNumberString()
  valueNumeric!: string;

  /**
   * Valor de dimension json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Dimensiones del cálculo (JSON)' })
  @IsOptional()
  @IsObject()
  dimensionJson?: Record<string, unknown>;

  /**
   * Valor de computed at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Marca del cálculo (ISO); por defecto ahora',
  })
  @IsOptional()
  @IsDateString()
  computedAt?: string;
}

/** Respuesta del snapshot registrado. */
export class KpiSnapshotResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de kpi code mantenido por la instancia.
   */
  @ApiProperty()
  kpiCode!: string;

  /**
   * Valor de value numeric mantenido por la instancia.
   */
  @ApiProperty()
  valueNumeric!: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @ApiProperty()
  recordedAt!: Date;
}
