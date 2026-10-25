import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RouteIndexModule } from '../../observability/route-index/route-index.module';
import * as entities from './entities';
import {
  AuditController,
  AuditMeController,
  AuditQueryController,
  ComplianceController,
  PrivacyController,
  ModerationController,
} from './controllers';
import {
  AuditEventsService,
  AuditHistoryService,
  AuditQueryService,
  AuditTrailService,
  ComplianceService,
  ModerationService,
  MyDataAccessService,
  ThirdPartyAccessService,
} from './services';
import {
  AuditLogRepository,
  AuditQueryRepository,
  DataAccessLogRepository,
  AnalyticsGovernanceLogRepository,
  DsarRequestsRepository,
  ModerationRepository,
  ThirdPartyAccessRepository,
  HistoryRepository,
  PatientAccessLogRepository,
} from './repositories';
// PAC-HIST-004/005: el titular de la sesión sale del vínculo cuenta ↔ persona. Clases
// sin estado que reciben el `EntityManager` por parámetro, provistas sueltas como en
// `authz` y `clinical` (importar `ProfilesModule` entero cerraría un ciclo).
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../profiles/infrastructure/repositories';

/**
 * Módulo 10 — Audit, Provenance and Version Histories. Auditoría WORM
 * (append-only), cadena hash tamper-evidence, provenance, historial de versiones,
 * DSAR, exportación de evidencia, retención, anomalías, moderación y acceso de
 * tercero gobernado. Las entidades son mayormente append-only (solo `recorded_at`).
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    RouteIndexModule,
  ],
  controllers: [
    AuditController,
    AuditMeController,
    AuditQueryController,
    ComplianceController,
    PrivacyController,
    ModerationController,
  ],
  providers: [
    // Repositorios
    AuditLogRepository,
    AuditQueryRepository,
    DataAccessLogRepository,
    AnalyticsGovernanceLogRepository,
    DsarRequestsRepository,
    ModerationRepository,
    ThirdPartyAccessRepository,
    HistoryRepository,
    PatientAccessLogRepository,
    PersonAccountLinksRepository,
    PatientProfilesRepository,
    // Servicios
    AuditEventsService,
    AuditHistoryService,
    AuditQueryService,
    AuditTrailService,
    ComplianceService,
    ModerationService,
    MyDataAccessService,
    ThirdPartyAccessService,
  ],
  // Exportados para la auditoría TRANSVERSAL (CAN-AUDIT-001): otros dominios
  // sellan sus mutaciones sensibles en la misma transacción vía AuditTrailService.
  // `DataAccessLogRepository` se exporta para que una lectura de PHI no tenga que
  // proveerlo suelto (informe C §1.3); lo usa también `AuditTrailInterceptor`,
  // que `AppModule` registra como interceptor global.
  exports: [
    AuditTrailService,
    AuditLogRepository,
    DataAccessLogRepository,
    HistoryRepository,
  ],
})
export class AuditModule {}
