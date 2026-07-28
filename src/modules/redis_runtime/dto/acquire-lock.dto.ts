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
import { REDIS_KEY_PATTERN } from './set-cache.dto';

/** Cuerpo de `POST /redis-runtime/locks`: adquisición de un lock distribuido. */
export class AcquireLockDto {
  /**
   * Valor de key mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Clave del recurso a bloquear (namespaced por tenant)',
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
   * Valor de ttl sec mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tiempo de vida del lock en segundos',
    minimum: 1,
    maximum: 3600,
  })
  @IsInt()
  @Min(1)
  @Max(3600)
  ttlSec!: number;
}
