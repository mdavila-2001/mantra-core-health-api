import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  PracticeSitesService,
  PracticeAccreditationsService,
  ClinicalStructureService,
  PracticeSettingsService,
  PracticeWorkforceService,
  PracticeInventoryService,
} from '../services';
import {
  CreatePracticeDto,
  CreateSiteDto,
  CreateAccreditationDto,
  CreateHealthcareServiceDto,
  UpsertSettingDto,
  CreateRoleAssignmentDto,
  CreateInventoryItemDto,
  PracticeResponseDto,
  SiteResponseDto,
  AccreditationResponseDto,
  HealthcareServiceResponseDto,
  SettingResponseDto,
  RoleAssignmentResponseDto,
  InventoryItemResponseDto,
  StatusResultDto,
} from '../dto';

/**
 * Endpoints con raíz en `/practices`. Capa fina: valida parámetros y delega en el
 * servicio de dominio correspondiente. Operaciones administrativas exigen rol
 * `SECURITY_ADMIN` (guard global de auth + roles).
 */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('practices')
export class PracticesController {
  constructor(
    private readonly sitesService: PracticeSitesService,
    private readonly accreditationsService: PracticeAccreditationsService,
    private readonly structureService: ClinicalStructureService,
    private readonly settingsService: PracticeSettingsService,
    private readonly workforceService: PracticeWorkforceService,
    private readonly inventoryService: PracticeInventoryService,
  ) {}

  /** Bootstrap: alta de la práctica (organización raíz). */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dar de alta una práctica (organización raíz)' })
  createPractice(
    @Body() dto: CreatePracticeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PracticeResponseDto> {
    return this.sitesService.createPractice(dto, actor);
  }

  /** UC-14-01. */
  @Post(':practiceId/sites')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dar de alta un sitio de práctica' })
  createSite(
    @Param('practiceId', ParseUUIDPipe) practiceId: string,
    @Body() dto: CreateSiteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteResponseDto> {
    return this.sitesService.createSite(practiceId, dto, actor);
  }

  /** UC-14-12. */
  @Delete(':practiceId/sites/:siteId')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desmantelar un sitio en cascada (soft-delete)' })
  decommissionSite(
    @Param('practiceId', ParseUUIDPipe) practiceId: string,
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.sitesService.decommissionSite(practiceId, siteId, actor);
  }

  /** UC-14-02. */
  @Post(':practiceId/accreditations')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una acreditación con evidencia' })
  createAccreditation(
    @Param('practiceId', ParseUUIDPipe) practiceId: string,
    @Body() dto: CreateAccreditationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccreditationResponseDto> {
    return this.accreditationsService.create(practiceId, dto, actor);
  }

  /** UC-14-06. */
  @Post(':practiceId/healthcare-services')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar un servicio de salud' })
  publishHealthcareService(
    @Param('practiceId', ParseUUIDPipe) practiceId: string,
    @Body() dto: CreateHealthcareServiceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<HealthcareServiceResponseDto> {
    return this.structureService.publishHealthcareService(
      practiceId,
      dto,
      actor,
    );
  }

  /** UC-14-07. */
  @Put(':practiceId/settings/:settingKey')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configurar un ajuste de práctica (upsert)' })
  upsertSetting(
    @Param('practiceId', ParseUUIDPipe) practiceId: string,
    @Param('settingKey') settingKey: string,
    @Body() dto: UpsertSettingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SettingResponseDto> {
    return this.settingsService.upsert(practiceId, settingKey, dto, actor);
  }

  /** UC-14-08. */
  @Post(':practiceId/role-assignments')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Asignar un rol de profesional a sitio/unidad/servicio',
  })
  assignRole(
    @Param('practiceId', ParseUUIDPipe) practiceId: string,
    @Body() dto: CreateRoleAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RoleAssignmentResponseDto> {
    return this.workforceService.assignRole(practiceId, dto, actor);
  }

  /** UC-14-10. */
  @Post(':practiceId/inventory-items')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dar de alta un insumo de inventario de práctica' })
  createInventoryItem(
    @Param('practiceId', ParseUUIDPipe) practiceId: string,
    @Body() dto: CreateInventoryItemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InventoryItemResponseDto> {
    return this.inventoryService.createItem(practiceId, dto, actor);
  }
}
