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
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  ParseOptionalLimitPipe,
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
  PracticeOrganizationReadService,
  HealthcareServiceOffersService,
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
  MedicalOrganizationConsoleDto,
  ListPracticeRoleAssignmentsResponseDto,
  UpdateHealthcareServiceDto,
} from '../dto';
import {
  HealthcareServiceOfferDto,
  HealthcareServiceOffersResponseDto,
} from '../dto/healthcare-service-offer.dto';

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
   * @param organizationReadService - Lectura completa de la organización (C13).
   */
  constructor(
    private readonly sitesService: PracticeSitesService,
    private readonly accreditationsService: PracticeAccreditationsService,
    private readonly structureService: ClinicalStructureService,
    private readonly settingsService: PracticeSettingsService,
    private readonly workforceService: PracticeWorkforceService,
    private readonly inventoryService: PracticeInventoryService,
    private readonly organizationReadService: PracticeOrganizationReadService,
    private readonly offersService: HealthcareServiceOffersService,
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
  @ApiOperation({
    summary: 'Listar las prácticas activas del tenant',
    description:
      'Sin `@Roles`: el servicio autoriza por rol clínico o por ser OWNER/ADMIN de la organización (A-6). Un PRACTITIONER sólo recibe las prácticas donde tiene una vinculación ACTIVE; quien administra la organización recibe todas las suyas.',
  })
  listPractices(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PracticeSummaryDto[]> {
    return this.sitesService.listPractices(requireTenantId(), actor);
  }

  /**
   * El árbol completo de una organización médica — CARRIL 13.
   *
   * Sedes, áreas, infraestructura, servicios, plantilla, documentación legal e
   * inventario en una sola lectura. Existe porque el módulo tenía once
   * escrituras y tres lecturas: se podían dar de alta quirófanos, áreas,
   * servicios y personal, y ninguna operación los volvía a mencionar.
   *
   * Los roles son los mismos que ya admite `GET /practices`: quien puede
   * enumerar las prácticas del tenant puede ver la estructura de la suya. El
   * aislamiento real lo hace el servicio, que responde 404 ante una práctica de
   * otra organización o, para un `PRACTITIONER`, sin vinculación ACTIVE.
   */
  @Get(':practiceId/organization')
  @Roles(
    'SECURITY_ADMIN',
    'PERIOP_ADMIN',
    'SURGERY_SCHEDULER',
    'SCHEDULING_ADMIN',
    'PRACTITIONER',
    'CLINICIAN',
    'ACCOUNTING_APPROVER',
  )
  @ApiOperation({
    summary: 'Consola de organización médica: estructura, plantilla y legajo',
  })
  getOrganizationConsole(
    @Param('practiceId', ParseUUIDPipe) practiceId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicalOrganizationConsoleDto> {
    return this.organizationReadService.getConsole(
      practiceId,
      requireTenantId(),
      actor,
    );
  }

  /**
   * Sedes de una práctica.
   *
   * Sin `@Roles`: lee quien tiene un rol de programación o clínica y quien
   * administra la organización dueña (A-6), que decide el servicio. Un `@Roles`
   * global no ve la membresía y le cerraba la puerta al dueño del centro.
   */
  @Get(':practiceId/sites')
  @ApiOperation({ summary: 'Listar las sedes de una práctica' })
  listSites(
    @Param('practiceId', ParseUUIDPipe) practiceId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteSummaryDto[]> {
    return this.sitesService.listSites(practiceId, requireTenantId(), actor);
  }

  /**
   * Vinculaciones profesional-organización de la práctica, paginadas por
   * cursor (CV-14). Antes de esto, `POST …/role-assignments/:roleId/approve`
   * existía sin ninguna forma de ver qué había pendiente: el administrador
   * tenía que conseguir el uuid por otro canal. Sin `@Roles`: la ve quien
   * administra esa organización (A-6), que decide el servicio.
   */
  @Get(':practiceId/role-assignments')
  @ApiOperation({
    summary: 'Listar las vinculaciones profesional-organización de la práctica',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Concepto de estado (p. ej. la vinculación pendiente)',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor opaco devuelto por la página anterior',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Vinculaciones por página',
  })
  listRoleAssignments(
    @Param('practiceId', ParseUUIDPipe) practiceId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('status') statusConceptId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListPracticeRoleAssignmentsResponseDto> {
    return this.workforceService.listPracticeAssignments(practiceId, actor, {
      statusConceptId,
      cursor,
      limit,
    });
  }

  @Audited({
    action: 'PRACTICE_CREATED',
    entity: 'practice',
    entityId: 'result.id',
  })
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
  @Audited({
    action: 'PRACTICE_SITE_CREATED',
    entity: 'practice_site',
    entityId: 'result.id',
  })
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
  @Audited({
    action: 'PRACTICE_SITE_DECOMMISSIONED',
    entity: 'practice_site',
    entityId: 'param:siteId',
  })
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
  @Audited({
    action: 'PRACTICE_ACCREDITATION_CREATED',
    entity: 'practice_accreditation',
    entityId: 'result.id',
  })
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

  /**
   * UC-14-06. Sin `@Roles`: lo publica quien administra **esa** organización
   * (A-6) o un rol de plataforma, y eso lo decide el servicio por la membresía.
   */
  @Audited({
    action: 'HEALTHCARE_SERVICE_PUBLISHED',
    entity: 'healthcare_service',
    entityId: 'result.id',
  })
  @Post(':practiceId/healthcare-services')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar un procedimiento del nomenclador en una sede',
    description:
      'El concepto debe ser del nomenclador (`VS_BO_MEDICAL_PROCEDURE`) y coincidir con el del ítem de catálogo que fija el precio. Una sede no puede ofrecer dos veces el mismo procedimiento (409).',
  })
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

  /** Lo que la práctica ofrece del nomenclador, con precio y referencia. */
  @Get(':practiceId/healthcare-services')
  @ApiOperation({
    summary: 'Listar los procedimientos que ofrecen las sedes de la práctica',
  })
  @ApiQuery({
    name: 'practiceSiteId',
    required: false,
    description: 'Solo la oferta de esa sede',
  })
  @ApiOkResponse({ type: HealthcareServiceOffersResponseDto })
  listHealthcareServices(
    @Param('practiceId', ParseUUIDPipe) practiceId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('practiceSiteId', new ParseUUIDPipe({ optional: true }))
    practiceSiteId?: string,
  ): Promise<HealthcareServiceOffersResponseDto> {
    return this.offersService.listOffers(practiceId, practiceSiteId, actor);
  }

  /** Cambia el precio de la sede o activa/desactiva el procedimiento. */
  @Audited({
    action: 'HEALTHCARE_SERVICE_UPDATED',
    entity: 'healthcare_service',
    entityId: 'param:id',
  })
  @Patch(':practiceId/healthcare-services/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar el precio o el estado de un procedimiento de la sede',
  })
  @ApiOkResponse({ type: HealthcareServiceOfferDto })
  updateHealthcareService(
    @Param('practiceId', ParseUUIDPipe) practiceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHealthcareServiceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<HealthcareServiceOfferDto> {
    return this.offersService.updateOffer(practiceId, id, dto, actor);
  }

  /** UC-14-07. */
  @Audited({
    action: 'PRACTICE_SETTING_UPSERTED',
    entity: 'practice_setting',
    entityId: 'result.id',
  })
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
  @Audited({
    action: 'PRACTITIONER_ROLE_ASSIGNED',
    entity: 'practitioner_role_assignment',
    entityId: 'result.id',
  })
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
  @Audited({
    action: 'PRACTITIONER_ROLE_SELF_REQUESTED',
    entity: 'practitioner_role_assignment',
    entityId: 'result.id',
  })
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
  @Audited({
    action: 'PRACTICE_INVENTORY_ITEM_CREATED',
    entity: 'inventory_item',
    entityId: 'result.id',
  })
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
