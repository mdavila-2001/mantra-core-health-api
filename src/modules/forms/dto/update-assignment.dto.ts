import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Cuerpo de `PATCH /forms/assignments/:id` (CL-61).
 *
 * Lo obligatorio, lo visible y lo editable son **de la asignación**, no del
 * campo: «¿Fuma?» es el mismo campo en todos lados, pero puede ser obligatorio
 * en un formulario y opcional en otro. Sólo se manda lo que cambió.
 */
export class UpdateAssignmentDto {
  /**
   * ¿Requerido en este formulario?
   */
  @ApiPropertyOptional({ description: '¿Requerido?' })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  /**
   * ¿Visible en este formulario?
   */
  @ApiPropertyOptional({ description: '¿Visible?' })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  /**
   * ¿Editable en este formulario?
   */
  @ApiPropertyOptional({ description: '¿Editable?' })
  @IsOptional()
  @IsBoolean()
  editable?: boolean;
}
