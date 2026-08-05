import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Cuerpo de `PUT /forms/fields/{id}/localizations/{lang}` (UC-09-05). */
export class UpsertLocalizationDto {
  /**
   * Valor de label mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Etiqueta traducida', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  /**
   * Valor de help text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Texto de ayuda traducido' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  helpText?: string;

  /**
   * Valor de placeholder mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Placeholder traducido', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeholder?: string;

  /**
   * Valor de validation message mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Mensaje de validación traducido',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  validationMessage?: string;
}
