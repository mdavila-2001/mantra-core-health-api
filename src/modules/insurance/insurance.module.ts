import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PracticeModule } from '../practice/practice.module';
import { DirectoryAuthorizationModule } from '../directory/directory-authorization.module';
// Antiduplicación de estudios (subtarea 3.2, T-26): `DuplicateStudyDetector`
// necesita `ConceptDesignationsRepository` para nombrar el estudio en
// castellano; se importa el módulo entero en vez de proveer el repo suelto
// porque ya lo hace `TerminologyModule` y es su dueño.
import { TerminologyModule } from '../terminology/terminology.module';
import * as entities from './entities';
import { LinkedClaimOrderService } from './services/linked-claim-order.service';
import { LinkedClaimAccessService } from './services/linked-claim-access.service';
// Mismo criterio que `DeclaredCoveragesReader` (más abajo): clase sin estado
// por `EntityManager`, provista directo sin importar `ClinicalModule` entero
// — evita el ciclo de que `ClinicalModule` ya la provee él mismo.
import { DuplicateStudyDetector } from '../clinical/services/duplicate-study-detector';
import {
  InsuranceBackboneController,
  CoverageController,
  PriorAuthController,
  ClaimsController,
  ClaimsReadController,
  AppealsController,
  ReconciliationController,
  BrokerCommissionController,
  InsuranceReadController,
  InsuranceCatalogController,
  InsuranceAnalyticsController,
  InsurancePortabilityController,
  InsurancePortabilityPublicController,
  PractitionerSettlementBatchesController,
  InsuranceCampaignsController,
} from './controllers';
import {
  InsuranceBackboneService,
  CoverageService,
  PriorAuthService,
  ClaimsService,
  ClaimsReadService,
  AppealsService,
  ReconciliationService,
  BrokerCommissionService,
  InsuranceReadService,
  InsuranceCatalogService,
  InsuranceAnalyticsService,
  DeclaredCoveragesReader,
  InsurancePortabilityService,
  InsurancePortabilityPdfService,
  PractitionerSettlementBatchesService,
  InsuranceCampaignsService,
} from './services';
import {
  CatalogRepository,
  CoverageRepository,
  PriorAuthRepository,
  ClaimRepository,
  ClaimReadRepository,
  DisputeRepository,
  SettlementRepository,
  InsuranceReadRepository,
  InsuranceAnalyticsRepository,
  InsurancePortabilityRepository,
  InsuranceCampaignsRepository,
} from './repositories';
// Portabilidad de póliza y siniestralidad (subtarea 3.3): el certificado se
// autoriza contra el titular (`ProfileOwnershipService`, mismo criterio que
// `practice.module.ts` §ALV-005/006 — clases sueltas, no `ProfilesModule`
// entero, porque `profiles` ya importa `insurance` por `DeclaredCoveragesReader`
// y cerraría el ciclo), resuelve nombre/documento del paciente
// (`PatientProfilesRepository`, `PersonsRepository`), guarda el JSON sellado
// como archivo (`CommonModule`) y deja constancia en auditoría (`AuditModule`
// + los dos repos de `audit` y `health_data` que ninguno de los dos módulos
// exporta).
import { ProfileOwnershipService } from '../profiles/services/profile-ownership.service';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
  HealthPractitionerProfilesRepository,
  PersonsRepository,
} from '../profiles/repositories';
import { CommonModule } from '../common/common.module';
import { AuditModule } from '../audit/audit.module';
import { DataReleaseRepository } from '../health_data/repositories/data-release.repository';
import { HealthProvenanceRepository } from '../health_data/repositories/health-provenance.repository';
import { DsarRequestsRepository } from '../audit/repositories/dsar-requests.repository';
import { DataAccessLogRepository } from '../audit/repositories/data-access-log.repository';

/**
 * Módulo Insurance (26): redes, coberturas, elegibilidad, autorización previa,
 * reclamos/adjudicación (837/835), EOB, COB, reversiones, disputas/apelaciones,
 * conciliación y comisiones de broker. Repos stateless + servicios transaccionales.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    // TAREA-16 — la lectura de solicitudes es la cara del prestador que las
    // envió, y el reclamo cuelga de `billing_provider_entity_id`, que es una
    // `practice.practices`. `PracticeModule` expone el puerto que traduce la
    // organización activa a sus prácticas; sin él, `insurance` tendría que
    // importar la entidad persistente de otro dominio.
    PracticeModule,
    DirectoryAuthorizationModule,
    TerminologyModule,
    CommonModule,
    AuditModule,
  ],
  controllers: [
    InsuranceBackboneController,
    CoverageController,
    PriorAuthController,
    ClaimsController,
    ClaimsReadController,
    AppealsController,
    ReconciliationController,
    BrokerCommissionController,
    InsuranceReadController,
    InsuranceCatalogController,
    InsuranceAnalyticsController,
    InsurancePortabilityController,
    InsurancePortabilityPublicController,
    PractitionerSettlementBatchesController,
    InsuranceCampaignsController,
  ],
  providers: [
    // Repositorios
    CatalogRepository,
    InsuranceReadRepository,
    CoverageRepository,
    PriorAuthRepository,
    ClaimRepository,
    ClaimReadRepository,
    DisputeRepository,
    SettlementRepository,
    InsuranceAnalyticsRepository,
    InsurancePortabilityRepository,
    InsuranceCampaignsRepository,
    LinkedClaimOrderService,
    LinkedClaimAccessService,
    DuplicateStudyDetector,
    // Sueltos de otros dominios, sin importar sus módulos enteros (ver el
    // comentario junto a los imports de más arriba).
    ProfileOwnershipService,
    PatientProfilesRepository,
    PersonAccountLinksRepository,
    HealthPractitionerProfilesRepository,
    PersonsRepository,
    DataReleaseRepository,
    HealthProvenanceRepository,
    DsarRequestsRepository,
    DataAccessLogRepository,
    // Servicios
    InsuranceBackboneService,
    CoverageService,
    PriorAuthService,
    ClaimsService,
    ClaimsReadService,
    AppealsService,
    ReconciliationService,
    BrokerCommissionService,
    InsuranceReadService,
    InsuranceCatalogService,
    InsuranceAnalyticsService,
    DeclaredCoveragesReader,
    InsurancePortabilityService,
    InsurancePortabilityPdfService,
    PractitionerSettlementBatchesService,
    InsuranceCampaignsService,
  ],
  // Lo consume `directory` para materializar la aseguradora o el corredor en la
  // misma transacción en la que se da de alta el tenant de ese tipo.
  // `CoverageRepository` lo necesita iam: el alta de paciente anota en la misma
  // transacción el seguro que la persona declara tener.
  // `ClaimReadRepository` lo lee `scheduling`: la agenda muestra la solicitud
  // de seguro de cada cita, en lote, sin reimplementar la consulta.
  // `DeclaredCoveragesReader` lo leen `profiles` (GET /profiles/patients/me)
  // y `clinical` (el PDF oficial de receta, subtarea B.3): es la misma
  // consulta de coberturas declaradas y no puede tener dos dueños.
  exports: [
    CatalogRepository,
    CoverageRepository,
    ClaimReadRepository,
    DeclaredCoveragesReader,
  ],
})
export class InsuranceModule {}
