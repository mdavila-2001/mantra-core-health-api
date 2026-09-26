import { ApiPropertyOptional } from '@nestjs/swagger';
import {
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
 * Sólo lo que el modelo ya tiene: `name` y `dataType`. Las opciones de un
 * campo de elección, «Otro», cuadrículas y descripción **no** están en el
 * modelo (D-D, registrada en `docs/progress/DECISIONS.md`): siguen dando 400,
 * que es el comportamiento real y documentado, no un olvido.
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
}
