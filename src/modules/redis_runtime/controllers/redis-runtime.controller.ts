import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  getCurrentTenantId,
  PreconditionFailedException,
  Roles,
} from '../../../common';
import { RedisRuntimeService } from '../services';
import {
  AcquireLockDto,
  CacheDeleteResponseDto,
  CacheReadResponseDto,
  CacheWriteResponseDto,
  LockAcquireResponseDto,
  LockReleaseResponseDto,
  ReleaseLockQuery,
  SetCacheDto,
} from '../dto';

/**
 * Endpoints gobernados del runtime Redis (MÓDULO 56). Toda clave se acota al
 * tenant del contexto (`X-Tenant-Id`, verificado por `TenantContextInterceptor`);
 * no se expone `EVAL` arbitrario ni acceso a claves crudas cross-tenant.
 */
@ApiTags('redis-runtime')
@ApiBearerAuth()
@Controller('redis-runtime')
export class RedisRuntimeController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param runtime - Valor de runtime requerido por la operación.
   */
  constructor(private readonly runtime: RedisRuntimeService) {}

  /** Tenant del contexto; obligatorio para acotar cualquier operación. */
  private requireTenant(): string {
    const tenant = getCurrentTenantId();
    if (!tenant) {
      throw new PreconditionFailedException(
        'Se requiere X-Tenant-Id para operar sobre el runtime',
      );
    }
    return tenant;
  }

  // --- Caché ---------------------------------------------------------------

  /**
   * Actualiza set cache.
   *
   * @param dto - Datos validados de la operación.
   * @returns Resultado de set cache conforme al contrato `Promise<CacheWriteResponseDto>`.
   */
  @Post('cache')
  @Roles('PLATFORM_OPERATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Escribir un valor en caché con TTL (namespaced por tenant)',
  })
  async setCache(@Body() dto: SetCacheDto): Promise<CacheWriteResponseDto> {
    const tenant = this.requireTenant();
    await this.runtime.setWithTtl(tenant, dto.key, dto.value, dto.ttlSec);
    return { key: dto.key, ttlSec: dto.ttlSec };
  }

  /**
   * Obtiene get cache.
   *
   * @param key - Valor de key requerido por la operación.
   * @returns Resultado de get cache conforme al contrato `Promise<CacheReadResponseDto>`.
   */
  @Get('cache/:key')
  @Roles('PLATFORM_OPERATOR')
  @ApiOperation({
    summary: 'Leer un valor de caché por clave (namespaced por tenant)',
  })
  async getCache(@Param('key') key: string): Promise<CacheReadResponseDto> {
    const tenant = this.requireTenant();
    const value = await this.runtime.get(tenant, key);
    return { key, found: value !== null, value };
  }

  /**
   * Elimina o desactiva delete cache.
   *
   * @param key - Valor de key requerido por la operación.
   * @returns Resultado de delete cache conforme al contrato `Promise<CacheDeleteResponseDto>`.
   */
  @Delete('cache/:key')
  @Roles('PLATFORM_OPERATOR')
  @ApiOperation({
    summary: 'Borrar una clave de caché (namespaced por tenant)',
  })
  async deleteCache(
    @Param('key') key: string,
  ): Promise<CacheDeleteResponseDto> {
    const tenant = this.requireTenant();
    const deleted = await this.runtime.del(tenant, key);
    return { key, deleted };
  }

  // --- Locks ---------------------------------------------------------------

  /**
   * Ejecuta la operación acquire lock.
   *
   * @param dto - Datos validados de la operación.
   * @returns Resultado de acquire lock conforme al contrato `Promise<LockAcquireResponseDto>`.
   */
  @Post('locks')
  @Roles('PLATFORM_OPERATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adquirir un lock distribuido (SET NX PX + token)' })
  async acquireLock(
    @Body() dto: AcquireLockDto,
  ): Promise<LockAcquireResponseDto> {
    const tenant = this.requireTenant();
    const { acquired, token } = await this.runtime.acquireLock(
      tenant,
      dto.key,
      dto.ttlSec,
    );
    return { key: dto.key, acquired, token };
  }

  /**
   * Ejecuta la operación release lock.
   *
   * @param key - Valor de key requerido por la operación.
   * @param query - Valor de query requerido por la operación.
   * @returns Resultado de release lock conforme al contrato `Promise<LockReleaseResponseDto>`.
   */
  @Delete('locks/:key')
  @Roles('PLATFORM_OPERATOR')
  @ApiOperation({ summary: 'Liberar un lock si el token coincide (CAS)' })
  async releaseLock(
    @Param('key') key: string,
    @Query() query: ReleaseLockQuery,
  ): Promise<LockReleaseResponseDto> {
    const tenant = this.requireTenant();
    const released = await this.runtime.releaseLock(tenant, key, query.token);
    return { key, released };
  }
}
