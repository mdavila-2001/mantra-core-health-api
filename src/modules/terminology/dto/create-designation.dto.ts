import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsIn,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';

/** Idiomas admitidos para una designación. */
export type DesignationLanguage = 'ES' | 'EN';
/** Tipos de designación admitidos. */
export type DesignationType = 'PREFERRED' | 'SYNONYM';

/** Propiedad opcional a adjuntar al concepto junto con la designación. */
export class ConceptPropertyInputDto {
  /**
   * Valor de property code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código de la propiedad', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  propertyCode!: string;

  /**
   * Valor de value json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Valor de la propiedad (JSON arbitrario)' })
  @IsNotEmpty()
  valueJson!: unknown;

  /**
   * Valor de data type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo de dato técnico (enum terminology.technical_data_type)',
  })
  @IsOptional()
  @IsString()
  dataType?: string;
}

/** Alta de una designación (y opcionalmente propiedades) de un concepto (UC-03-05). */
export class CreateDesignationDto {
  /**
   * Valor de value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Texto de la designación', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value!: string;

  /**
   * Valor de language mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Idioma de la designación',
    enum: ['ES', 'EN'],
  })
  @IsOptional()
  @IsIn(['ES', 'EN'])
  language?: DesignationLanguage;

  /**
   * Valor de designation type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo de designación',
    enum: ['PREFERRED', 'SYNONYM'],
  })
  @IsOptional()
  @IsIn(['PREFERRED', 'SYNONYM'])
  designationType?: DesignationType;

  /**
   * Valor de preferred mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Marca la designación como preferida' })
  @IsOptional()
  @IsBoolean()
  preferred?: boolean;

  /**
   * Valor de properties mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [ConceptPropertyInputDto],
    description: 'Propiedades a adjuntar al concepto',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConceptPropertyInputDto)
  properties?: ConceptPropertyInputDto[];
}

/** Respuesta del alta de designación. */
export class DesignationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ description: 'Id de la designación creada' })
  id!: string;

  /**
   * Identificador asociado a concept.
   */
  @ApiProperty({ description: 'Id del concepto al que pertenece' })
  conceptId!: string;

  /**
   * Valor de value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Texto de la designación' })
  value!: string;

  /**
   * Identificador asociado a language concept.
   */
  @ApiPropertyOptional({ description: 'Idioma (concepto)' })
  languageConceptId?: string;

  /**
   * Identificador asociado a designation type concept.
   */
  @ApiPropertyOptional({ description: 'Tipo de designación (concepto)' })
  designationTypeConceptId?: string;

  /**
   * Valor de preferred mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Si es la designación preferida' })
  preferred?: boolean;

  /**
   * Valor de properties count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de propiedades adjuntadas' })
  propertiesCount!: number;
}
