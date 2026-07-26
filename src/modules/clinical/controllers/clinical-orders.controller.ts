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
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { DiagnosticReportsService, ServiceRequestsService } from '../services';
import {
  CreateDiagnosticReportDto,
  CreateServiceRequestDto,
  DiagnosticReportResponseDto,
  ReleaseDiagnosticReportDto,
  ServiceRequestResponseDto,
} from '../dto';

/** Endpoints de órdenes clínicas: peticiones de servicio y reportes diagnósticos. */
@ApiTags('clinical-orders')
@ApiBearerAuth()
@Controller('clinical')
export class ClinicalOrdersController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
    private readonly diagnosticReportsService: DiagnosticReportsService,
  ) {}

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
