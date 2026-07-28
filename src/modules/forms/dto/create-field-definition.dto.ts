import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Tipos de dato soportados por `terminology.technical_data_type`. */
export const TECHNICAL_DATA_TYPES = [
  'string',
  'text',
  'integer',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'time',
  'uuid',
  'json',
  'binary',
  'reference',
  'code',
] as const;
/**
 * Define el tipo de dominio technical data type.
 */
export type TechnicalDataType = (typeof TECHNICAL_DATA_TYPES)[number];

/** Regla de validación declarada junto al campo (UC-09-02). */
export class ValidationRuleInputDto {
  /**
   * Valor de rule type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['REQUIRED', 'RANGE', 'REGEX'] })
  @IsIn(['REQUIRED', 'RANGE', 'REGEX'])
  ruleType!: 'REQUIRED' | 'RANGE' | 'REGEX';

  /**
   * Valor de operator mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ['EQ', 'NEQ', 'GT', 'LT'] })
  @IsOptional()
  @IsIn(['EQ', 'NEQ', 'GT', 'LT'])
  operator?: 'EQ' | 'NEQ' | 'GT' | 'LT';

  /**
   * Valor de parameters mantenido por la instancia.
   */
  @ApiProperty({ description: 'Parámetros de la regla', type: Object })
  @IsObject()
  parameters!: Record<string, unknown>;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ['ERROR', 'WARNING'] })
  @IsOptional()
  @IsIn(['ERROR', 'WARNING'])
  severity?: 'ERROR' | 'WARNING';

  /**
   * Valor de error message mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Mensaje de error asociado' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  errorMessage?: string;
}

/** Cuerpo de `POST /forms/field-definitions` (UC-09-02). */
export class CreateFieldDefinitionDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código único del campo', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre legible', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Valor de data type mantenido por la instancia.
   */
  @ApiProperty({
    enum: TECHNICAL_DATA_TYPES,
    description: 'Tipo de dato técnico',
  })
  @IsIn(TECHNICAL_DATA_TYPES)
  dataType!: TechnicalDataType;

  /**
   * Identificador asociado a sensitivity concept.
   */
  @ApiPropertyOptional({
    description: 'Sensibilidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sensitivityConceptId?: string;

  /**
   * Identificador asociado a semantic concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto semántico (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  semanticConceptId?: string;

  /**
   * Identificador asociado a value set.
   */
  @ApiPropertyOptional({
    description: 'Value set de valores permitidos',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  valueSetId?: string;

  /**
   * Identificador asociado a unit value set.
   */
  @ApiPropertyOptional({ description: 'Value set de unidades', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitValueSetId?: string;

  /**
   * Valor de cardinality min mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cardinalidad mínima' })
  @IsOptional()
  @IsInt()
  cardinalityMin?: number;

  /**
   * Valor de cardinality max mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cardinalidad máxima' })
  @IsOptional()
  @IsInt()
  cardinalityMax?: number;

  /**
   * Valor de regex mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Expresión regular de validación' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  regex?: string;

  /**
   * Valor de validation rules mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [ValidationRuleInputDto],
    description: 'Reglas de validación',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidationRuleInputDto)
  validationRules?: ValidationRuleInputDto[];
}
