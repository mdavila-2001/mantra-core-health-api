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
export type TechnicalDataType = (typeof TECHNICAL_DATA_TYPES)[number];

/** Regla de validación declarada junto al campo (UC-09-02). */
export class ValidationRuleInputDto {
  @ApiProperty({ enum: ['REQUIRED', 'RANGE', 'REGEX'] })
  @IsIn(['REQUIRED', 'RANGE', 'REGEX'])
  ruleType!: 'REQUIRED' | 'RANGE' | 'REGEX';

  @ApiPropertyOptional({ enum: ['EQ', 'NEQ', 'GT', 'LT'] })
  @IsOptional()
  @IsIn(['EQ', 'NEQ', 'GT', 'LT'])
  operator?: 'EQ' | 'NEQ' | 'GT' | 'LT';

  @ApiProperty({ description: 'Parámetros de la regla', type: Object })
  @IsObject()
  parameters!: Record<string, unknown>;

  @ApiPropertyOptional({ enum: ['ERROR', 'WARNING'] })
  @IsOptional()
  @IsIn(['ERROR', 'WARNING'])
  severity?: 'ERROR' | 'WARNING';

  @ApiPropertyOptional({ description: 'Mensaje de error asociado' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  errorMessage?: string;
}

/** Cuerpo de `POST /forms/field-definitions` (UC-09-02). */
export class CreateFieldDefinitionDto {
  @ApiProperty({ description: 'Código único del campo', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Nombre legible', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    enum: TECHNICAL_DATA_TYPES,
    description: 'Tipo de dato técnico',
  })
  @IsIn(TECHNICAL_DATA_TYPES)
  dataType!: TechnicalDataType;

  @ApiPropertyOptional({
    description: 'Sensibilidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sensitivityConceptId?: string;

  @ApiPropertyOptional({
    description: 'Concepto semántico (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  semanticConceptId?: string;

  @ApiPropertyOptional({
    description: 'Value set de valores permitidos',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  valueSetId?: string;

  @ApiPropertyOptional({ description: 'Value set de unidades', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitValueSetId?: string;

  @ApiPropertyOptional({ description: 'Cardinalidad mínima' })
  @IsOptional()
  @IsInt()
  cardinalityMin?: number;

  @ApiPropertyOptional({ description: 'Cardinalidad máxima' })
  @IsOptional()
  @IsInt()
  cardinalityMax?: number;

  @ApiPropertyOptional({ description: 'Expresión regular de validación' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  regex?: string;

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
