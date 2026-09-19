import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ClinicalRecordAccessGuard } from '../guards';
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

/**
 * Endpoints de órdenes clínicas: peticiones de servicio y reportes diagnósticos.
 *
 * SEC-01: llevan el guard del expediente las dos altas cuyo `patientProfileId`
 * viaja en el cuerpo. `service-requests/duplicate-check` **no** lo lleva a
 * propósito: no persiste nada y ya pasa por la misma política dentro de
 * `ServiceRequestsService.checkDuplicate`, así que montarlo duplicaría la
 * consulta de autorización sin cambiar ninguna respuesta.
 * `diagnostic-reports/:id/release` tampoco: su paciente sale del reporte ya
 * cargado, y lo autoriza el servicio (MCH-007).
 */
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
  @UseGuards(ClinicalRecordAccessGuard)
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
  @UseGuards(ClinicalRecordAccessGuard)
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
