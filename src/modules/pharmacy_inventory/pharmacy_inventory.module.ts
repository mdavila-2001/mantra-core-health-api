import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PharmacyModule } from '../pharmacy/pharmacy.module';
import { MessagingModule } from '../messaging/messaging.module';
import * as entities from './entities';
import {
  PharmacyProcurementController,
  PharmacyInventoryController,
  PharmacyOrdersController,
  PharmacyDispensingController,
  PharmacyInventoryInternalController,
  PharmacyInventoryReadController,
} from './controllers';
import {
  InventoryLocationsService,
  PharmacyProcurementService,
  InventoryReservationsService,
  PharmacyOrdersService,
  MedicationDispensationsService,
  InventoryCountService,
  InventoryRecallService,
  InventoryTransfersService,
  InventorySyncService,
  PharmacyInventoryReadService,
} from './services';
import {
  SuppliersRepository,
  LocationsRepository,
  LotsRepository,
  StockPositionsRepository,
  LedgerRepository,
  PurchaseOrdersRepository,
  GoodsReceiptsRepository,
  ReservationsRepository,
  PharmacyOrdersRepository,
  DispensationsRepository,
  CountSessionsRepository,
  RecallHoldsRepository,
  SerialsRepository,
  SyncRepository,
  InventoryReadRepository,
} from './repositories';

/**
 * Módulo 25 — Pharmacy Inventory, Supply and Dispensing.
 *
 * Compras y recepción, dispensación y reservas, conteo cíclico, recall/holds,
 * transferencias entre ubicaciones y reconciliación de sincronización ERP. El
 * ledger de inventario es append-only y la posición de stock se recalcula en
 * cada movimiento.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    // La cara de lectura del directorio de farmacias (módulo 24): la
    // disponibilidad reutiliza sus filtros de publicación y precios en vez de
    // duplicarlos.
    PharmacyModule,
    // `OutboxService`: el pedido del paciente (FAR-E1) publica sus hechos
    // (enviado, cancelado, vencido) en la misma transacción del cambio.
    MessagingModule,
  ],
  controllers: [
    PharmacyProcurementController,
    PharmacyInventoryController,
    PharmacyOrdersController,
    PharmacyDispensingController,
    PharmacyInventoryInternalController,
    PharmacyInventoryReadController,
  ],
  providers: [
    // Repositorios
    SuppliersRepository,
    LocationsRepository,
    LotsRepository,
    StockPositionsRepository,
    LedgerRepository,
    PurchaseOrdersRepository,
    GoodsReceiptsRepository,
    ReservationsRepository,
    PharmacyOrdersRepository,
    DispensationsRepository,
    CountSessionsRepository,
    RecallHoldsRepository,
    SerialsRepository,
    SyncRepository,
    InventoryReadRepository,
    // Servicios
    InventoryLocationsService,
    PharmacyProcurementService,
    InventoryReservationsService,
    PharmacyOrdersService,
    MedicationDispensationsService,
    InventoryCountService,
    InventoryRecallService,
    InventoryTransfersService,
    InventorySyncService,
    PharmacyInventoryReadService,
  ],
})
export class PharmacyInventoryModule {}
