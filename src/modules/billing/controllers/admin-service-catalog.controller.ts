import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  AdminCreateServiceDto,
  AdminListServicesQueryDto,
  AdminServiceItemDto,
  AdminServicePageDto,
  AdminServiceStateChangeDto,
  AdminUpdateServiceDto,
} from '../dto/admin-service-catalog.dto';
import { AdminServiceCatalogService } from '../services/admin-service-catalog.service';

/**
 * Editor administrativo del catálogo de servicios (H3 del plan «perfil admin»).
 * Contrato completo y vigente: `docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/contratos/H3-catalogos.md`
 * (repo `mantra-core-health`). Resumen:
 *
 * Roles: `SECURITY_ADMIN` (y el comodín `SUPERADMIN`). Todas las rutas se acotan
 * a la organización del token (`requireTenantId()`); un servicio o una práctica
 * de otra organización responde 404, nunca 403. Sin token: 401. Rol
 * insuficiente: 403.
 *
 * | Método y ruta | Cuerpo / query | Éxito | Errores |
 * | --- | --- | --- | --- |
 * | `GET /admin/catalogs/services` | query `practiceTypeConceptId?`, `practiceId?`, `isActive?`, `q?`, `cursor?`, `limit?` (1..200, def. 50) | 200 `{items[], count, limit, nextCursor}` (orden `(code,id)`) | 400 query inválida o cursor; 404 `practiceId` ajena |
 * | `GET /admin/catalogs/services/:id` | — | 200 `AdminServiceItem` | 404 |
 * | `POST /admin/catalogs/services` | `{practiceId, code, name, defaultPrice, descriptionText?, serviceConceptId?, currencyConceptId?, isActive?}` | 201 creado · 200 si es repetición idéntica (idempotente por `(practiceId, code)`) | 400; 404 práctica ajena; 409 `SERVICE_CATALOG_CODE_ALREADY_EXISTS` (código ocupado con datos distintos); 422 precio 0 |
 * | `PATCH /admin/catalogs/services/:id` | `{expectedRowVersion, name?, descriptionText?|null, termsText?|null, serviceConceptId?, defaultPrice?, currencyConceptId?}` | 200 `AdminServiceItem` (`rowVersion` +1) | 400; 404; 409 `SERVICE_CATALOG_VERSION_MISMATCH`; 422 precio 0 |
 * | `POST /admin/catalogs/services/:id/deactivate` | `{expectedRowVersion}` | 200 (idempotente: ya inactivo = sin cambio ni versión nueva) | 400; 404; 409 |
 * | `POST /admin/catalogs/services/:id/reactivate` | `{expectedRowVersion}` | 200 (idempotente) | 400; 404; 409 |
 *
 * `AdminServiceItem` = `{id, practiceId, practiceTypeConceptId, code, name,
 * descriptionText?, termsText?, serviceConceptId?, defaultPrice, currencyConceptId?,
 * currencyCode?, isActive, rowVersion, updatedAt, updatedByUserId?}`.
 * No existe DELETE: se desactiva. «Tipo de usuario» = tipo de la organización
 * dueña (`practiceTypeConceptId`): el catálogo no tiene otra dimensión hoy.
 */
@ApiTags('admin-catalogs-services')
@ApiBearerAuth()
@Roles('SECURITY_ADMIN')
@Controller('admin/catalogs/services')
export class AdminServiceCatalogController {
  constructor(private readonly service: AdminServiceCatalogService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar servicios de la organización, filtrable por tipo',
  })
  list(
    @Query() query: AdminListServicesQueryDto,
  ): Promise<AdminServicePageDto> {
    return this.service.list(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ver un servicio con su versión' })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<AdminServiceItemDto> {
    return this.service.get(id);
  }

  @Audited({
    action: 'ADMIN_SERVICE_CATALOG_CREATED',
    entity: 'service_catalog',
    entityId: 'result.id',
  })
  @Post()
  @ApiOperation({
    summary: 'Crear un servicio (idempotente por práctica y código)',
  })
  async create(
    @Body() dto: AdminCreateServiceDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminServiceItemDto> {
    const { item, created } = await this.service.create(dto, actor);
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return item;
  }

  @Audited({
    action: 'ADMIN_SERVICE_CATALOG_UPDATED',
    entity: 'service_catalog',
    entityId: 'param:id',
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Editar un servicio con precondición de versión' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateServiceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminServiceItemDto> {
    return this.service.update(id, dto, actor);
  }

  @Audited({
    action: 'ADMIN_SERVICE_CATALOG_DEACTIVATED',
    entity: 'service_catalog',
    entityId: 'param:id',
  })
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desactivar un servicio (no se borra)' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminServiceStateChangeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminServiceItemDto> {
    return this.service.setActive(id, false, dto.expectedRowVersion, actor);
  }

  @Audited({
    action: 'ADMIN_SERVICE_CATALOG_REACTIVATED',
    entity: 'service_catalog',
    entityId: 'param:id',
  })
  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivar un servicio desactivado' })
  reactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminServiceStateChangeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminServiceItemDto> {
    return this.service.setActive(id, true, dto.expectedRowVersion, actor);
  }
}
