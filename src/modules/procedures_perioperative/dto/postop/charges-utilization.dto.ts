import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

// ---------------------------------------------------------------------------
// UC-53-14 · Cargos y utilización
// ---------------------------------------------------------------------------

/** Naturaleza del cargo generado. */
export type ChargeType = 'PROCEDURE' | 'IMPLANT' | 'SUPPLY' | 'OR_TIME';
export const CHARGE_TYPES = [
  'PROCEDURE',
  'IMPLANT',
  'SUPPLY',
  'OR_TIME',
] as const;

/**
 * Define el contrato validado para charge item.
 */
export class ChargeItemDto {
  /**
   * Valor de charge type mantenido por la instancia.
   */
  @ApiProperty({ enum: CHARGE_TYPES })
  @IsIn(CHARGE_TYPES)
  chargeType!: ChargeType;

  /**
   * Identificador asociado a billable item.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Concepto facturable del catálogo',
  })
  @IsUUID()
  billableItemId!: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cantidad, como cadena decimal' })
  @IsNumberString()
  quantity!: string;

  /**
   * Valor de unit price mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Precio unitario' })
  @IsOptional()
  @IsNumberString()
  unitPrice?: string;

  /**
   * Valor de currency code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/charge-items/post` (UC-53-14). */
export class PostChargesDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({
    type: [ChargeItemDto],
    description: 'Cargos a generar, al menos uno',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChargeItemDto)
  items!: ChargeItemDto[];

  /**
   * Valor de consolidate utilization mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: true,
    description: 'Consolidar además el uso real del quirófano',
  })
  @IsOptional()
  @IsBoolean()
  consolidateUtilization?: boolean;

  /**
   * Valor de turnover seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Segundos de recambio hasta el siguiente caso',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  turnoverSeconds?: number;
}

/**
 * Define el contrato validado para post charges response.
 */
export class PostChargesResponseDto {
  /**
   * Identificador asociado a procedure case.
   */
  @ApiProperty({ format: 'uuid' })
  procedureCaseId!: string;

  /**
   * Valor de charged mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cargos generados' })
  charged!: number;

  /**
   * Valor de total amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Importe total de los cargos' })
  totalAmount!: string;

  /**
   * Valor de actual duration seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Duración real del caso, en segundos' })
  actualDurationSeconds?: number;

  /**
   * Valor de schedule variance seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Desviación frente a lo programado, en segundos',
  })
  scheduleVarianceSeconds?: number;
}
