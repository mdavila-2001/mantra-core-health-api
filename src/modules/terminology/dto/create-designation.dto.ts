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
  @ApiProperty({ description: 'Código de la propiedad', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  propertyCode!: string;

  @ApiProperty({ description: 'Valor de la propiedad (JSON arbitrario)' })
  @IsNotEmpty()
  valueJson!: unknown;

  @ApiPropertyOptional({ description: 'Tipo de dato técnico (enum terminology.technical_data_type)' })
  @IsOptional()
  @IsString()
  dataType?: string;
}

/** Alta de una designación (y opcionalmente propiedades) de un concepto (UC-03-05). */
export class CreateDesignationDto {
  @ApiProperty({ description: 'Texto de la designación', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value!: string;

  @ApiPropertyOptional({ description: 'Idioma de la designación', enum: ['ES', 'EN'] })
  @IsOptional()
  @IsIn(['ES', 'EN'])
  language?: DesignationLanguage;

  @ApiPropertyOptional({ description: 'Tipo de designación', enum: ['PREFERRED', 'SYNONYM'] })
  @IsOptional()
  @IsIn(['PREFERRED', 'SYNONYM'])
  designationType?: DesignationType;

  @ApiPropertyOptional({ description: 'Marca la designación como preferida' })
  @IsOptional()
  @IsBoolean()
  preferred?: boolean;

  @ApiPropertyOptional({ type: [ConceptPropertyInputDto], description: 'Propiedades a adjuntar al concepto' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConceptPropertyInputDto)
  properties?: ConceptPropertyInputDto[];
}

/** Respuesta del alta de designación. */
export class DesignationResponseDto {
  @ApiProperty({ description: 'Id de la designación creada' })
  id!: string;

  @ApiProperty({ description: 'Id del concepto al que pertenece' })
  conceptId!: string;

  @ApiProperty({ description: 'Texto de la designación' })
  value!: string;

  @ApiPropertyOptional({ description: 'Idioma (concepto)' })
  languageConceptId?: string;

  @ApiPropertyOptional({ description: 'Tipo de designación (concepto)' })
  designationTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Si es la designación preferida' })
  preferred?: boolean;

  @ApiProperty({ description: 'Número de propiedades adjuntadas' })
  propertiesCount!: number;
}
