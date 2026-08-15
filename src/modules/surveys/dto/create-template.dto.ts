import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /surveys/templates`.
 *
 * Crear la plantilla crea también su versión 1 en borrador: una plantilla sin
 * versión no admite preguntas y no serviría para nada, así que pedirle al
 * cliente dos llamadas para llegar a un estado utilizable sería ceremonia.
 */
export class CreateTemplateDto {
  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ description: 'Título del instrumento', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Consigna que ve el paciente antes de responder',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /**
   * Identificador asociado a owner practitioner.
   */
  @ApiPropertyOptional({
    description:
      'Profesional dueño. Por defecto, el perfil profesional del actor.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  ownerPractitionerId?: string;

  /**
   * Valor de response window days mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Días que tendrá el paciente para responder desde que se le emite la invitación',
    minimum: 1,
    maximum: 365,
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  responseWindowDays?: number;
}
