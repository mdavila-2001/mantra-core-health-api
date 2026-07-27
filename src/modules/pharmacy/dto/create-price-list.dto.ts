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
  @ApiProperty({
    description: 'Código único de lista por farmacia',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({
    description: 'Tipo de lista de precios',
    enum: ['PUBLIC', 'INSURER'],
  })
  @IsIn(['PUBLIC', 'INSURER'])
  priceListType!: PriceListTypeCode;

  @ApiPropertyOptional({
    description: 'Sede a la que aplica la lista',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  pharmacySiteId?: string;

  @ApiPropertyOptional({
    description: 'Tenant aseguradora (obligatorio si tipo INSURER)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  insurerTenantId?: string;

  @ApiPropertyOptional({
    description: 'Concept id de la moneda',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({
    description: 'Inicio de vigencia',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Fin de vigencia', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiPropertyOptional({ description: 'Visible públicamente' })
  @IsOptional()
  @IsBoolean()
  publicVisibility?: boolean;
}
