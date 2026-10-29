import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { requireTenantId } from '../../../common';
import type { SampleCollectionPointView } from '../../practice/dto/sample-collection-point.types';
import { LabStaffGuard } from '../guards';
import { DiagnosticsSamplePointsService } from '../services';

/**
 * Puntos de toma de muestras de una sede (F5b): lo que ofrecen la orden de laboratorio
 * y la recepción. Lo lee quien puede pedir u operar el laboratorio del tenant
 * (`LabStaffGuard`: personal clínico y personal del laboratorio); la sede tiene que ser
 * del tenant del contexto.
 */
@ApiTags('diagnostics-sample-points')
@ApiBearerAuth()
@UseGuards(LabStaffGuard)
@Controller()
export class DiagnosticsSamplePointsController {
  /**
   * @param service - Lectura de los puntos de toma.
   */
  constructor(private readonly service: DiagnosticsSamplePointsService) {}

  /** Puntos de toma activos y disponibles de la sede. */
  @Get('sites/:siteId/sample-collection-points')
  @ApiOperation({
    summary: 'Puntos de toma de muestras que se ofrecen en una sede',
    description:
      'Solo los activos, disponibles y listos (un punto bloqueado o en limpieza no se ofrece). Cada uno lleva su estado operativo de F2, sin datos de paciente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Sede de otro tenant o inexistente',
  })
  list(
    @Param('siteId', ParseUUIDPipe) siteId: string,
  ): Promise<SampleCollectionPointView[]> {
    return this.service.list(requireTenantId(), siteId);
  }
}
