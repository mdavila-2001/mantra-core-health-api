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
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AccessLogged,
  Audited,
  CurrentUser,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { LabStaffGuard } from '../guards';
import { LabPortalOrdersService } from '../services/lab-portal-orders.service';
import { LabPortalResultsService } from '../services/lab-portal-results.service';
import { LabPortalSummaryService } from '../services/lab-portal-summary.service';
import {
  LabOrderDto,
  LabOrderListQueryDto,
  LabOrderPageDto,
  LabOrderTransitionDto,
  LabResultTargetPageDto,
} from '../dto/lab-portal-orders.dto';
import { LabSummaryDto } from '../dto/lab-portal-summary.dto';

/**
 * Laboratory / imaging-center portal: summary and routed orders. No route
 * carries the laboratory id: it is the active tenant (`X-Tenant-Id`), and
 * `LabStaffGuard` lets in only its staff (same rule as the reception inbox).
 */
@ApiTags('diagnostics-lab-portal')
@ApiBearerAuth()
@UseGuards(LabStaffGuard)
@Controller('diagnostics/lab')
export class DiagnosticsLabPortalController {
  constructor(
    private readonly summary: LabPortalSummaryService,
    private readonly orders: LabPortalOrdersService,
    private readonly results: LabPortalResultsService,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumen del laboratorio del tenant activo' })
  getSummary(): Promise<LabSummaryDto> {
    return this.summary.summary(requireTenantId());
  }

  @Get('orders')
  @AccessLogged({ resourceType: 'DIAGNOSTIC_ORDERS' })
  @ApiOperation({
    summary: 'Órdenes derivadas al laboratorio, con su estado derivado',
    description:
      'Órdenes con `performer_tenant_id` = tenant activo (laboratorio, ' +
      'anatomía patológica e imagen), de la más nueva a la más vieja, por ' +
      'páginas (`limit` 100 por defecto, hasta 500). `count` es el total del ' +
      'laboratorio; si quedan órdenes más viejas viene `nextCursor`.',
  })
  listOrders(@Query() query: LabOrderListQueryDto): Promise<LabOrderPageDto> {
    return this.orders.list(requireTenantId(), query);
  }

  @Audited({
    action: 'LAB_ORDER_TRANSITIONED',
    entity: 'service_request',
    entityId: 'param:orderId',
  })
  @Post('orders/:orderId/transitions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Un paso del camino de la orden (RECEIVE, PROCESS, REJECT, CANCEL)',
    description:
      'CANCEL (desde DRAFT o RECEIVED) y REJECT (desde RECEIVED) valen para ' +
      'toda orden, imagenología incluida, y exigen `reason`: el ejecutor ' +
      'agrega un evento propio (`service_request_performer_events`) sin ' +
      'tocar la orden del solicitante. Una orden cancelada o rechazada deja ' +
      'de poder reservarse. Un paso que el estado no admite responde 409.',
  })
  @ApiConflictResponse({ description: 'El estado actual no admite ese paso' })
  transition(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: LabOrderTransitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LabOrderDto> {
    return this.orders.transition(requireTenantId(), orderId, dto, actor);
  }

  @Get('result-targets')
  @AccessLogged({ resourceType: 'DIAGNOSTIC_ORDERS' })
  @ApiOperation({
    summary: 'Órdenes procesadas a las que se puede adjuntar un resultado',
  })
  listResultTargets(): Promise<LabResultTargetPageDto> {
    return this.results.targets(requireTenantId());
  }
}
