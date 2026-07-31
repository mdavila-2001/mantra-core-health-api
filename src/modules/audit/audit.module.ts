import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  AuditController,
  ComplianceController,
  PrivacyController,
  ModerationController,
} from './controllers';
import {
  AuditEventsService,
  AuditHistoryService,
  AuditTrailService,
  ComplianceService,
  ModerationService,
  ThirdPartyAccessService,
} from './services';
import {
  AuditLogRepository,
  DataAccessLogRepository,
  AnalyticsGovernanceLogRepository,
  DsarRequestsRepository,
  ModerationRepository,
  ThirdPartyAccessRepository,
  HistoryRepository,
} from './repositories';

/**
 * Módulo 10 — Audit, Provenance and Version Histories. Auditoría WORM
 * (append-only), cadena hash tamper-evidence, provenance, historial de versiones,
 * DSAR, exportación de evidencia, retención, anomalías, moderación y acceso de
 * tercero gobernado. Las entidades son mayormente append-only (solo `recorded_at`).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    AuditController,
    ComplianceController,
    PrivacyController,
    ModerationController,
  ],
  providers: [
    // Repositorios
    AuditLogRepository,
    DataAccessLogRepository,
    AnalyticsGovernanceLogRepository,
    DsarRequestsRepository,
    ModerationRepository,
    ThirdPartyAccessRepository,
    HistoryRepository,
    // Servicios
    AuditEventsService,
    AuditHistoryService,
    AuditTrailService,
    ComplianceService,
    ModerationService,
    ThirdPartyAccessService,
  ],
  // Exportados para la auditoría TRANSVERSAL (CAN-AUDIT-001): otros dominios
  // sellan sus mutaciones sensibles en la misma transacción vía AuditTrailService.
  exports: [AuditTrailService, AuditLogRepository, HistoryRepository],
})
export class AuditModule {}
