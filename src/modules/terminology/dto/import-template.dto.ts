import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Qué plantilla se quiere descargar.
 *
 * Ninguno de los dos campos lleva lista cerrada, por el mismo motivo que el
 * perfil de la importación: qué perfiles y qué formatos existen lo sabe el
 * importador, y dejar que lo decida él es lo que permite responder con el
 * código propio de cada rechazo en vez de un error de validación genérico.
 */
export class ImportTemplateQueryDto {
  /** Qué se va a cargar; por omisión, conceptos. */
  @ApiPropertyOptional({
    description: 'Qué se va a cargar',
    default: 'conceptos',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  profile?: string;

  /** En qué formato se quiere la plantilla; por omisión, CSV. */
  @ApiPropertyOptional({
    description: 'Formato de la plantilla',
    default: 'csv',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  format?: string;
}
