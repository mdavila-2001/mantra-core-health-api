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
  /**
   * Valor de properties mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a concept.
   */
  @ApiProperty({ description: 'Id del concepto' })
  conceptId!: string;

  /**
   * Valor de created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Propiedades creadas' })
  created!: number;

  /**
   * Valor de updated mantenido por la instancia.
   */
  @ApiProperty({ description: 'Propiedades actualizadas sobre una existente' })
  updated!: number;
}

/** Retirada de un concepto (UC-03-10). */
export class DeprecateConceptDto {
  /**
   * Identificador asociado a replaced by concept.
   */
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
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ description: 'Id del concepto retirado' })
  id!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ description: 'Estado en el que queda' })
  stateConceptId!: string;

  /**
   * Identificador asociado a replaced by concept.
   */
  @ApiPropertyOptional({ description: 'Concepto que lo sustituye' })
  replacedByConceptId?: string;

  /**
   * Valor de excluded members mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Miembros de conjuntos de valores que quedaron excluidos',
  })
  excludedMembers!: number;

  /**
   * Valor de already retired mantenido por la instancia.
   */
  @ApiProperty({ description: 'Verdadero si el concepto ya estaba retirado' })
  alreadyRetired!: boolean;
}

/** Designación tal como la devuelve `$lookup`. */
export class LookupDesignationDto {
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
   * Valor de preferred mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Si es la designación preferida de su idioma',
  })
  preferred?: boolean;
}

/** Propiedad tal como la devuelve `$lookup`. */
export class LookupPropertyDto {
  /**
   * Valor de property code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código de la propiedad' })
  propertyCode!: string;

  /**
   * Valor de data type mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tipo de dato técnico' })
  dataType?: string;

  /**
   * Valor de value json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Valor de la propiedad' })
  valueJson!: unknown;
}

/** Resultado de `$lookup` (UC-03-11). */
export class LookupResponseDto {
  /**
   * Identificador asociado a concept.
   */
  @ApiProperty({ description: 'Id del concepto resuelto' })
  conceptId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código dentro del sistema' })
  code!: string;

  /**
   * Valor de display mantenido por la instancia.
   */
  @ApiProperty({ description: 'Denominación principal' })
  display!: string;

  /**
   * Valor de definition mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Definición del concepto' })
  definition?: string;

  /**
   * Valor de selectable mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Si el concepto puede seleccionarse' })
  selectable?: boolean;

  /**
   * Identificador asociado a state concept.
   */
  @ApiPropertyOptional({ description: 'Estado del concepto' })
  stateConceptId?: string;

  /**
   * Valor de designations mantenido por la instancia.
   */
  @ApiProperty({
    type: [LookupDesignationDto],
    description: 'Designaciones multilingües',
  })
  designations!: LookupDesignationDto[];

  /**
   * Valor de properties mantenido por la instancia.
   */
  @ApiProperty({
    type: [LookupPropertyDto],
    description: 'Propiedades del concepto',
  })
  properties!: LookupPropertyDto[];
}
