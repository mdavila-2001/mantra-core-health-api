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
   */
  constructor(
    private readonly unitsService: DiagnosticUnitsService,
    private readonly studiesService: DiagnosticStudiesService,
    private readonly pricingService: DiagnosticPricingService,
    private readonly readService: DiagnosticUnitsReadService,
  ) {}

  /** Directorio publicado del tenant activo. */
  @Get()
  @ApiOperation({ summary: 'Listar unidades diagnósticas publicadas' })
  @ApiOkResponse({ type: DiagnosticUnitDirectoryResponseDto })
  list(): Promise<DiagnosticUnitDirectoryResponseDto> {
    return this.readService.list();
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
