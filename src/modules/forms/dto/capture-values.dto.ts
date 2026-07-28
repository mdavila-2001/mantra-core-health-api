import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  Allow,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  TECHNICAL_DATA_TYPES,
  type TechnicalDataType,
} from './create-field-definition.dto';

/** Un valor capturado para un campo del formulario (UC-09-08). */
export class FieldValueInputDto {
  /**
   * Identificador asociado a field.
   */
  @ApiProperty({
    description: 'Campo al que corresponde el valor',
    format: 'uuid',
  })
  @IsUUID()
  fieldId!: string;

  /**
   * Valor de data type mantenido por la instancia.
   */
  @ApiProperty({
    enum: TECHNICAL_DATA_TYPES,
    description: 'Tipo de dato (determina value[x])',
  })
  @IsIn(TECHNICAL_DATA_TYPES)
  dataType!: TechnicalDataType;

  /**
   * Valor de value mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Valor tipado; se persiste en la columna value_* que corresponde',
  })
  @Allow()
  value!: unknown;

  /**
   * Identificador asociado a assignment.
   */
  @ApiPropertyOptional({
    description: 'Asignación que autoriza el campo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  /**
   * Identificador asociado a unit concept.
   */
  @ApiPropertyOptional({ description: 'Unidad (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Orden dentro del campo (cardinalidad)',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}

/** Cuerpo de `POST /forms/instances/{id}/values` (UC-09-08). */
export class CaptureValuesDto {
  /**
   * Valor de values mantenido por la instancia.
   */
  @ApiProperty({
    type: [FieldValueInputDto],
    description: 'Valores a capturar',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FieldValueInputDto)
  values!: FieldValueInputDto[];
}
