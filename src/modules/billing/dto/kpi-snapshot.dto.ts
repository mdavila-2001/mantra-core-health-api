import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumberString, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /billing/kpi-snapshots:compute` (UC-17-12). */
export class ComputeKpiSnapshotDto {
  @ApiProperty({ description: 'Práctica (practice.practices)', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiPropertyOptional({ description: 'Periodo fiscal (accounting.fiscal_periods)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fiscalPeriodId?: string;

  @ApiProperty({ description: 'Código de KPI (p. ej. DSO, AR_AGING, CASH_POSITION)' })
  @IsString()
  @MaxLength(60)
  kpiCode!: string;

  @ApiProperty({ description: 'Valor calculado del KPI', example: '42.50' })
  @IsNumberString()
  valueNumeric!: string;

  @ApiPropertyOptional({ description: 'Dimensiones del cálculo (JSON)' })
  @IsOptional()
  @IsObject()
  dimensionJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Marca del cálculo (ISO); por defecto ahora' })
  @IsOptional()
  @IsDateString()
  computedAt?: string;
}

/** Respuesta del snapshot registrado. */
export class KpiSnapshotResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  kpiCode!: string;

  @ApiProperty()
  valueNumeric!: string;

  @ApiProperty()
  recordedAt!: Date;
}
