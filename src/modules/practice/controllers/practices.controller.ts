import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  Roles,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
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
  PracticeSummaryDto,
  SiteSummaryDto,
  SiteResponseDto,
  AccreditationResponseDto,
  HealthcareServiceResponseDto,
  SettingResponseDto,
  RoleAssignmentResponseDto,
  InventoryItemResponseDto,
  StatusResultDto,
  SelfRequestRoleAssignmentDto,
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
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param sitesService - Valor de sites service requerido por la operación.
   * @param accreditationsService - Valor de accreditations service requerido por la operación.
   * @param structureService - Valor de structure service requerido por la operación.
   * @param settingsService - Valor de settings service requerido por la operación.
   * @param workforceService - Valor de workforce service requerido por la operación.
   * @param inventoryService - Valor de inventory service requerido por la operación.
   */
  constructor(
    private readonly sitesService: PracticeSitesService,
    private readonly accreditationsService: PracticeAccreditationsService,
    private readonly structureService: ClinicalStructureService,
    private readonly settingsService: PracticeSettingsService,
    private readonly workforceService: PracticeWorkforceService,
    private readonly inventoryService: PracticeInventoryService,
  ) {}

  /** Bootstrap: alta de la práctica (organización raíz). */
  /**
   * Prácticas activas del tenant.
   *
   * Abierta a los actores clínicos y de programación, no sólo a
   * `SECURITY_ADMIN`: es el primer paso para resolver el quirófano que exige
   * programar una intervención, y sin él ese uuid había que averiguarlo fuera
   * del sistema. Sólo devuelve identificación y estado, no configuración.
   */
  @Get()
  @Roles(
    'SECURITY_ADMIN',
    'SURGERY_SCHEDULER',
    'PERIOP_ADMIN',
    'SURGEON',
    'ANESTHESIOLOGIST',
    'PERIOP_NURSE',
    'SCHEDULING_ADMIN',
    // Los roles clínicos generales, que faltaban: sin ellos un médico no puede
    // ni saber en qué práctica trabaja, y las lecturas del mayor —que cuelgan
    // todas de un `practiceId`— quedan inalcanzables para él.
    'PRACTITIONER',
    'CLINICIAN',
    'ACCOUNTING_APPROVER',
  )
  @ApiOperation({ summary: 'Listar las prácticas activas del tenant' })
  listPractices(): Promise<PracticeSummaryDto[]> {
    return this.sitesService.listPractices(requireTenantId());
  }

  /** Sedes de una práctica. */
  @Get(':practiceId/sites')
  @Roles(
    'SECURITY_ADMIN',
    'SURGERY_SCHEDULER',
    'PERIOP_ADMIN',
    'SURGEON',
    'ANESTHESIOLOGIST',
    'PERIOP_NURSE',
    'SCHEDULING_ADMIN',
  )
  @ApiOperation({ summary: 'Listar las sedes de una práctica' })
  listSites(
    @Param('practiceId', ParseUUIDPipe) practiceId: string,
  ): Promise<SiteSummaryDto[]> {
    return this.sitesService.listSites(practiceId, requireTenantId());
  }

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

  /**
   * Carril 18 — el profesional pide vincularse a la organización por su
   * cuenta; queda `PENDING` hasta que la organización la apruebe (ver
   * `/role-assignments/:roleId/approve` en `RoleAssignmentsController`).
   */
  @Post(':practiceId/role-assignments/self-request')
  @Roles('PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar la propia vinculación a una organización',
    description:
      'Autoservicio del profesional: queda PENDING hasta que la organización la apruebe, rechace, suspenda o finalice. No concede acceso a pacientes de la organización.',
  })
  selfRequestRoleAssignment(
    @Param('practiceId', ParseUUIDPipe) practiceId: string,
    @Body() dto: SelfRequestRoleAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RoleAssignmentResponseDto> {
    return this.workforceService.selfRequestAffiliation(practiceId, dto, actor);
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
