import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /accounting/assets/capitalize` (UC-16-10). */
export class CapitalizeAssetDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código del activo', maxLength: 40 })
  @IsString()
  @MaxLength(40)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre del activo', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a acquisition account.
   */
  @ApiProperty({
    description: 'Cuenta de adquisición (débito del alta)',
    format: 'uuid',
  })
  @IsUUID()
  acquisitionAccountId!: string;

  /**
   * Identificador asociado a offset account.
   */
  @ApiProperty({
    description: 'Cuenta banco/proveedor (crédito del alta)',
    format: 'uuid',
  })
  @IsUUID()
  offsetAccountId!: string;

  /**
   * Valor de acquisition cost mantenido por la instancia.
   */
  @ApiProperty({ description: 'Costo de adquisición', example: '10000.00' })
  @IsNumberString()
  acquisitionCost!: string;

  /**
   * Valor de acquisition date mantenido por la instancia.
   */
  @ApiProperty({ format: 'date', example: '2026-01-15' })
  @IsDateString()
  acquisitionDate!: string;

  /**
   * Valor de useful life months mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Vida útil en meses', example: 60 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  usefulLifeMonths?: number;

  /**
   * Valor de salvage value mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  salvageValue?: string;

  /**
   * Identificador asociado a depreciation area.
   */
  @ApiPropertyOptional({ description: 'Área de valoración', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  depreciationAreaId?: string;

  /**
   * Identificador asociado a cost center.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  /**
   * Identificador asociado a responsible employee.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  responsibleEmployeeId?: string;

  /**
   * Identificador asociado a fiscal period.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fiscalPeriodId?: string;
}

/** Cuerpo de `POST /accounting/depreciation/run` (UC-16-11). */
export class RunDepreciationDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /**
   * Identificador asociado a fiscal period.
   */
  @ApiProperty({ description: 'Periodo fiscal ABIERTO', format: 'uuid' })
  @IsUUID()
  fiscalPeriodId!: string;

  /**
   * Identificador asociado a depreciation expense account.
   */
  @ApiProperty({
    description: 'Cuenta de gasto por depreciación (débito)',
    format: 'uuid',
  })
  @IsUUID()
  depreciationExpenseAccountId!: string;

  /**
   * Identificador asociado a accumulated depreciation account.
   */
  @ApiProperty({
    description: 'Cuenta de depreciación acumulada (crédito)',
    format: 'uuid',
  })
  @IsUUID()
  accumulatedDepreciationAccountId!: string;

  /**
   * Valor de posting date mantenido por la instancia.
   */
  @ApiProperty({ format: 'date', example: '2026-01-31' })
  @IsDateString()
  postingDate!: string;

  /**
   * Identificador asociado a asset.
   */
  @ApiPropertyOptional({
    description: 'Limitar a un activo concreto',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assetId?: string;
}

/** Respuesta con el activo capitalizado. */
export class AssetResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty() code!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty() status!: string;
  /**
   * Valor de book value mantenido por la instancia.
   */
  @ApiProperty() bookValue!: string;
  /**
   * Identificador asociado a transaction.
   */
  @ApiProperty({ format: 'uuid' }) transactionId!: string;
}

/** Respuesta del batch de depreciación. */
export class DepreciationRunResponseDto {
  /**
   * Valor de depreciated assets mantenido por la instancia.
   */
  @ApiProperty({ type: Number }) depreciatedAssets!: number;
  /**
   * Valor de transaction ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String] }) transactionIds!: string[];
}
