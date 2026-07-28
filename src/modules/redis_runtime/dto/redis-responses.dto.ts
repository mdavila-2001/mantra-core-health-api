import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta de escritura en caché (`POST /redis-runtime/cache`). */
export class CacheWriteResponseDto {
  /**
   * Valor de key mantenido por la instancia.
   */
  @ApiProperty({ description: 'Clave lógica escrita' }) key!: string;
  /**
   * Valor de ttl sec mantenido por la instancia.
   */
  @ApiProperty({ description: 'TTL aplicado en segundos' }) ttlSec!: number;
}

/** Respuesta de lectura de caché (`GET /redis-runtime/cache/:key`). */
export class CacheReadResponseDto {
  /**
   * Valor de key mantenido por la instancia.
   */
  @ApiProperty() key!: string;
  /**
   * Valor de found mantenido por la instancia.
   */
  @ApiProperty({ description: 'Existe la clave y no ha expirado' })
  found!: boolean;
  /**
   * Valor de value mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Valor si existe', nullable: true })
  value?: string | null;
}

/** Respuesta de borrado de caché (`DELETE /redis-runtime/cache/:key`). */
export class CacheDeleteResponseDto {
  /**
   * Valor de key mantenido por la instancia.
   */
  @ApiProperty() key!: string;
  /**
   * Valor de deleted mantenido por la instancia.
   */
  @ApiProperty({ description: 'La clave existía y fue borrada' })
  deleted!: boolean;
}

/** Respuesta de adquisición de lock (`POST /redis-runtime/locks`). */
export class LockAcquireResponseDto {
  /**
   * Valor de key mantenido por la instancia.
   */
  @ApiProperty() key!: string;
  /**
   * Valor de acquired mantenido por la instancia.
   */
  @ApiProperty({ description: 'Se obtuvo el lock' }) acquired!: boolean;
  /**
   * Valor de token mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Token del titular; requerido para liberar. Sólo si acquired=true',
  })
  token?: string;
}

/** Respuesta de liberación de lock (`DELETE /redis-runtime/locks/:key`). */
export class LockReleaseResponseDto {
  /**
   * Valor de key mantenido por la instancia.
   */
  @ApiProperty() key!: string;
  /**
   * Valor de released mantenido por la instancia.
   */
  @ApiProperty({ description: 'Se liberó el lock (el token coincidía)' })
  released!: boolean;
}
