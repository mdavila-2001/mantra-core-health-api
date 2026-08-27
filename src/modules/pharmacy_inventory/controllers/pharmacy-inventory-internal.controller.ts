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
import {
  InventoryReservationsService,
  InventorySyncService,
  PharmacyOrdersService,
} from '../services';
import {
  CreateSyncBatchDto,
  SyncBatchResponseDto,
  ReconcileResponseDto,
  ExpireReservationsResponseDto,
} from '../dto';

/**
 * Endpoints internos disparados por workers del sistema: expiración de reservas
 * (UC-25-05) y reconciliación de lotes de sincronización ERP (UC-25-12). Son
 * idempotentes y quedan protegidos por rol de administración.
 */
@ApiTags('pharmacy-inventory-internal')
@ApiBearerAuth()
@Controller('internal')
export class PharmacyInventoryInternalController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param reservations - Valor de reservations requerido por la operación.
   * @param orders - Pedidos de paciente (FAR-E1), para vencerlos en la misma corrida.
   * @param sync - Valor de sync requerido por la operación.
   */
  constructor(
    private readonly reservations: InventoryReservationsService,
    private readonly orders: PharmacyOrdersService,
    private readonly sync: InventorySyncService,
  ) {}

  /**
   * UC-25-05: liberar reservas expiradas. La misma corrida vence también los
   * pedidos de paciente (FAR-E1) cuyo reloj de 48 h ya pasó — un solo worker,
   * las dos colas.
   */
  @Post('reservations/expire')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liberar reservas y pedidos vencidos (UC-25-05)' })
  async expireReservations(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExpireReservationsResponseDto> {
    const reservations = await this.reservations.expire(actor);
    const orders = await this.orders.expireDue(actor);
    return {
      expiredCount: reservations.expiredCount + orders.expiredCount,
      expiredOrderCount: orders.expiredCount,
    };
  }

  /** Bootstrap: ingresar un lote de sincronización ERP. */
  @Post('inventory-sync-batches')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ingerir un lote de sincronización ERP' })
  createSyncBatch(
    @Body() dto: CreateSyncBatchDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SyncBatchResponseDto> {
    return this.sync.createBatch(dto, actor);
  }

  /** UC-25-12: reconciliar un lote de sincronización. */
  @Post('inventory-sync/:batchId/reconcile')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Conciliar lote de sincronización externa (UC-25-12)',
  })
  reconcile(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReconcileResponseDto> {
    return this.sync.reconcile(batchId, actor);
  }
}
