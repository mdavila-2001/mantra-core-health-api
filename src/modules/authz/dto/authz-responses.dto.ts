import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta genérica al crear un recurso: id + estado + alta. */
export class AuthzIdResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Concept id del estado del recurso', format: 'uuid' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Resultado genérico de una operación de estado (revocar, aplicar, etc.). */
export class AuthzStatusResultDto {
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;

  @ApiPropertyOptional({ description: 'Nº de filas afectadas cuando aplica' })
  affected?: number;
}

/** Resultado de crear un rol junto a sus bindings de permisos. */
export class RoleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  @ApiProperty({ description: 'Nº de bindings permiso aplicados' })
  permissionCount!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Resultado de invalidar la cache del PDP (UC-06-11). */
export class CacheInvalidationResultDto {
  @ApiProperty({ description: 'true si se procesó la invalidación' })
  ok!: boolean;

  @ApiProperty({ description: 'Clave lógica de cache invalidada' })
  cacheKey!: string;

  @ApiProperty({ description: 'Nº de entradas de decisión invalidadas' })
  invalidatedEntries!: number;
}

/** Un campo con estrategia de enmascaramiento a aplicar en la respuesta. */
export class MaskedFieldDto {
  @ApiProperty()
  entity!: string;

  @ApiProperty()
  columnName!: string;

  @ApiProperty({ description: 'Estrategia (REDACT/HASH/PARTIAL/NULLIFY) o NO_READ' })
  strategy!: string;
}

/** Decisión efectiva del PDP (UC-06-12). */
export class DecisionResponseDto {
  @ApiProperty({ description: 'Decisión: PERMIT o DENY' })
  decision!: 'PERMIT' | 'DENY';

  @ApiProperty({ description: 'Motivo legible de la decisión' })
  reason!: string;

  @ApiProperty({ description: 'Ids de roles efectivos considerados', type: [String] })
  effectiveRoleIds!: string[];

  @ApiProperty({ description: 'Campos a enmascarar en la respuesta', type: [MaskedFieldDto] })
  maskedFields!: MaskedFieldDto[];

  @ApiPropertyOptional({ description: 'Propósito de uso registrado' })
  purposeOfUse?: string;

  @ApiProperty({ description: 'Clave de cache de la decisión (idempotente)' })
  cacheKey!: string;

  @ApiProperty({ description: 'TTL sugerido en segundos para la entrada de cache' })
  ttlSeconds!: number;
}
