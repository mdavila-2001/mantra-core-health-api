import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audited, requireTenantId } from '../../../common';
import { LabStaffGuard } from '../guards';
import {
  DiagnosticsReceptionService,
  DiagnosticsWorklistService,
} from '../services';
import {
  LabInboxPageDto,
  LabInboxQueryDto,
  WorklistItemDto,
  WorklistPageDto,
  WorklistQueryDto,
} from '../dto';

/**
 * Recepción de muestras del laboratorio: la bandeja de órdenes dirigidas al
 * laboratorio del tenant activo. Las acciones del mostrador —recibir la
 * muestra, registrar la acesión— son los endpoints de
 * `DiagnosticsSpecimensController`, con el mismo guard.
 */
@ApiTags('diagnostics-reception')
@ApiBearerAuth()
@UseGuards(LabStaffGuard)
@Controller('diagnostics')
export class DiagnosticsReceptionController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Lectura de la bandeja.
   */
  constructor(
    private readonly service: DiagnosticsReceptionService,
    private readonly worklist: DiagnosticsWorklistService,
  ) {}

  /**
   * Bandeja de recepción, paginada por cursor.
   *
   * `POST` y no `GET`: la búsqueda por paciente es PHI y no viaja en la URL.
   */
  @Audited({
    action: 'SERVICE_REQUEST_INBOX_LISTED',
    entity: 'service_request',
    entityId: 'result.id',
  })
  @Post('service-requests/inbox')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bandeja de órdenes de laboratorio por recibir',
    description:
      'Órdenes vigentes de laboratorio o anatomía patológica derivadas al ' +
      'laboratorio del tenant activo (`performer_tenant_id`) y todavía sin ' +
      'acesión, con las muestras ya recibidas. De la más vieja a la más ' +
      'nueva. Filtros en el cuerpo: la búsqueda por paciente no viaja en la URL.',
  })
  listInbox(@Body() query: LabInboxQueryDto): Promise<LabInboxPageDto> {
    return this.service.listInbox(requireTenantId(), query);
  }

  /**
   * Bandeja del ejecutor (laboratorio o imagenología) con el estado derivado de
   * datos reales y el detalle pedido. `POST` de lectura por la búsqueda de
   * paciente (PHI).
   */
  @Audited({
    action: 'SERVICE_REQUEST_WORKLIST_LISTED',
    entity: 'service_request',
    entityId: 'result.id',
  })
  @Post('service-requests/worklist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Bandeja del ejecutor: órdenes de laboratorio o imagen con estado derivado',
    description:
      'Órdenes derivadas al tenant activo (`performer_tenant_id`), de la más nueva a la más vieja, ' +
      'con `state` derivado (PENDING, RECEIVED, IN_PROCESS, REPORTED, CANCELLED) y el detalle pedido ' +
      '(muestra, componentes, modalidad/región/lateralidad/contraste y un `summary` legible). ' +
      '`scope` LAB incluye anatomía patológica.',
  })
  listWorklist(@Body() query: WorklistQueryDto): Promise<WorklistPageDto> {
    return this.worklist.list(requireTenantId(), query);
  }

  /**
   * Una orden del ejecutor con su detalle. Una orden de otro ejecutor o
   * inexistente: 404 (no se distinguen).
   */
  @Get('service-requests/:id')
  @ApiOperation({ summary: 'Detalle de una orden dirigida al tenant activo' })
  getServiceRequest(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WorklistItemDto> {
    return this.worklist.getById(requireTenantId(), id);
  }
}
