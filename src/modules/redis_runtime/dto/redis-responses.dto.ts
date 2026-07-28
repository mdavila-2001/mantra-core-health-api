import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta de escritura en caché (`POST /redis-runtime/cache`). */
export class CacheWriteResponseDto {
  @ApiProperty({ description: 'Clave lógica escrita' }) key!: string;
  @ApiProperty({ description: 'TTL aplicado en segundos' }) ttlSec!: number;
}

/** Respuesta de lectura de caché (`GET /redis-runtime/cache/:key`). */
export class CacheReadResponseDto {
  @ApiProperty() key!: string;
  @ApiProperty({ description: 'Existe la clave y no ha expirado' }) found!: boolean;
  @ApiPropertyOptional({ description: 'Valor si existe', nullable: true })
  value?: string | null;
}

/** Respuesta de borrado de caché (`DELETE /redis-runtime/cache/:key`). */
export class CacheDeleteResponseDto {
  @ApiProperty() key!: string;
  @ApiProperty({ description: 'La clave existía y fue borrada' }) deleted!: boolean;
}

/** Respuesta de adquisición de lock (`POST /redis-runtime/locks`). */
export class LockAcquireResponseDto {
  @ApiProperty() key!: string;
  @ApiProperty({ description: 'Se obtuvo el lock' }) acquired!: boolean;
  @ApiPropertyOptional({
    description: 'Token del titular; requerido para liberar. Sólo si acquired=true',
  })
  token?: string;
}

/** Respuesta de liberación de lock (`DELETE /redis-runtime/locks/:key`). */
export class LockReleaseResponseDto {
  @ApiProperty() key!: string;
  @ApiProperty({ description: 'Se liberó el lock (el token coincidía)' })
  released!: boolean;
}
