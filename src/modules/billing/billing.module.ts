import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { CommonModule } from '../common/common.module';
import { PracticeModule } from '../practice/practice.module';
import { SurveysModule } from '../surveys/surveys.module';
import { AuditModule } from '../audit/audit.module';
import { MessagingModule } from '../messaging/messaging.module';
import {
  BillingReceivablesController,
  BillingPayablesController,
  BillingOperationsController,
  BillingServiceCatalogController,
  BillingSimulatedController,
  PatientSpendingController,
  BillingSpaceTariffsController,
  BillingChargeCapturesController,
  BillingChargesInternalController,
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
  ProcedureImportService,
  BillingSimulatedService,
  PatientSpendingService,
  BillingAccessService,
  ChargeEventsService,
  ChargeAccrualSupport,
  ChargeCapturesService,
  SpaceTariffsService,
  BedDayChargesService,
  OrTimeChargesService,
} from './services';
import { InfraF5ePolicyInitializer } from './policies/infra-f5.policy';
import {
  InvoicesRepository,
  BillsRepository,
  PaymentsReceivedRepository,
  PaymentsMadeRepository,
  BillingDocumentLinksRepository,
  BillingLinkTargetsRepository,
  ReimbursementsRepository,
  PatientStatementsRepository,
  DunningRepository,
  KpiSnapshotsRepository,
  ServiceCatalogRepository,
  PatientSpendingRepository,
} from './repositories';
import { SIAT_EMITTER_PORT } from './application/ports';
import {
  SiatSimulatedAdapter,
  SiatRealAdapter,
} from './infrastructure/adapters';

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
    // Bytes de la imagen de un servicio (P-22-8): la autorización por contexto
    // la decide `billing`; `common` solo los sirve.
    CommonModule,
    // F5e: historia de tarifas y cargos (`audit.*_history`) y eventos al outbox.
    AuditModule,
    MessagingModule,
  ],
  controllers: [
    BillingReceivablesController,
    BillingPayablesController,
    BillingOperationsController,
    BillingServiceCatalogController,
    BillingSimulatedController,
    // P44 — «Mis gastos» del paciente: lectura sobre sus facturas.
    PatientSpendingController,
    // F5e: tarifas de espacio, cargos devengados y los procesos de devengo.
    BillingSpaceTariffsController,
    BillingChargeCapturesController,
    BillingChargesInternalController,
  ],
  providers: [
    // Repositorios
    InvoicesRepository,
    BillsRepository,
    PaymentsReceivedRepository,
    PaymentsMadeRepository,
    BillingDocumentLinksRepository,
    BillingLinkTargetsRepository,
    ReimbursementsRepository,
    PatientStatementsRepository,
    DunningRepository,
    KpiSnapshotsRepository,
    ServiceCatalogRepository,
    PatientSpendingRepository,
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
    ProcedureImportService,
    BillingSimulatedService,
    PatientSpendingService,
    // F5e: política de roles en `INFRA_POLICIES` y servicios de tarifas y devengo.
    InfraF5ePolicyInitializer,
    BillingAccessService,
    ChargeEventsService,
    ChargeAccrualSupport,
    ChargeCapturesService,
    SpaceTariffsService,
    BedDayChargesService,
    OrTimeChargesService,
    // Puerto SIAT — el adaptador se selecciona por SIAT_MODE (default: simulado).
    {
      provide: SIAT_EMITTER_PORT,
      useClass:
        process.env['SIAT_MODE'] === 'real'
          ? SiatRealAdapter
          : SiatSimulatedAdapter,
    },
  ],
  // Carril 18 — `accounting` reutiliza `LedgerService.postToLedger` (anclar
  // `transaction_id` en el documento de origen, idempotente por documento)
  // para que el asiento de un ingreso de consulta quede enlazado a la factura
  // pagada que lo originó, sin reimplementar esa guarda en otro módulo.
  exports: [
    LedgerService,
    SIAT_EMITTER_PORT,
    // F5e: el módulo de quirófanos puede pedir el devengo de un caso al completarlo.
    OrTimeChargesService,
  ],
})
export class BillingModule {}
