import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Cuerpo de `PUT /forms/fields/{id}/localizations/{lang}` (UC-09-05). */
export class UpsertLocalizationDto {
  @ApiPropertyOptional({ description: 'Etiqueta traducida', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @ApiPropertyOptional({ description: 'Texto de ayuda traducido' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  helpText?: string;

  @ApiPropertyOptional({ description: 'Placeholder traducido', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeholder?: string;

  @ApiPropertyOptional({ description: 'Mensaje de validación traducido', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  validationMessage?: string;
}
