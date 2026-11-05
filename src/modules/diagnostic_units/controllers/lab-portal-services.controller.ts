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
import {
  Audited,
  CurrentUser,
  NotAudited,
  type AuthenticatedUser,
} from '../../../common';

const NO_CATEGORY_WRITE =
  'Never writes: the model has no lab categories table, the route answers 422/404.';
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
import { LabPortalImportService } from '../services/lab-portal-import.service';

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
   * @param importer - Bulk import.
   */
  constructor(
    private readonly catalog: LabPortalCatalogService,
    private readonly importer: LabPortalImportService,
  ) {}

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
  @ApiOperation({ summary: 'Categorías del laboratorio' })
  @ApiOkResponse({ type: LabCategoryPageDto })
  listCategories(): Promise<LabCategoryPageDto> {
    return this.catalog.listCategories();
  }

  @NotAudited(NO_CATEGORY_WRITE)
  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una categoría (422: el modelo no tiene dónde guardarla)',
  })
  @ApiOkResponse({ type: LabCategoryDto })
  createCategory(@Body() _dto: LabCategoryNameDto): Promise<LabCategoryDto> {
    return this.catalog.createCategory();
  }

  @NotAudited(NO_CATEGORY_WRITE)
  @Patch('categories/:id')
  @ApiOperation({ summary: 'Renombrar una categoría' })
  @ApiOkResponse({ type: LabCategoryDto })
  renameCategory(
    @Param('id', ParseUUIDPipe) _id: string,
    @Body() _dto: LabCategoryNameDto,
  ): Promise<LabCategoryDto> {
    return this.catalog.categoryNotFound();
  }

  @NotAudited(NO_CATEGORY_WRITE)
  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar una categoría' })
  deleteCategory(
    @Param('id', ParseUUIDPipe) _id: string,
  ): Promise<{ ok: boolean }> {
    return this.catalog.categoryNotFound();
  }
}
