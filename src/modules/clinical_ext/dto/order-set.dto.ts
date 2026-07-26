import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Un ítem de la plantilla de órdenes. */
export class OrderSetItemInputDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Tipo de ítem (concept id)' })
  @IsOptional()
  @IsUUID()
  itemTypeConceptId?: string;

  @ApiProperty({ format: 'uuid', description: 'Código de la orden (concept id)' })
  @IsUUID()
  codeConceptId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  defaultDoseText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  defaultFrequencyText?: string;

  @ApiPropertyOptional({ description: 'Seleccionado por defecto al aplicar' })
  @IsOptional()
  @IsBoolean()
  isSelectedDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  ordinal?: number;
}

/** Cuerpo de `POST /order-sets` (crea la plantilla; precondición de UC-18-06). */
export class CreateOrderSetDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  @ApiProperty({ type: [OrderSetItemInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderSetItemInputDto)
  items!: OrderSetItemInputDto[];
}

/** Cuerpo de `POST /order-sets/{id}/apply` (UC-18-06). */
export class ApplyOrderSetDto {
  @ApiProperty({ format: 'uuid', description: 'Encuentro clínico abierto' })
  @IsUUID()
  encounterId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Ítems seleccionados explícitamente; si se omite, se usan los default',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  selectedItemIds?: string[];
}

/** Respuesta de creación de order set. */
export class OrderSetResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  version!: number;

  @ApiProperty({ description: 'Nº de ítems creados' })
  itemCount!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Una orden derivada del fan-out del order set. */
export class AppliedOrderDto {
  @ApiProperty({ format: 'uuid' })
  orderSetItemId!: string;

  @ApiProperty({ format: 'uuid' })
  codeConceptId!: string;

  @ApiPropertyOptional()
  doseText?: string;

  @ApiPropertyOptional()
  frequencyText?: string;
}

/** Respuesta del fan-out (UC-18-06). */
export class ApplyOrderSetResponseDto {
  @ApiProperty({ format: 'uuid' })
  orderSetId!: string;

  @ApiProperty({ type: [AppliedOrderDto] })
  appliedOrders!: AppliedOrderDto[];

  @ApiProperty({ description: 'Nº de órdenes generadas' })
  count!: number;
}
