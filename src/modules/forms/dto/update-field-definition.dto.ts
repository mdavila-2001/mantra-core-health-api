import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
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
 * Las cuadrículas (`rows`) siguen fuera del modelo (D-D, en
 * `docs/progress/DECISIONS.md`) y dan 400.
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
}
