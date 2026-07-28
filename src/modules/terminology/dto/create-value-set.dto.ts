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
  /**
   * Identificador asociado a code system.
   */
  @ApiProperty({
    description: 'Id del sistema de códigos referido por la regla',
  })
  @IsUUID()
  codeSystemId!: string;

  /**
   * Valor de operator mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Operador de la regla',
    enum: ['IN', 'IS_A'],
  })
  @IsOptional()
  @IsIn(['IN', 'IS_A'])
  operator?: ValueSetOperator;

  /**
   * Valor de property mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Propiedad sobre la que aplica la regla',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  property?: string;

  /**
   * Valor de value mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Valor comparado por la regla',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  value?: string;

  /**
   * Valor de included mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Si la regla incluye (true) o excluye (false); por defecto true',
  })
  @IsOptional()
  @IsBoolean()
  included?: boolean;
}

/** Alta de un conjunto de valores con su versión inicial y reglas (UC-03-07). */
export class CreateValueSetDto {
  /**
   * Valor de internal code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código interno único del conjunto de valores',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  internalCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Nombre legible del conjunto de valores',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  /**
   * Valor de canonical url mantenido por la instancia.
   */
  @ApiProperty({ description: 'URL canónica FHIR del conjunto de valores' })
  @IsString()
  @IsNotEmpty()
  canonicalUrl!: string;

  /**
   * Valor de rules mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [ValueSetRuleInputDto],
    description: 'Reglas de composición',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValueSetRuleInputDto)
  rules?: ValueSetRuleInputDto[];
}

/** Respuesta del alta de conjunto de valores. */
export class ValueSetResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ description: 'Id del conjunto de valores creado' })
  id!: string;

  /**
   * Identificador asociado a version.
   */
  @ApiProperty({ description: 'Id de la versión inicial creada' })
  versionId!: string;

  /**
   * Valor de rules count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de reglas creadas' })
  rulesCount!: number;
}
