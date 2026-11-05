import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Audited, CurrentUser, type AuthenticatedUser } from '../../../common';
import { LabStaffGuard } from '../../diagnostics/guards';
import {
  LabCategoryNameDto,
  LabImportDto,
  LabServiceQueryDto,
} from '../dto/lab-portal-requests.dto';
import {
  LabCategoryDto,
  LabCategoryPageDto,
  LabImportResultDto,
  LabServiceDto,
  LabServicePageDto,
} from '../dto/lab-portal-responses.dto';
import {
  LabServiceChangesDto,
  LabServiceDraftDto,
} from '../dto/lab-portal-service.dto';
import { LabPortalCatalogService } from '../services/lab-portal-catalog.service';
import { LabPortalCategoriesService } from '../services/lab-portal-categories.service';
import { LabPortalImportService } from '../services/lab-portal-import.service';
import { LabPortalStudyCatalogService } from '../services/lab-portal-study-catalog.service';
import {
  LabCatalogDto,
  LabCatalogImportDto,
  LabCatalogImportResultDto,
} from '../dto/lab-portal-catalog.dto';

/**
 * Lab portal catalog ("Precios"): services, categories and bulk import of the
 * active tenant's diagnostic unit. No route carries a lab id: the unit is the
 * one of `X-Tenant-Id`.
 *
 * Same guard as the specimen reception (`LabStaffGuard`): active membership in
 * a DIAGNOSTIC_CENTER tenant (any membership role), plus the clinical roles
 * and SUPERADMIN it already admits. The owner of a registered lab has no
 * platform role, so `@Roles('SECURITY_ADMIN')` would lock them out.
 */
@ApiTags('diagnostics-lab-portal')
@ApiBearerAuth()
@UseGuards(LabStaffGuard)
@Controller('diagnostics/lab')
export class LabPortalServicesController {
  /**
   * @param catalog - Catalog reads and writes.
   * @param categories - Service categories of the lab.
   * @param importer - Bulk import.
   * @param studyCatalog - Study catalog browsing and import (proceso 4.2).
   */
  constructor(
    private readonly catalog: LabPortalCatalogService,
    private readonly categories: LabPortalCategoriesService,
    private readonly importer: LabPortalImportService,
    private readonly studyCatalog: LabPortalStudyCatalogService,
  ) {}

  @Get('catalog')
  @ApiOperation({
    summary: 'Catálogo de análisis (LOINC) con componentes y precio sugerido',
  })
  @ApiOkResponse({ type: LabCatalogDto })
  studyCatalogItems(): Promise<LabCatalogDto> {
    return this.studyCatalog.catalog();
  }

  @Audited({
    action: 'LAB_CATALOG_IMPORTED',
    entity: 'diagnostic_study_offering',
  })
  @Post('catalog/import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Sumar análisis del catálogo, con sus componentes y precio sugerido',
  })
  @ApiOkResponse({ type: LabCatalogImportResultDto })
  importCatalog(
    @Body() dto: LabCatalogImportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LabCatalogImportResultDto> {
    return this.studyCatalog.importCatalog(dto, actor);
  }

  @Get('services')
  @ApiOperation({ summary: 'Catálogo de servicios del laboratorio' })
  @ApiOkResponse({ type: LabServicePageDto })
  listServices(@Query() query: LabServiceQueryDto): Promise<LabServicePageDto> {
    return this.catalog.list(query);
  }

  @Audited({
    action: 'LAB_SERVICE_CREATED',
    entity: 'diagnostic_study_offering',
    entityId: 'result.id',
  })
  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dar de alta un servicio con su precio' })
  @ApiOkResponse({ type: LabServiceDto })
  createService(
    @Body() draft: LabServiceDraftDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LabServiceDto> {
    return this.catalog.create(draft, actor);
  }

  @Audited({
    action: 'LAB_SERVICES_IMPORTED',
    entity: 'diagnostic_study_offering',
  })
  @Post('services/import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Carga masiva por código, fila por fila' })
  @ApiOkResponse({ type: LabImportResultDto })
  importServices(
    @Body() dto: LabImportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LabImportResultDto> {
    return this.importer.import(dto, actor);
  }

  @Audited({
    action: 'LAB_SERVICE_UPDATED',
    entity: 'diagnostic_study_offering',
    entityId: 'param:id',
  })
  @Patch('services/:id')
  @ApiOperation({
    summary: 'Editar un servicio (un precio nuevo es una versión nueva)',
  })
  @ApiOkResponse({ type: LabServiceDto })
  updateService(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changes: LabServiceChangesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LabServiceDto> {
    return this.catalog.update(id, changes, actor);
  }

  @Audited({
    action: 'LAB_SERVICE_WITHDRAWN',
    entity: 'diagnostic_study_offering',
    entityId: 'param:id',
  })
  @Delete('services/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirar un servicio (no se borra)' })
  @ApiOkResponse({ type: LabServiceDto })
  withdrawService(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LabServiceDto> {
    return this.catalog.withdraw(id, actor);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Categorías del laboratorio, con su conteo' })
  @ApiOkResponse({ type: LabCategoryPageDto })
  listCategories(): Promise<LabCategoryPageDto> {
    return this.categories.list();
  }

  @Audited({
    action: 'LAB_CATEGORY_CREATED',
    entity: 'diagnostic_service_category',
    entityId: 'result.id',
  })
  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Crear una categoría (409 si el nombre ya existe, sin importar mayúsculas)',
  })
  @ApiOkResponse({ type: LabCategoryDto })
  createCategory(
    @Body() dto: LabCategoryNameDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LabCategoryDto> {
    return this.categories.create(dto.name, actor);
  }

  @Audited({
    action: 'LAB_CATEGORY_RENAMED',
    entity: 'diagnostic_service_category',
    entityId: 'param:id',
  })
  @Patch('categories/:id')
  @ApiOperation({
    summary: 'Renombrar una categoría (409 si el nombre ya existe)',
  })
  @ApiOkResponse({ type: LabCategoryDto })
  renameCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LabCategoryNameDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LabCategoryDto> {
    return this.categories.rename(id, dto.name, actor);
  }

  @Audited({
    action: 'LAB_CATEGORY_DELETED',
    entity: 'diagnostic_service_category',
    entityId: 'param:id',
  })
  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Eliminar una categoría (409 mientras agrupe servicios no retirados)',
  })
  deleteCategory(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ ok: true }> {
    return this.categories.remove(id);
  }
}
