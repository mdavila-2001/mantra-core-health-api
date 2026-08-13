import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { AuditModule } from '../audit/audit.module';
import {
  AccountingLedgerController,
  AccountingFiscalController,
  AccountingAccrualController,
  AccountingSubledgerController,
  AccountingAssetController,
  AccountingLiabilityController,
  AccountingExchangeRateController,
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
  imports: [MikroOrmModule.forFeature(Object.values(entities)), AuditModule],
  controllers: [
    AccountingLedgerController,
    AccountingFiscalController,
    AccountingAccrualController,
    AccountingSubledgerController,
    AccountingAssetController,
    AccountingLiabilityController,
    AccountingExchangeRateController,
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
  ],
})
export class AccountingModule {}
