import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Tipos de lista de precios soportados. */
export type PriceListTypeCode = 'PUBLIC' | 'INSURER';

/** Cuerpo de `POST /pharmacies/{pharmacyId}/price-lists` (UC-24-05). */
export class CreatePriceListDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único de lista por farmacia',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de price list type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de lista de precios',
    enum: ['PUBLIC', 'INSURER'],
  })
  @IsIn(['PUBLIC', 'INSURER'])
  priceListType!: PriceListTypeCode;

  /**
   * Identificador asociado a pharmacy site.
   */
  @ApiPropertyOptional({
    description: 'Sede a la que aplica la lista',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  pharmacySiteId?: string;

  /**
   * Identificador asociado a insurer tenant.
   */
  @ApiPropertyOptional({
    description: 'Tenant aseguradora (obligatorio si tipo INSURER)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  insurerTenantId?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de la moneda',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de vigencia',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fin de vigencia', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  /**
   * Valor de public visibility mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Visible públicamente' })
  @IsOptional()
  @IsBoolean()
  publicVisibility?: boolean;
}
