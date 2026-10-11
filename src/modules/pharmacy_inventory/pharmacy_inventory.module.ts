import { DirectoryAuthorizationModule } from '../directory/directory-authorization.module';
import { InsurancePatientSettlementModule } from '../insurance/insurance-patient-settlement.module';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PharmacyModule } from '../pharmacy/pharmacy.module';
import { MessagingModule } from '../messaging/messaging.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { DIRECTORY_TENANT_ADMINISTRATION_PORT } from './application/ports/directory-tenant-administration.port';
import { INSURANCE_PATIENT_SETTLEMENT_PORT } from './application/ports/insurance-patient-settlement.port';
import { PHARMACY_DIRECTORY_PORT } from './application/ports/pharmacy-directory.port';
import { DOMAIN_EVENT_PUBLISHER_PORT } from './application/ports/domain-event-publisher.port';
import { IN_APP_NOTIFICATION_PORT } from './application/ports/in-app-notification.port';
import { PERSON_ACCOUNT_LINKS_PORT } from './application/ports/person-account-links.port';
import { DirectoryTenantAdministrationAdapter } from './infrastructure/adapters/directory-tenant-administration.adapter';
import { InsurancePatientSettlementAdapter } from './infrastructure/adapters/insurance-patient-settlement.adapter';
import { PharmacyDirectoryAdapter } from './infrastructure/adapters/pharmacy-directory.adapter';
import { MessagingDomainEventAdapter } from './infrastructure/adapters/messaging-domain-event.adapter';
import { MessagingInAppNotificationAdapter } from './infrastructure/adapters/messaging-in-app-notification.adapter';
import { ProfilesPersonAccountLinksAdapter } from './infrastructure/adapters/profiles-person-account-links.adapter';
import * as entities from './entities';
import { ApproveInventoryCountUseCase } from './application/inventory-count/approve-inventory-count.use-case';
import { OpenInventoryCountUseCase } from './application/inventory-count/open-inventory-count.use-case';
import { CreateInventoryLocationUseCase } from './application/inventory-locations/create-inventory-location.use-case';
import { CreateRecallHoldUseCase } from './application/inventory-recall/create-recall-hold.use-case';
import { ReleaseRecallHoldUseCase } from './application/inventory-recall/release-recall-hold.use-case';
import { ReserveInventoryUseCase } from './application/inventory-reservations/reserve-inventory.use-case';
import { ExpireInventoryReservationsUseCase } from './application/inventory-reservations/expire-inventory-reservations.use-case';
import { ReleaseConfirmedReservationLinesUseCase } from './application/inventory-reservations/release-confirmed-reservation-lines.use-case';
import { CreateInventorySyncBatchUseCase } from './application/inventory-sync/create-inventory-sync-batch.use-case';
import { ReconcileInventorySyncBatchUseCase } from './application/inventory-sync/reconcile-inventory-sync-batch.use-case';
import { TransferInventoryUseCase } from './application/inventory-transfers/transfer-inventory.use-case';
import { DispenseMedicationUseCase } from './application/medication-dispensations/dispense-medication.use-case';
import { ReverseMedicationDispensationUseCase } from './application/medication-dispensations/reverse-medication-dispensation.use-case';
import { ReadPharmacyInventoryUseCase } from './application/pharmacy-inventory-read/read-pharmacy-inventory.use-case';
import { NotifyPharmacyOrderUseCase } from './application/pharmacy-order-notifications/notify-pharmacy-order.use-case';
import { PharmacyOrdersUseCases } from './application/pharmacy-orders/pharmacy-orders.use-cases';
import { PharmacyProcurementUseCases } from './application/pharmacy-procurement/pharmacy-procurement.use-cases';
import {
  PharmacyProcurementController,
  PharmacyInventoryController,
  PharmacyOrdersController,
  PharmacyDispensingController,
  PharmacyInventoryInternalController,
  PharmacyInventoryReadController,
} from './presentation/controllers';
import {
  InventoryLocationsService,
  PharmacyProcurementService,
  InventoryReservationsService,
  PharmacyOrdersService,
  PharmacyOrderNotificationsService,
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
  PharmacyOrderSubstitutionsRepository,
  CountSessionsRepository,
  RecallHoldsRepository,
  SerialsRepository,
  SyncRepository,
  InventoryReadRepository,
} from './infrastructure/repositories';

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
    DirectoryAuthorizationModule,
    InsurancePatientSettlementModule,
    MikroOrmModule.forFeature(Object.values(entities)),
    // La cara de lectura del directorio de farmacias (módulo 24): la
    // disponibilidad reutiliza sus filtros de publicación y precios en vez de
    // duplicarlos.
    PharmacyModule,
    // `OutboxService`: el pedido del paciente (FAR-E1) publica sus hechos
    // (enviado, cancelado, vencido) en la misma transacción del cambio.
    MessagingModule,
    ProfilesModule,
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
    PharmacyOrderSubstitutionsRepository,
    CountSessionsRepository,
    RecallHoldsRepository,
    SerialsRepository,
    SyncRepository,
    InventoryReadRepository,
    DirectoryTenantAdministrationAdapter,
    {
      provide: DIRECTORY_TENANT_ADMINISTRATION_PORT,
      useExisting: DirectoryTenantAdministrationAdapter,
    },
    InsurancePatientSettlementAdapter,
    {
      provide: INSURANCE_PATIENT_SETTLEMENT_PORT,
      useExisting: InsurancePatientSettlementAdapter,
    },
    PharmacyDirectoryAdapter,
    {
      provide: PHARMACY_DIRECTORY_PORT,
      useExisting: PharmacyDirectoryAdapter,
    },
    MessagingDomainEventAdapter,
    {
      provide: DOMAIN_EVENT_PUBLISHER_PORT,
      useExisting: MessagingDomainEventAdapter,
    },
    MessagingInAppNotificationAdapter,
    {
      provide: IN_APP_NOTIFICATION_PORT,
      useExisting: MessagingInAppNotificationAdapter,
    },
    ProfilesPersonAccountLinksAdapter,
    {
      provide: PERSON_ACCOUNT_LINKS_PORT,
      useExisting: ProfilesPersonAccountLinksAdapter,
    },
    // Servicios
    InventoryLocationsService,
    OpenInventoryCountUseCase,
    ApproveInventoryCountUseCase,
    CreateInventoryLocationUseCase,
    CreateRecallHoldUseCase,
    ReleaseRecallHoldUseCase,
    ReserveInventoryUseCase,
    ExpireInventoryReservationsUseCase,
    ReleaseConfirmedReservationLinesUseCase,
    CreateInventorySyncBatchUseCase,
    ReconcileInventorySyncBatchUseCase,
    TransferInventoryUseCase,
    DispenseMedicationUseCase,
    ReverseMedicationDispensationUseCase,
    ReadPharmacyInventoryUseCase,
    NotifyPharmacyOrderUseCase,
    PharmacyOrdersUseCases,
    PharmacyProcurementUseCases,
    PharmacyProcurementService,
    InventoryReservationsService,
    PharmacyOrdersService,
    PharmacyOrderNotificationsService,
    MedicationDispensationsService,
    InventoryCountService,
    InventoryRecallService,
    InventoryTransfersService,
    InventorySyncService,
    PharmacyInventoryReadService,
  ],
})
export class PharmacyInventoryModule {}
