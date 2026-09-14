import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { AuditModule } from '../audit/audit.module';
import { PracticeModule } from '../practice/practice.module';
import { BillingModule } from '../billing/billing.module';
import { MessagingModule } from '../messaging/messaging.module';
import {
  AccountingLedgerController,
  AccountingFiscalController,
  AccountingAccrualController,
  AccountingSubledgerController,
  AccountingAssetController,
  AccountingLiabilityController,
  AccountingExchangeRateController,
  AccountingPractitionerController,
  AccountingCockpitController,
} from './controllers';
import {
  LedgerReadService,
  LedgerService,
  FiscalService,
  AccrualService,
  SubledgerService,
  AssetService,
  LiabilityService,
  ExchangeRateService,
  PostingHelper,
  PractitionerAccountingService,
  AccountingReadService,
} from './services';
import {
  JournalRepository,
  AccountsRepository,
  FiscalRepository,
  AccrualRepository,
  SubledgerRepository,
  AssetRepository,
  LiabilityRepository,
  ExchangeRateRepository,
  AccountingControllingRepository,
} from './repositories';

/**
 * Módulo 16 — Libro mayor y subledgers contables. Registra los 14 casos de uso
 * (UC-16-01..14) como endpoints bajo `/accounting`, más un endpoint de soporte
 * para el plan de cuentas. Mantiene `MikroOrmModule.forFeature` con todas las
 * entidades del esquema `accounting`.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    AuditModule,
    // Carril 18 — puertos que necesita el auto-servicio contable del doctor:
    // `PracticeModule` resuelve a qué prácticas pertenece (para no dejarlo
    // escribir en una ajena), `BillingModule` expone el anclaje idempotente
    // factura→asiento, `MessagingModule` expone las notificaciones contables.
    PracticeModule,
    BillingModule,
    MessagingModule,
  ],
  controllers: [
    AccountingLedgerController,
    AccountingFiscalController,
    AccountingAccrualController,
    AccountingSubledgerController,
    AccountingAssetController,
    AccountingLiabilityController,
    AccountingExchangeRateController,
    AccountingPractitionerController,
    AccountingCockpitController,
  ],
  providers: [
    // Repositorios
    JournalRepository,
    AccountsRepository,
    FiscalRepository,
    AccrualRepository,
    SubledgerRepository,
    AssetRepository,
    LiabilityRepository,
    ExchangeRateRepository,
    AccountingControllingRepository,
    // Servicios
    PostingHelper,
    LedgerService,
    LedgerReadService,
    FiscalService,
    AccrualService,
    SubledgerService,
    AssetService,
    LiabilityService,
    ExchangeRateService,
    PractitionerAccountingService,
    AccountingReadService,
  ],
})
export class AccountingModule {}
