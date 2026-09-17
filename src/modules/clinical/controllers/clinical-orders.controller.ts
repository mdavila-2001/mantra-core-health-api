import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { DiagnosticReportsService, ServiceRequestsService } from '../services';
import {
  CheckDuplicateStudyDto,
  CreateDiagnosticReportDto,
  CreateServiceRequestDto,
  DiagnosticReportResponseDto,
  DuplicateStudyCheckResultDto,
  ReleaseDiagnosticReportDto,
  ServiceRequestResponseDto,
} from '../dto';

/** Endpoints de órdenes clínicas: peticiones de servicio y reportes diagnósticos. */
@ApiTags('clinical-orders')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('clinical')
export class ClinicalOrdersController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param serviceRequestsService - Valor de service requests service requerido por la operación.
   * @param diagnosticReportsService - Valor de diagnostic reports service requerido por la operación.
   */
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
    private readonly diagnosticReportsService: DiagnosticReportsService,
  ) {}

  /**
   * Antiduplicación de estudios (T-26, subtarea 3.2). Va declarada ANTES de
   * `service-requests` a propósito: Express no la confundiría con un `:id`
   * (este controller no tiene ninguno), pero el orden documenta la relación
   * — es la pre-validación del alta de abajo.
   */
  @Post('service-requests/duplicate-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Pre-validar si el paciente ya se hizo este estudio en la ventana (antiduplicación · T-26)',
  })
  checkDuplicateStudy(
    @Body() dto: CheckDuplicateStudyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DuplicateStudyCheckResultDto> {
    return this.serviceRequestsService.checkDuplicate(dto, actor);
  }

  /** UC-08-05. */
  @Post('service-requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una orden de servicio' })
  createServiceRequest(
    @Body() dto: CreateServiceRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ServiceRequestResponseDto> {
    return this.serviceRequestsService.create(dto, actor);
  }

  /** UC-08-06. */
  @Post('diagnostic-reports')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir un reporte diagnóstico desde la orden' })
  createDiagnosticReport(
    @Body() dto: CreateDiagnosticReportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DiagnosticReportResponseDto> {
    return this.diagnosticReportsService.create(dto, actor);
  }

  /** UC-08-07. */
  @Post('diagnostic-reports/:id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liberar los resultados de un reporte diagnóstico' })
  releaseDiagnosticReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReleaseDiagnosticReportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DiagnosticReportResponseDto> {
    return this.diagnosticReportsService.release(id, dto, actor);
  }
}
