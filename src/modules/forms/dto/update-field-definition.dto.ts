import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  TECHNICAL_DATA_TYPES,
  type TechnicalDataType,
} from './create-field-definition.dto';

/**
 * Cuerpo de `PATCH /forms/field-definitions/:id` (CL-61 / CL-69).
 *
 * `options` se reemplaza **entera**, nunca por índice: el orden importa y un
 * parche por posición se rompe en cuanto alguien inserta una opción en el
 * medio. `description: null` la **quita**; ausente significa «no cambió».
 * Las cuadrículas (`rows`) están fuera del modelo (decisión D-D) y dan 400.
 * `cardinalityMin` / `cardinalityMax` siguen la misma regla que `description`:
 * `null` quita el tope y ausente no lo toca.
 *
 * Cambiar `dataType` con valores ya capturados reescribiría la historia
 * clínica: responde 409.
 */
export class UpdateFieldDefinitionDto {
  /**
   * Nombre legible del campo.
   */
  @ApiPropertyOptional({
    description: 'Nombre legible del campo',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  /**
   * Tipo de dato técnico.
   */
  @ApiPropertyOptional({
    enum: TECHNICAL_DATA_TYPES,
    description:
      'Tipo de dato técnico; con valores capturados no se cambia (409)',
  })
  @IsOptional()
  @IsIn(TECHNICAL_DATA_TYPES)
  dataType?: TechnicalDataType;

  /**
   * Las opciones del campo, reemplazadas enteras. Al menos dos, sin vacíos
   * ni repetidas — el servicio es quien valida lo segundo, no este DTO.
   */
  @ApiPropertyOptional({
    type: [String],
    description: 'Opciones, reemplazadas enteras',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2, {
    message: 'Un campo de elección necesita al menos dos opciones',
  })
  @IsString({ each: true })
  options?: string[];

  /** Si el campo admite marcar varias opciones. */
  @ApiPropertyOptional({ description: 'Admite varias respuestas' })
  @IsOptional()
  @IsBoolean()
  multiple?: boolean;

  /** Si el campo ofrece además «Otro», con texto libre. */
  @ApiPropertyOptional({ description: 'Ofrece «Otro», con texto libre' })
  @IsOptional()
  @IsBoolean()
  allowOther?: boolean;

  /**
   * La ayuda bajo la pregunta. `null` la quita; ausente, no la toca.
   */
  @ApiPropertyOptional({
    description: 'Ayuda bajo la pregunta; null la quita',
    maxLength: 1000,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  /**
   * Cuántas respuestas hay que marcar como mínimo, en un campo de varias.
   * `null` quita el tope; ausente, no lo toca. Es la columna
   * `cardinality_min` que el alta ya escribía (carril 27, REQ-27-007).
   */
  @ApiPropertyOptional({
    description: 'Mínimo de respuestas; null quita el tope',
    minimum: 0,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  cardinalityMin?: number | null;

  /**
   * Cuántas respuestas se pueden marcar como máximo. `null` quita el tope;
   * ausente, no lo toca. «Exactamente n» es mínimo y máximo iguales.
   */
  @ApiPropertyOptional({
    description: 'Máximo de respuestas; null quita el tope',
    minimum: 1,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  cardinalityMax?: number | null;
}
