import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
  IsIn,
  IsBoolean,
  ValidateNested,
  MaxLength,
} from 'class-validator';

/** Operadores admitidos para una regla de conjunto de valores. */
export type ValueSetOperator = 'IN' | 'IS_A';

/** Una regla de composición de un conjunto de valores. */
export class ValueSetRuleInputDto {
  @ApiProperty({ description: 'Id del sistema de códigos referido por la regla' })
  @IsUUID()
  codeSystemId!: string;

  @ApiPropertyOptional({ description: 'Operador de la regla', enum: ['IN', 'IS_A'] })
  @IsOptional()
  @IsIn(['IN', 'IS_A'])
  operator?: ValueSetOperator;

  @ApiPropertyOptional({ description: 'Propiedad sobre la que aplica la regla', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  property?: string;

  @ApiPropertyOptional({ description: 'Valor comparado por la regla', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  value?: string;

  @ApiPropertyOptional({ description: 'Si la regla incluye (true) o excluye (false); por defecto true' })
  @IsOptional()
  @IsBoolean()
  included?: boolean;
}

/** Alta de un conjunto de valores con su versión inicial y reglas (UC-03-07). */
export class CreateValueSetDto {
  @ApiProperty({ description: 'Código interno único del conjunto de valores', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  internalCode!: string;

  @ApiProperty({ description: 'Nombre legible del conjunto de valores', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'URL canónica FHIR del conjunto de valores' })
  @IsString()
  @IsNotEmpty()
  canonicalUrl!: string;

  @ApiPropertyOptional({ type: [ValueSetRuleInputDto], description: 'Reglas de composición' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValueSetRuleInputDto)
  rules?: ValueSetRuleInputDto[];
}

/** Respuesta del alta de conjunto de valores. */
export class ValueSetResponseDto {
  @ApiProperty({ description: 'Id del conjunto de valores creado' })
  id!: string;

  @ApiProperty({ description: 'Id de la versión inicial creada' })
  versionId!: string;

  @ApiProperty({ description: 'Número de reglas creadas' })
  rulesCount!: number;
}
