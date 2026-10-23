import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { PracticeModule } from '../practice/practice.module';
import { AuditModule } from '../audit/audit.module';
import { MessagingModule } from '../messaging/messaging.module';
import {
  NoCoveragePatientShare,
  PATIENT_SHARE_PORT,
} from './patient-share.port';
import { SurveysModule } from '../surveys/surveys.module';
import {
  BillingReceivablesController,
  BillingPayablesController,
  BillingOperationsController,
  BillingServiceCatalogController,
  BillingSimulatedController,
  PaymentProofsController,
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
  ProcedureNomenclatureService,
  BillingSimulatedService,
  PaymentProofsService,
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
  PaymentProofsRepository,
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
    // FT-31 — reutiliza sus repositorios para auto-crear la encuesta de
    // satisfacción por defecto de un servicio médico nuevo, en la misma
    // transacción que lo da de alta.
    SurveysModule,
    // C-01 — la aceptación o el rechazo de un comprobante sella un eslabón en
    // la cadena de auditoría y avisa al paciente por la campana.
    AuditModule,
    MessagingModule,
  ],
  controllers: [
    BillingReceivablesController,
    BillingPayablesController,
    BillingOperationsController,
    BillingServiceCatalogController,
    BillingSimulatedController,
    PaymentProofsController,
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
    PaymentProofsRepository,
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
    ProcedureNomenclatureService,
    BillingSimulatedService,
    PaymentProofsService,
    // C-02 — doble declarado hasta que `insurance` publique el puerto real.
    { provide: PATIENT_SHARE_PORT, useClass: NoCoveragePatientShare },
  ],
  // Carril 18 — `accounting` reutiliza `LedgerService.postToLedger` (anclar
  // `transaction_id` en el documento de origen, idempotente por documento)
  // para que el asiento de un ingreso de consulta quede enlazado a la factura
  // pagada que lo originó, sin reimplementar esa guarda en otro módulo.
  exports: [LedgerService],
})
export class BillingModule {}
