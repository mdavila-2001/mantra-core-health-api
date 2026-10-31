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
  AdminServiceItemDto,
  AdminServiceListQueryDto,
  AdminServicePageDto,
  AdminServiceScopesDto,
  AdminServiceToggleDto,
  AdminUpdateServiceDto,
} from '../dto/admin-service-catalog.dto';
import { AdminServiceCatalogService } from '../services/admin-service-catalog.service';

/**
 * Editor de catálogos globales · Servicios. Administración de la organización
 * (`SECURITY_ADMIN`; `SUPERADMIN` entra por comodín). Sin `DELETE`: se desactiva.
 * La autoridad es esta API: el menú del front sólo orienta.
 */
@ApiTags('admin-catalogs')
@ApiBearerAuth()
@Roles('SECURITY_ADMIN')
@Controller('admin/catalogs/services')
export class AdminServiceCatalogController {
  constructor(private readonly services: AdminServiceCatalogService) {}

  // `scopes` se declara antes de `:id` para que no se lea como un identificador.
  @Get('scopes')
  @ApiOperation({
    summary:
      'Tipos de organización, prácticas y monedas del editor de servicios',
  })
  scopes(): Promise<AdminServiceScopesDto> {
    return this.services.scopes();
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar servicios por tipo de organización (cursor, orden code/id)',
  })
  list(@Query() query: AdminServiceListQueryDto): Promise<AdminServicePageDto> {
    return this.services.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Un servicio de la organización (404 si es de otra)',
  })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<AdminServiceItemDto> {
    return this.services.get(id);
  }

  @Audited({
    action: 'ADMIN_SERVICE_CATALOG_CREATED',
    entity: 'service_catalog',
    entityId: 'result.id',
  })
  @Post()
  @ApiOperation({
    summary: 'Crear un servicio (idempotente por práctica y código)',
    description:
      '201 al crear; 200 si es la repetición idéntica de un alta ya hecha.',
  })
  async create(
    @Body() dto: AdminCreateServiceDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminServiceItemDto> {
    const { item, created } = await this.services.create(dto, actor);
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
  @ApiOperation({
    summary:
      'Editar un servicio con versión optimista (409 si otra persona lo cambió)',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateServiceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminServiceItemDto> {
    return this.services.update(id, dto, actor);
  }

  @Audited({
    action: 'ADMIN_SERVICE_CATALOG_DEACTIVATED',
    entity: 'service_catalog',
    entityId: 'param:id',
  })
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desactivar (no borra). Idempotente.' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminServiceToggleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminServiceItemDto> {
    return this.services.setActive(id, dto.expectedRowVersion, false, actor);
  }

  @Audited({
    action: 'ADMIN_SERVICE_CATALOG_REACTIVATED',
    entity: 'service_catalog',
    entityId: 'param:id',
  })
  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivar. Idempotente.' })
  reactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminServiceToggleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminServiceItemDto> {
    return this.services.setActive(id, dto.expectedRowVersion, true, actor);
  }
}
