import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Patrón admitido para claves de runtime: alfanumérico más `._-:`. Se prohíben
 * espacios y otros separadores para que ninguna clave pueda salirse de su
 * espacio de nombres por tenant ni inyectar patrones (`*`, saltos de línea).
 */
export const REDIS_KEY_PATTERN = /^[A-Za-z0-9._:-]+$/;

/** Cuerpo de `POST /redis-runtime/cache`: escritura de un valor con expiración. */
export class SetCacheDto {
  /**
   * Valor de key mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Clave lógica (se namespacea por tenant)',
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(REDIS_KEY_PATTERN, {
    message: 'La clave sólo admite [A-Za-z0-9._:-]',
  })
  key!: string;

  /**
   * Valor de value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Valor a almacenar (string)', maxLength: 65536 })
  @IsString()
  @MaxLength(65536)
  value!: string;

  /**
   * Valor de ttl sec mantenido por la instancia.
   */
  @ApiProperty({ description: 'TTL en segundos', minimum: 1, maximum: 2592000 })
  @IsInt()
  @Min(1)
  @Max(2592000)
  ttlSec!: number;
}
