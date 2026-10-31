import { DirectoryAuthorizationModule } from '../directory/directory-authorization.module';
import { InsurancePatientSettlementModule } from '../insurance/insurance-patient-settlement.module';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PharmacyModule } from '../pharmacy/pharmacy.module';
import { MessagingModule } from '../messaging/messaging.module';
import { ProfilesModule } from '../profiles/profiles.module';
// FAR-02: la apertura del enlace de receta y el documento del paciente.
import { DelegatedAccessModule } from '../delegated_access/delegated_access.module';
import { CommonModule } from '../common/common.module';
// El chat del pedido (hilo paciente ↔ vitrina de la farmacia). No hay ciclo:
// `community` no importa este módulo.
import { CommunityModule } from '../community/community.module';
import { PHARMACY_ORDER_CHAT_PORT } from './application/ports/pharmacy-order-chat.port';
import { EXTERNAL_PHARMACY_CATALOG_PORT } from './application/ports/external-pharmacy-catalog.port';
import { HttpExternalPharmacyCatalogAdapter } from './infrastructure/adapters/http-external-pharmacy-catalog.adapter';
import { PharmacyCatalogBulkLoadAdapter } from './infrastructure/adapters/pharmacy-catalog-bulk-load.adapter';
import { CATALOG_BULK_LOAD_PORT } from './application/ports/catalog-bulk-load.port';
import { CommunityPharmacyOrderChatAdapter } from './infrastructure/adapters/community-pharmacy-order-chat.adapter';
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
import { PHARMACY_PRESCRIPTION_SHARES_PORT } from './application/ports/pharmacy-prescription-shares.port';
import { PATIENT_IDENTITY_PORT } from './application/ports/patient-identity.port';
import { DelegatedAccessPrescriptionSharesAdapter } from './infrastructure/adapters/delegated-access-prescription-shares.adapter';
import { ProfilesPatientIdentityAdapter } from './infrastructure/adapters/profiles-patient-identity.adapter';
import { PrescriptionShareReadRepository } from './infrastructure/repositories/prescription-share-read.repository';
import { OpenPrescriptionShareUseCase } from './application/prescription-shares/open-prescription-share.use-case';
import { PharmacyPrescriptionSharesController } from './presentation/controllers/pharmacy-prescription-shares.controller';
import { PRESCRIPTION_SHARE_ACCESS_LOG_PORT } from './application/ports/prescription-share-access-log.port';
import { AuditPrescriptionShareAccessLogAdapter } from './infrastructure/adapters/audit-prescription-share-access-log.adapter';
import { DataAccessLogRepository } from '../audit/repositories/data-access-log.repository';
import * as entities from './entities';
import { ApproveInventoryCountUseCase } from './application/inventory-count/approve-inventory-count.use-case';
import { OpenInventoryCountUseCase } from './application/inventory-count/open-inventory-count.use-case';
import { CreateInventoryLocationUseCase } from './application/inventory-locations/create-inventory-location.use-case';
import { RelocateInventoryLocationUseCase } from './application/inventory-locations/relocate-inventory-location.use-case';
import { StockPointGuard } from './application/inventory-locations/stock-point-guard';
import { CARE_SPACE_STOCK_POINT_PORT } from './application/ports/care-space-stock-point.port';
import { PracticeCareSpaceStockPointAdapter } from './infrastructure/adapters/practice-care-space-stock-point.adapter';
import { CreateRecallHoldUseCase } from './application/inventory-recall/create-recall-hold.use-case';
import { ReleaseRecallHoldUseCase } from './application/inventory-recall/release-recall-hold.use-case';
import { ReserveInventoryUseCase } from './application/inventory-reservations/reserve-inventory.use-case';
import { ExpireInventoryReservationsUseCase } from './application/inventory-reservations/expire-inventory-reservations.use-case';
import { ReleaseConfirmedReservationLinesUseCase } from './application/inventory-reservations/release-confirmed-reservation-lines.use-case';
import { CreateInventorySyncBatchUseCase } from './application/inventory-sync/create-inventory-sync-batch.use-case';
import { ReconcileInventorySyncBatchUseCase } from './application/inventory-sync/reconcile-inventory-sync-batch.use-case';
import { SyncExternalPharmacyCatalogUseCase } from './application/inventory-sync/sync-external-pharmacy-catalog.use-case';
import { IntegrationReadService } from './application/inventory-sync/integration-read.service';
import { TransferInventoryUseCase } from './application/inventory-transfers/transfer-inventory.use-case';
import { DispenseMedicationUseCase } from './application/medication-dispensations/dispense-medication.use-case';
import { ReverseMedicationDispensationUseCase } from './application/medication-dispensations/reverse-medication-dispensation.use-case';
import { PrescriptionBalanceRepository } from './infrastructure/repositories/prescription-balance.repository';
import { PrescriptionOrderGuard } from './application/pharmacy-orders/prescription-order-guard';
import { PendingOrderLines } from './application/pharmacy-orders/pending-order-lines';
import { ReadPharmacyInventoryUseCase } from './application/pharmacy-inventory-read/read-pharmacy-inventory.use-case';
import { ReadMedicationAvailabilityUseCase } from './application/pharmacy-inventory-read/read-medication-availability.use-case';
import { NotifyPharmacyOrderUseCase } from './application/pharmacy-order-notifications/notify-pharmacy-order.use-case';
import { PharmacyOrdersUseCases } from './application/pharmacy-orders/pharmacy-orders.use-cases';
import { PharmacyProcurementUseCases } from './application/pharmacy-procurement/pharmacy-procurement.use-cases';
import { SetSiteProductAvailabilityUseCase } from './application/site-availability/set-site-product-availability.use-case';
import { BulkSiteAvailabilityUseCase } from './application/site-availability/bulk-site-availability.use-case';
import { SiteStockWriter } from './application/site-availability/site-stock-writer';
import {
  PharmacyProcurementController,
  PharmacyInventoryController,
  PharmacyOrdersController,
  PharmacyDispensingController,
  PharmacyInventoryInternalController,
  PharmacyInventoryReadController,
  PharmacySiteAvailabilityController,
  PharmacyIntegrationSyncController,
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
  InventoryScopeRepository,
  IntegrationReadRepository,
} from './infrastructure/repositories';
import { PharmacyInventoryScopePolicy } from './application/scope/pharmacy-inventory-scope.policy';

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
    CommonModule,
    DelegatedAccessModule,
    CommunityModule,
  ],
  controllers: [
    PharmacyProcurementController,
    PharmacyInventoryController,
    PharmacyOrdersController,
    PharmacyPrescriptionSharesController,
    PharmacyDispensingController,
    PharmacyInventoryInternalController,
    PharmacyInventoryReadController,
    PharmacySiteAvailabilityController,
    PharmacyIntegrationSyncController,
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
    PrescriptionBalanceRepository,
    DispensationsRepository,
    PharmacyOrderSubstitutionsRepository,
    CountSessionsRepository,
    RecallHoldsRepository,
    SerialsRepository,
    SyncRepository,
    InventoryReadRepository,
    InventoryScopeRepository,
    IntegrationReadRepository,
    PharmacyInventoryScopePolicy,
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
    PrescriptionShareReadRepository,
    DelegatedAccessPrescriptionSharesAdapter,
    {
      provide: PHARMACY_PRESCRIPTION_SHARES_PORT,
      useExisting: DelegatedAccessPrescriptionSharesAdapter,
    },
    ProfilesPatientIdentityAdapter,
    {
      provide: PATIENT_IDENTITY_PORT,
      useExisting: ProfilesPatientIdentityAdapter,
    },
    DataAccessLogRepository,
    AuditPrescriptionShareAccessLogAdapter,
    {
      provide: PRESCRIPTION_SHARE_ACCESS_LOG_PORT,
      useExisting: AuditPrescriptionShareAccessLogAdapter,
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
    CommunityPharmacyOrderChatAdapter,
    {
      provide: PHARMACY_ORDER_CHAT_PORT,
      useExisting: CommunityPharmacyOrderChatAdapter,
    },
    // FAR-07: el sistema de gestión de una farmacia externa, por HTTP.
    HttpExternalPharmacyCatalogAdapter,
    {
      provide: EXTERNAL_PHARMACY_CATALOG_PORT,
      useExisting: HttpExternalPharmacyCatalogAdapter,
    },
    // Servicios
    InventoryLocationsService,
    OpenInventoryCountUseCase,
    ApproveInventoryCountUseCase,
    CreateInventoryLocationUseCase,
    RelocateInventoryLocationUseCase,
    StockPointGuard,
    PracticeCareSpaceStockPointAdapter,
    {
      provide: CARE_SPACE_STOCK_POINT_PORT,
      useExisting: PracticeCareSpaceStockPointAdapter,
    },
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
    OpenPrescriptionShareUseCase,
    ReadPharmacyInventoryUseCase,
    ReadMedicationAvailabilityUseCase,
    NotifyPharmacyOrderUseCase,
    PharmacyOrdersUseCases,
    PharmacyProcurementUseCases,
    SiteStockWriter,
    SetSiteProductAvailabilityUseCase,
    // La carga por sucursal corre en el bucle común de la carga masiva de pharmacy.
    PharmacyCatalogBulkLoadAdapter,
    {
      provide: CATALOG_BULK_LOAD_PORT,
      useExisting: PharmacyCatalogBulkLoadAdapter,
    },
    BulkSiteAvailabilityUseCase,
    SyncExternalPharmacyCatalogUseCase,
    IntegrationReadService,
    PharmacyProcurementService,
    InventoryReservationsService,
    PharmacyOrdersService,
    PrescriptionOrderGuard,
    PendingOrderLines,
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
