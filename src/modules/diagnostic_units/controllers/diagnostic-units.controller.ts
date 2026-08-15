import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  DiagnosticUnitsService,
  DiagnosticStudiesService,
  DiagnosticPricingService,
  DiagnosticUnitsReadService,
  DiagnosticUnitsAdminReadService,
} from '../services';
import {
  AccreditationResponseDto,
  AddSiteDto,
  AssignmentResponseDto,
  CreateAccreditationDto,
  CreateDiagnosticUnitDto,
  CreatePractitionerAssignmentDto,
  CreatePriceScheduleDto,
  CreateStudyOfferingDto,
  DiagnosticUnitResponseDto,
  DiagnosticUnitDetailDto,
  DiagnosticUnitDirectoryResponseDto,
  DiagnosticUnitAdminDetailDto,
  DiagnosticUnitAdminListDto,
  PriceScheduleResponseDto,
  ReprojectResultDto,
  SetSpecialtiesDto,
  SiteResponseDto,
  SpecialtiesResultDto,
  StudyOfferingResponseDto,
} from '../dto';

/**
 * Endpoints sobre `/diagnostic-units`. Capa fina: valida parámetros y delega en
 * el servicio de dominio correspondiente. Todas las operaciones son
 * administrativas (`SECURITY_ADMIN`).
 */
@ApiTags('diagnostic-units')
@ApiBearerAuth()
@Controller('diagnostic-units')
export class DiagnosticUnitsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param unitsService - Valor de units service requerido por la operación.
   * @param studiesService - Valor de studies service requerido por la operación.
   * @param pricingService - Valor de pricing service requerido por la operación.
   * @param readService - Lecturas del directorio público.
   * @param adminReadService - Lecturas de la consola de administración (C16).
   */
  constructor(
    private readonly unitsService: DiagnosticUnitsService,
    private readonly studiesService: DiagnosticStudiesService,
    private readonly pricingService: DiagnosticPricingService,
    private readonly readService: DiagnosticUnitsReadService,
    private readonly adminReadService: DiagnosticUnitsAdminReadService,
  ) {}

  /** Directorio publicado del tenant activo. */
  @Get()
  @ApiOperation({ summary: 'Listar unidades diagnósticas publicadas' })
  @ApiOkResponse({ type: DiagnosticUnitDirectoryResponseDto })
  list(): Promise<DiagnosticUnitDirectoryResponseDto> {
    return this.readService.list();
  }

  /**
   * Consola de administración: **todas** las unidades del tenant — CARRIL 16.
   *
   * Va declarada **antes** de `@Get(':id')` a propósito. El router de Nest
   * prueba en orden de declaración y ese parámetro lleva `ParseUUIDPipe`:
   * declarada después, `administration` entraría por la ruta del parámetro y el
   * pipe respondería 400 en vez de servir el listado.
   *
   * A diferencia del directorio, no filtra por publicación: quien administra
   * necesita ver el borrador que todavía no publicó — que es justamente lo que
   * el directorio esconde.
   */
  @Get('administration')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar las unidades del tenant, publicadas o no',
  })
  @ApiOkResponse({ type: DiagnosticUnitAdminListDto })
  listForAdministration(): Promise<DiagnosticUnitAdminListDto> {
    return this.adminReadService.list();
  }

  /** Perfil publicado; el servicio acota el id al tenant activo. */
  @Get(':id')
  @ApiOperation({ summary: 'Consultar el perfil de una unidad diagnóstica' })
  @ApiOkResponse({ type: DiagnosticUnitDetailDto })
  getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DiagnosticUnitDetailDto> {
    return this.readService.getById(id);
  }

  /**
   * Ficha administrativa completa de una unidad — CARRIL 16.
   *
   * Sedes, equipamiento con su calibración, catálogo de estudios con todos sus
   * precios —también los de cronogramas internos—, legajo y personal con sus
   * permisos de validación y firma. Una unidad de otro tenant responde el mismo
   * 404 que una inexistente.
   */
  @Get(':id/administration')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Consola de administración de una unidad diagnóstica',
  })
  @ApiOkResponse({ type: DiagnosticUnitAdminDetailDto })
  getForAdministration(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DiagnosticUnitAdminDetailDto> {
    return this.adminReadService.getById(id);
  }

  /** UC-23-01. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Alta de unidad diagnóstica con sitios y acreditaciones',
  })
  create(
    @Body() dto: CreateDiagnosticUnitDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DiagnosticUnitResponseDto> {
    return this.unitsService.create(dto, actor);
  }

  /** UC-23-02. */
  @Post(':id/sites')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un sitio operativo de la unidad' })
  addSite(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddSiteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteResponseDto> {
    return this.unitsService.addSite(id, dto, actor);
  }

  /** UC-23-03. */
  @Post(':id/verify-and-publish')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar la unidad y publicar su perfil público' })
  verifyAndPublish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DiagnosticUnitResponseDto> {
    return this.unitsService.verifyAndPublish(id, actor);
  }

  /** UC-23-04. */
  @Put(':id/specialties')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Declarar las especialidades de la unidad' })
  setSpecialties(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetSpecialtiesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SpecialtiesResultDto> {
    return this.unitsService.setSpecialties(id, dto, actor);
  }

  /** UC-23-05. */
  @Post(':id/study-offerings')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar oferta de estudio con componentes (panel)',
  })
  createOffering(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateStudyOfferingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StudyOfferingResponseDto> {
    return this.studiesService.createOffering(id, dto, actor);
  }

  /** UC-23-06. */
  @Post(':id/price-schedules')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un cronograma de precios' })
  createSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePriceScheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PriceScheduleResponseDto> {
    return this.pricingService.createSchedule(id, dto, actor);
  }

  /** UC-23-10. */
  @Post(':id/practitioner-assignments')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Asignar un especialista a la unidad/sitio' })
  assignPractitioner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePractitionerAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AssignmentResponseDto> {
    return this.unitsService.assignPractitioner(id, dto, actor);
  }

  /** UC-23-11. */
  @Post(':id/accreditations')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una acreditación con evidencia' })
  addAccreditation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAccreditationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccreditationResponseDto> {
    return this.unitsService.addAccreditation(id, dto, actor);
  }

  /** UC-23-12. */
  @Post(':id/reproject')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reconstruir la proyección del perfil público' })
  reproject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReprojectResultDto> {
    return this.unitsService.reproject(id, actor);
  }
}
