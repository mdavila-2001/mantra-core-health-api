import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta genérica al crear un recurso: id + estado + alta. */
export class AuthzIdResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado del recurso',
    format: 'uuid',
  })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Resultado genérico de una operación de estado (revocar, aplicar, etc.). */
export class AuthzStatusResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;

  /**
   * Valor de affected mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nº de filas afectadas cuando aplica' })
  affected?: number;
}

/** Resultado de crear un rol junto a sus bindings de permisos. */
/**
 * Rol que un administrador puede asignar a un usuario.
 *
 * Sin este listado, asignar un rol exigía conocer de antemano el uuid de una
 * fila que ninguna operación devolvía.
 */
export class AssignableRoleDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código que exige `@Roles(...)`' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre legible' })
  name!: string;

  /**
   * Valor de is system mantenido por la instancia.
   */
  @ApiProperty({ description: 'Rol de sistema (no ligado a un tenant)' })
  isSystem!: boolean;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant propietario', format: 'uuid' })
  tenantId?: string;
}

export class RoleResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;

  /**
   * Valor de permission count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de bindings permiso aplicados' })
  permissionCount!: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Resultado de invalidar la cache del PDP (UC-06-11). */
export class CacheInvalidationResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si se procesó la invalidación' })
  ok!: boolean;

  /**
   * Valor de cache key mantenido por la instancia.
   */
  @ApiProperty({ description: 'Clave lógica de cache invalidada' })
  cacheKey!: string;

  /**
   * Valor de invalidated entries mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de entradas de decisión invalidadas' })
  invalidatedEntries!: number;
}

/** Un campo con estrategia de enmascaramiento a aplicar en la respuesta. */
export class MaskedFieldDto {
  /**
   * Valor de entity mantenido por la instancia.
   */
  @ApiProperty()
  entity!: string;

  /**
   * Valor de column name mantenido por la instancia.
   */
  @ApiProperty()
  columnName!: string;

  /**
   * Valor de strategy mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Estrategia (REDACT/HASH/PARTIAL/NULLIFY) o NO_READ',
  })
  strategy!: string;
}

/** Decisión efectiva del PDP (UC-06-12). */
export class DecisionResponseDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({ description: 'Decisión: PERMIT o DENY' })
  decision!: 'PERMIT' | 'DENY';

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Motivo legible de la decisión' })
  reason!: string;

  /**
   * Valor de effective role ids mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Ids de roles efectivos considerados',
    type: [String],
  })
  effectiveRoleIds!: string[];

  /**
   * Valor de masked fields mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Campos a enmascarar en la respuesta',
    type: [MaskedFieldDto],
  })
  maskedFields!: MaskedFieldDto[];

  /**
   * Valor de purpose of use mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Propósito de uso registrado' })
  purposeOfUse?: string;

  /**
   * Valor de cache key mantenido por la instancia.
   */
  @ApiProperty({ description: 'Clave de cache de la decisión (idempotente)' })
  cacheKey!: string;

  /**
   * Valor de ttl seconds mantenido por la instancia.
   */
  @ApiProperty({
    description: 'TTL sugerido en segundos para la entrada de cache',
  })
  ttlSeconds!: number;
}
