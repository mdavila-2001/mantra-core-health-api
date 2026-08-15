import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

/**
 * Cuerpo de `POST /surveys/templates/:id/versions/:versionNumber/publish`.
 *
 * Publicar es lo que da vigencia al instrumento y lo congela. Ambas fechas son
 * opcionales: sin `effectiveFrom` rige desde el momento de publicar, y sin
 * `effectiveTo` la vigencia queda abierta — que es el caso normal de una
 * encuesta de satisfacción permanente.
 */
export class PublishVersionDto {
  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de vigencia (ISO-8601). Por defecto, ahora.',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Fin de vigencia (ISO-8601). Sin él, vigencia abierta.',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
