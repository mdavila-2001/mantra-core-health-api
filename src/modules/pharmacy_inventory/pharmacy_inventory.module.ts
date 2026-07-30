import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  PharmacyProcurementController,
  PharmacyInventoryController,
  PharmacyDispensingController,
  PharmacyInventoryInternalController,
} from './controllers';
import {
  InventoryLocationsService,
  PharmacyProcurementService,
  InventoryReservationsService,
  MedicationDispensationsService,
  InventoryCountService,
  InventoryRecallService,
  InventoryTransfersService,
  InventorySyncService,
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
  DispensationsRepository,
  CountSessionsRepository,
  RecallHoldsRepository,
  SerialsRepository,
  SyncRepository,
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
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    PharmacyProcurementController,
    PharmacyInventoryController,
    PharmacyDispensingController,
    PharmacyInventoryInternalController,
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
    DispensationsRepository,
    CountSessionsRepository,
    RecallHoldsRepository,
    SerialsRepository,
    SyncRepository,
    // Servicios
    InventoryLocationsService,
    PharmacyProcurementService,
    InventoryReservationsService,
    MedicationDispensationsService,
    InventoryCountService,
    InventoryRecallService,
    InventoryTransfersService,
    InventorySyncService,
  ],
})
export class PharmacyInventoryModule {}
