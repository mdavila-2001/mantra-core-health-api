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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({ description: 'Código del activo', maxLength: 40 })
  @IsString()
  @MaxLength(40)
  code!: string;

  @ApiProperty({ description: 'Nombre del activo', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Cuenta de adquisición (débito del alta)', format: 'uuid' })
  @IsUUID()
  acquisitionAccountId!: string;

  @ApiProperty({ description: 'Cuenta banco/proveedor (crédito del alta)', format: 'uuid' })
  @IsUUID()
  offsetAccountId!: string;

  @ApiProperty({ description: 'Costo de adquisición', example: '10000.00' })
  @IsNumberString()
  acquisitionCost!: string;

  @ApiProperty({ format: 'date', example: '2026-01-15' })
  @IsDateString()
  acquisitionDate!: string;

  @ApiPropertyOptional({ description: 'Vida útil en meses', example: 60 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  usefulLifeMonths?: number;

  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  salvageValue?: string;

  @ApiPropertyOptional({ description: 'Área de valoración', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  depreciationAreaId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  responsibleEmployeeId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fiscalPeriodId?: string;
}

/** Cuerpo de `POST /accounting/depreciation/run` (UC-16-11). */
export class RunDepreciationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({ description: 'Periodo fiscal ABIERTO', format: 'uuid' })
  @IsUUID()
  fiscalPeriodId!: string;

  @ApiProperty({ description: 'Cuenta de gasto por depreciación (débito)', format: 'uuid' })
  @IsUUID()
  depreciationExpenseAccountId!: string;

  @ApiProperty({ description: 'Cuenta de depreciación acumulada (crédito)', format: 'uuid' })
  @IsUUID()
  accumulatedDepreciationAccountId!: string;

  @ApiProperty({ format: 'date', example: '2026-01-31' })
  @IsDateString()
  postingDate!: string;

  @ApiPropertyOptional({ description: 'Limitar a un activo concreto', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assetId?: string;
}

/** Respuesta con el activo capitalizado. */
export class AssetResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() status!: string;
  @ApiProperty() bookValue!: string;
  @ApiProperty({ format: 'uuid' }) transactionId!: string;
}

/** Respuesta del batch de depreciación. */
export class DepreciationRunResponseDto {
  @ApiProperty({ type: Number }) depreciatedAssets!: number;
  @ApiProperty({ type: [String] }) transactionIds!: string[];
}
