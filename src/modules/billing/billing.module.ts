import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { PracticeModule } from '../practice/practice.module';
import {
  BillingReceivablesController,
  BillingPayablesController,
  BillingOperationsController,
  BillingServiceCatalogController,
} from './controllers';
import {
  InvoicesService,
  PaymentsReceivedService,
  BillsService,
  PaymentsMadeService,
  LedgerService,
  ReconciliationService,
  ReimbursementsService,
  PatientStatementsService,
  DunningService,
  KpiSnapshotsService,
  BillingServiceCatalogService,
} from './services';
import {
  InvoicesRepository,
  BillsRepository,
  PaymentsReceivedRepository,
  PaymentsMadeRepository,
  BillingDocumentLinksRepository,
  ReimbursementsRepository,
  PatientStatementsRepository,
  DunningRepository,
  KpiSnapshotsRepository,
  ServiceCatalogRepository,
} from './repositories';

/**
 * Módulo Billing (17): facturación al paciente (CxC), cuentas por pagar (CxP),
 * contabilización a ledger, conciliación, morosidad, planes de pago y KPIs
 * financieros. Registra sus controllers, servicios y repositorios; mantiene el
 * `forFeature` de todas las entidades del esquema billing.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    // Puerto de lectura público para agrupar facturas por tenant sin importar
    // la entidad ORM de Practice dentro del dominio Billing.
    PracticeModule,
  ],
  controllers: [
    BillingReceivablesController,
    BillingPayablesController,
    BillingOperationsController,
    BillingServiceCatalogController,
  ],
  providers: [
    // Repositorios
    InvoicesRepository,
    BillsRepository,
    PaymentsReceivedRepository,
    PaymentsMadeRepository,
    BillingDocumentLinksRepository,
    ReimbursementsRepository,
    PatientStatementsRepository,
    DunningRepository,
    KpiSnapshotsRepository,
    ServiceCatalogRepository,
    // Servicios
    InvoicesService,
    PaymentsReceivedService,
    BillsService,
    PaymentsMadeService,
    LedgerService,
    ReconciliationService,
    ReimbursementsService,
    PatientStatementsService,
    DunningService,
    KpiSnapshotsService,
    BillingServiceCatalogService,
  ],
  // Carril 18 — `accounting` reutiliza `LedgerService.postToLedger` (anclar
  // `transaction_id` en el documento de origen, idempotente por documento)
  // para que el asiento de un ingreso de consulta quede enlazado a la factura
  // pagada que lo originó, sin reimplementar esa guarda en otro módulo.
  exports: [LedgerService],
})
export class BillingModule {}
