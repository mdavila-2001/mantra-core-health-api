import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

/** Tipos de tarifa de espacio. */
export const SPACE_TARIFF_KINDS = ['TARIFF_BED_DAY', 'TARIFF_OR_TIME'] as const;
/** Tipo de tarifa de espacio. */
export type SpaceTariffKind = (typeof SPACE_TARIFF_KINDS)[number];

/** Unidades de tiempo admitidas para el quirófano (minutos). */
export const OR_UNIT_MINUTES = [15, 30, 60] as const;

/** `YYYY-MM-DD`; el calendario real lo valida el servicio. */
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MESSAGE = 'Debe ser una fecha con formato YYYY-MM-DD';

/** Cuerpo de `POST /billing/space-tariffs`. */
export class CreateSpaceTariffDto {
  @ApiProperty({ format: 'uuid', description: 'Práctica dueña de la tarifa' })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({ enum: SPACE_TARIFF_KINDS })
  @IsIn(SPACE_TARIFF_KINDS)
  kind!: SpaceTariffKind;

  @ApiPropertyOptional({
    description: 'Categoría de cama (`BED_CAT_*`), sólo para día-cama',
  })
  @IsOptional()
  @IsString()
  bedCategoryCode?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Tarifa propia de una sala o cama (manda sobre la de su categoría)',
  })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;

  @ApiProperty({
    format: 'uuid',
    description:
      'Servicio del catálogo de la práctica (billing.service_catalog)',
  })
  @IsUUID()
  serviceCatalogId!: string;

  @ApiPropertyOptional({
    enum: OR_UNIT_MINUTES,
    description: 'Quirófano: minutos de cada unidad facturable',
  })
  @IsOptional()
  @Type(() => Number)
  @IsIn(OR_UNIT_MINUTES)
  unitMinutes?: number;

  @ApiPropertyOptional({ description: 'Quirófano: unidades mínimas a cobrar' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  minimumUnits?: number;

  @ApiProperty({
    example: '350.00',
    description: 'Precio por unidad (día o fracción)',
  })
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'El precio es un decimal no negativo con hasta 2 decimales',
  })
  unitPrice!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Moneda; por omisión la de la práctica',
  })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiProperty({ example: '2026-11-01' })
  @Matches(DAY, { message: DAY_MESSAGE })
  validFrom!: string;

  @ApiPropertyOptional({ example: '2027-01-01', description: 'Fin (excluido)' })
  @IsOptional()
  @Matches(DAY, { message: DAY_MESSAGE })
  validTo?: string;
}

/** Cuerpo de `POST /billing/space-tariffs/:id/close`. */
export class CloseSpaceTariffDto {
  @ApiProperty({
    example: '2026-12-01',
    description: 'Primer día en que la tarifa ya no rige (excluido)',
  })
  @Matches(DAY, { message: DAY_MESSAGE })
  validTo!: string;
}

/** Filtros de `GET /billing/space-tariffs`. */
export class ListSpaceTariffsQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiPropertyOptional({ enum: SPACE_TARIFF_KINDS })
  @IsOptional()
  @IsIn(SPACE_TARIFF_KINDS)
  kind?: SpaceTariffKind;

  @ApiPropertyOptional({
    description: 'Sólo las vigentes ese día (YYYY-MM-DD)',
  })
  @IsOptional()
  @Matches(DAY, { message: DAY_MESSAGE })
  onDate?: string;

  @ApiPropertyOptional({ default: 100, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

/** Una tarifa de espacio, tal como la devuelve la API. */
export class SpaceTariffResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) practiceId!: string;
  @ApiProperty({ enum: SPACE_TARIFF_KINDS }) kind!: SpaceTariffKind;
  @ApiPropertyOptional() bedCategoryCode?: string | null;
  @ApiPropertyOptional({ format: 'uuid' }) careSpaceId?: string | null;
  @ApiProperty({ format: 'uuid' }) serviceCatalogId!: string;
  @ApiPropertyOptional() unitMinutes?: number | null;
  @ApiPropertyOptional() minimumUnits?: number | null;
  @ApiProperty() unitPrice!: string;
  @ApiProperty({ format: 'uuid' }) currencyConceptId!: string;
  @ApiProperty() validFrom!: string;
  @ApiPropertyOptional() validTo?: string | null;
  @ApiProperty() createdAt!: Date;
}

/** Lista de tarifas. */
export class ListSpaceTariffsResponseDto {
  @ApiProperty({ type: [SpaceTariffResponseDto] })
  items!: SpaceTariffResponseDto[];
  @ApiProperty() count!: number;
}
