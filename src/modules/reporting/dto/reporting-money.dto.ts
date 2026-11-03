import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

/** Tipos de importe que el endpoint distingue. Nunca se suman entre sí. */
export const MONEY_KINDS = [
  'FACTURADO',
  'COBRADO',
  'COTIZADO',
  'OTRO',
] as const;
export type MoneyKind = (typeof MONEY_KINDS)[number];

/** Ventana de `GET /admin/analytics/money`. Sin `interval`/`portal`: no aplican. */
export class MoneyQueryDto {
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Por defecto: to − 7 días. Máximo 92 días de ventana.',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Por defecto: ahora',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

export class MoneyWindowDto {
  @ApiProperty({ format: 'date-time' })
  from!: string;

  @ApiProperty({ format: 'date-time' })
  to!: string;
}

export class MoneyItemDto {
  @ApiProperty({
    description:
      'Código del módulo real de la fuente (billing, quotations, payments).',
  })
  module!: string;

  @ApiProperty({ description: 'Etiqueta en español para mostrar.' })
  moduleLabel!: string;

  @ApiProperty({ enum: MONEY_KINDS })
  kind!: MoneyKind;

  @ApiProperty({
    description: 'ISO-4217. Un renglón por moneda: nunca se suman monedas.',
  })
  currency!: string;

  @ApiProperty({
    description: 'Operaciones que entraron en la suma (con importe y moneda).',
  })
  operations!: number;

  @ApiProperty({
    type: String,
    example: '1250.40',
    description: 'Decimal exacto con 2 decimales, como cadena. Jamás número.',
  })
  amount!: string;
}

export class MoneyNotMeasuredDto {
  @ApiProperty()
  module!: string;

  @ApiProperty()
  reason!: string;
}

export class MoneyResponseDto {
  @ApiProperty({ type: () => MoneyWindowDto })
  window!: MoneyWindowDto;

  @ApiProperty({ type: () => [MoneyItemDto] })
  items!: MoneyItemDto[];

  @ApiProperty({ type: () => [MoneyNotMeasuredDto] })
  notMeasured!: MoneyNotMeasuredDto[];
}
