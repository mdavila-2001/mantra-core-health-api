import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `PATCH /surveys/templates/:id` (CL-72).
 *
 * Todo opcional: se manda sólo lo que cambió. Una clave ausente no significa
 * «vaciá esto»; para borrar la consigna se manda `description: ''`. El plazo
 * es **de la versión en borrador**: sobre una publicada responde 422.
 */
export class UpdateTemplateDto {
  /**
   * Título del instrumento.
   */
  @ApiPropertyOptional({
    description: 'Título del instrumento',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  /**
   * Consigna que ve el paciente. `''` la borra.
   */
  @ApiPropertyOptional({
    description: 'Consigna que ve el paciente; vacío la borra',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /**
   * Días para responder, de la versión en borrador.
   */
  @ApiPropertyOptional({
    description: 'Días para responder (de la versión en borrador)',
    minimum: 1,
    maximum: 365,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  responseWindowDays?: number;
}
