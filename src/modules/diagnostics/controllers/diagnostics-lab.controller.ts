import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { LabStaffGuard } from '../guards';
import { DiagnosticsLabService } from '../services';
import {
  CreateWorkOrderDto,
  CreateAnalyzerRunDto,
  IngestAnalyzerMessageDto,
  VerifyResultDto,
  WorkOrderCreatedDto,
  ResourceCreatedDto,
  ListWorkOrdersQueryDto,
  WorkOrderSummaryDto,
} from '../dto';

/**
 * Endpoints del flujo de laboratorio: orden de trabajo (UC-20-04), corrida de
 * analizador (soporte) e ingesta de mensaje (UC-20-05) y verificación de
 * resultado (UC-20-06).
 */
@ApiTags('diagnostics-laboratory')
@ApiBearerAuth()
// Mismo guard que la recepción: la cola la opera el personal del laboratorio
// (membresía en un DIAGNOSTIC_CENTER) además de CLINICIAN/PRACTITIONER, que
// siguen pasando con la misma regla de ámbito. Con `@Roles` en la clase,
// `RolesGuard` rebotaba a la dueña del laboratorio antes de mirar su membresía.
@UseGuards(LabStaffGuard)
@Controller('diagnostics')
export class DiagnosticsLabController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: DiagnosticsLabService) {}

  /** UC-20-04. */
  /**
   * Cola de trabajo del laboratorio.
   *
   * `diagnostics` no tenía ninguna lectura: la orden creada sólo existía en la
   * respuesta de su propio POST, así que nadie podía consultar qué quedaba
   * pendiente.
   */
  @Get('work-orders')
  @ApiOperation({
    summary: 'Listar las órdenes de trabajo del laboratorio',
    description: 'Acotado siempre al tenant del contexto.',
  })
  listWorkOrders(
    @Query() query: ListWorkOrdersQueryDto,
  ): Promise<WorkOrderSummaryDto[]> {
    return this.service.listWorkOrders(requireTenantId(), query);
  }

  @Post('work-orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir orden de trabajo y desglosar pruebas' })
  createWorkOrder(
    @Body() dto: CreateWorkOrderDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<WorkOrderCreatedDto> {
    return this.service.createWorkOrder(dto, actor);
  }

  /** Soporte: abrir corrida de analizador. */
  @Post('analyzer-runs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Abrir una corrida de analizador (soporte para ingesta)',
  })
  createAnalyzerRun(
    @Body() dto: CreateAnalyzerRunDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.service.createAnalyzerRun(dto, actor);
  }

  /** UC-20-05. */
  @Post('analyzer-runs/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ingerir mensaje de resultado de analizador (LIS/HL7/ASTM)',
  })
  ingestMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: IngestAnalyzerMessageDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.service.ingestMessage(id, dto, actor);
  }

  /** UC-20-06. */
  @Post('results/:observationId/verifications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Verificar (técnica/facultativa) un resultado' })
  verifyResult(
    @Param('observationId', ParseUUIDPipe) observationId: string,
    @Body() dto: VerifyResultDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.service.verifyResult(observationId, dto, actor);
  }
}
