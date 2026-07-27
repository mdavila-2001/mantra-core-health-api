import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ConceptPropertyInputDto } from './create-designation.dto';

/**
 * Alta o actualización de propiedades de un concepto (UC-03-05, segunda mitad).
 *
 * El caso de uso declara `concept_properties — UPSERT`: reenviar la misma
 * propiedad actualiza su valor en vez de añadir una segunda con el mismo código.
 */
export class UpsertConceptPropertiesDto {
  @ApiProperty({
    type: [ConceptPropertyInputDto],
    description: 'Propiedades del concepto',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConceptPropertyInputDto)
  properties!: ConceptPropertyInputDto[];
}

/** Respuesta del alta o actualización de propiedades. */
export class ConceptPropertiesResponseDto {
  @ApiProperty({ description: 'Id del concepto' })
  conceptId!: string;

  @ApiProperty({ description: 'Propiedades creadas' })
  created!: number;

  @ApiProperty({ description: 'Propiedades actualizadas sobre una existente' })
  updated!: number;
}

/** Retirada de un concepto (UC-03-10). */
export class DeprecateConceptDto {
  @ApiPropertyOptional({
    description: 'Concepto que lo sustituye; tiene que estar activo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  replacedByConceptId?: string;
}

/** Respuesta de la retirada de un concepto. */
export class DeprecateConceptResponseDto {
  @ApiProperty({ description: 'Id del concepto retirado' })
  id!: string;

  @ApiProperty({ description: 'Estado en el que queda' })
  stateConceptId!: string;

  @ApiPropertyOptional({ description: 'Concepto que lo sustituye' })
  replacedByConceptId?: string;

  @ApiProperty({
    description: 'Miembros de conjuntos de valores que quedaron excluidos',
  })
  excludedMembers!: number;

  @ApiProperty({ description: 'Verdadero si el concepto ya estaba retirado' })
  alreadyRetired!: boolean;
}

/** Designación tal como la devuelve `$lookup`. */
export class LookupDesignationDto {
  @ApiProperty({ description: 'Texto de la designación' })
  value!: string;

  @ApiPropertyOptional({ description: 'Idioma (concepto)' })
  languageConceptId?: string;

  @ApiPropertyOptional({
    description: 'Si es la designación preferida de su idioma',
  })
  preferred?: boolean;
}

/** Propiedad tal como la devuelve `$lookup`. */
export class LookupPropertyDto {
  @ApiProperty({ description: 'Código de la propiedad' })
  propertyCode!: string;

  @ApiPropertyOptional({ description: 'Tipo de dato técnico' })
  dataType?: string;

  @ApiProperty({ description: 'Valor de la propiedad' })
  valueJson!: unknown;
}

/** Resultado de `$lookup` (UC-03-11). */
export class LookupResponseDto {
  @ApiProperty({ description: 'Id del concepto resuelto' })
  conceptId!: string;

  @ApiProperty({ description: 'Código dentro del sistema' })
  code!: string;

  @ApiProperty({ description: 'Denominación principal' })
  display!: string;

  @ApiPropertyOptional({ description: 'Definición del concepto' })
  definition?: string;

  @ApiPropertyOptional({ description: 'Si el concepto puede seleccionarse' })
  selectable?: boolean;

  @ApiPropertyOptional({ description: 'Estado del concepto' })
  stateConceptId?: string;

  @ApiProperty({
    type: [LookupDesignationDto],
    description: 'Designaciones multilingües',
  })
  designations!: LookupDesignationDto[];

  @ApiProperty({
    type: [LookupPropertyDto],
    description: 'Propiedades del concepto',
  })
  properties!: LookupPropertyDto[];
}
