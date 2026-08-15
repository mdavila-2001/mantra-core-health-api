import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  AddPharmacovigilanceActionDto,
  CreatePharmacovigilanceReportDto,
  CreatedResourceDto,
  TransitionResultDto,
} from '../dto';
import type {
  PharmacovigilanceActions,
  PharmacovigilanceReports,
} from '../entities';
import { PharmacovigilanceService } from '../services';

/**
 * Farmacovigilancia (UC-17-29, UC-17-30).
 *
 * El alta la puede ejecutar quien detecta el evento —doctor, farmacia u
 * organización—; la lectura y el seguimiento quedan acotados al personal
 * autorizado del laboratorio (spec 5594). El visitador **no** figura en ninguno
 * de los dos lados: la spec prohíbe el uso comercial de estos datos.
 */
@ApiTags('pharma-lab-pharmacovigilance')
@ApiBearerAuth()
@Controller('pharma-labs/:pharmaLabId/pharmacovigilance')
export class PharmacovigilanceController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Casos de uso de farmacovigilancia.
   */
  constructor(private readonly service: PharmacovigilanceService) {}

  /** UC-17-29. */
  @Post('reports')
  @HttpCode(HttpStatus.CREATED)
  @Roles(
    'PRACTITIONER',
    'CLINICIAN',
    'PHARMACOVIGILANCE_OFFICER',
    'PHARMA_LAB_ADMIN',
    'BUSINESS_ADMIN',
  )
  @ApiOperation({ summary: 'Enviar un reporte de farmacovigilancia' })
  createReport(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Body() dto: CreatePharmacovigilanceReportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createReport(pharmaLabId, dto, actor);
  }

  /** Bandeja de reportes del laboratorio. */
  @Get('reports')
  @Roles('PHARMACOVIGILANCE_OFFICER', 'PHARMA_LAB_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar los reportes del laboratorio' })
  listReports(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
  ): Promise<PharmacovigilanceReports[]> {
    return this.service.listReports(pharmaLabId);
  }

  /** Detalle con trazabilidad completa. */
  @Get('reports/:reportId')
  @Roles('PHARMACOVIGILANCE_OFFICER', 'PHARMA_LAB_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Consultar un reporte con su trazabilidad' })
  getReport(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
  ): Promise<{
    /** El reporte. */
    report: PharmacovigilanceReports;
    /** Acciones en orden cronológico. */
    actions: PharmacovigilanceActions[];
  }> {
    return this.service.getReportDetail(pharmaLabId, reportId);
  }

  /** UC-17-30. */
  @Post('reports/:reportId/actions')
  @HttpCode(HttpStatus.CREATED)
  @Roles('PHARMACOVIGILANCE_OFFICER', 'PHARMA_LAB_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Registrar una acción de seguimiento' })
  addAction(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: AddPharmacovigilanceActionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.addAction(pharmaLabId, reportId, dto, actor);
  }
}
