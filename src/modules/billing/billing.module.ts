import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { Practices } from '../practice/entities';
import {
  BillingReceivablesController,
  BillingPayablesController,
  BillingOperationsController,
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
  PracticesLookupRepository,
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
    // Sólo para PracticesLookupRepository (agrupar facturas por tenant vía
    // practice_id — ver su docstring). No importa el resto de `practice`.
    MikroOrmModule.forFeature([Practices]),
  ],
  controllers: [
    BillingReceivablesController,
    BillingPayablesController,
    BillingOperationsController,
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
    PracticesLookupRepository,
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
  ],
})
export class BillingModule {}
