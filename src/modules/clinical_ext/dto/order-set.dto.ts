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
  /**
   * Identificador asociado a item type concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de ítem (concept id)',
  })
  @IsOptional()
  @IsUUID()
  itemTypeConceptId?: string;

  /**
   * Identificador asociado a code concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Código de la orden (concept id)',
  })
  @IsUUID()
  codeConceptId!: string;

  /**
   * Valor de default dose text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  defaultDoseText?: string;

  /**
   * Valor de default frequency text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  defaultFrequencyText?: string;

  /**
   * Valor de is selected default mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Seleccionado por defecto al aplicar' })
  @IsOptional()
  @IsBoolean()
  isSelectedDefault?: boolean;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  ordinal?: number;
}

/** Cuerpo de `POST /order-sets` (crea la plantilla; precondición de UC-18-06). */
export class CreateOrderSetDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [OrderSetItemInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderSetItemInputDto)
  items!: OrderSetItemInputDto[];
}

/** Cuerpo de `POST /order-sets/{id}/apply` (UC-18-06). */
export class ApplyOrderSetDto {
  /**
   * Identificador asociado a encounter.
   */
  @ApiProperty({ format: 'uuid', description: 'Encuentro clínico abierto' })
  @IsUUID()
  encounterId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Tenant custodio de las órdenes derivadas; si se omite, se usa el del order set',
  })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  /**
   * Valor de selected item ids mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [String],
    description:
      'Ítems seleccionados explícitamente; si se omite, se usan los default',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  selectedItemIds?: string[];
}

/** Respuesta de creación de order set. */
export class OrderSetResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty()
  version!: number;

  /**
   * Valor de item count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de ítems creados' })
  itemCount!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Una orden derivada del fan-out del order set. */
export class AppliedOrderDto {
  /**
   * Identificador asociado a service request.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Service request persistido para este ítem',
  })
  serviceRequestId!: string;

  /**
   * Identificador asociado a order set item.
   */
  @ApiProperty({ format: 'uuid' })
  orderSetItemId!: string;

  /**
   * Identificador asociado a code concept.
   */
  @ApiProperty({ format: 'uuid' })
  codeConceptId!: string;

  /**
   * Valor de dose text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  doseText?: string;

  /**
   * Valor de frequency text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  frequencyText?: string;
}

/** Respuesta del fan-out (UC-18-06). */
export class ApplyOrderSetResponseDto {
  /**
   * Identificador asociado a order set.
   */
  @ApiProperty({ format: 'uuid' })
  orderSetId!: string;

  /**
   * Valor de applied orders mantenido por la instancia.
   */
  @ApiProperty({ type: [AppliedOrderDto] })
  appliedOrders!: AppliedOrderDto[];

  /**
   * Valor de count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de órdenes generadas' })
  count!: number;
}
