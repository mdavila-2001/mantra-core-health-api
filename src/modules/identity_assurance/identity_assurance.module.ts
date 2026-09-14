import { Module } from '@nestjs/common';
import { IdentityEvidenceLifecycleModule } from './identity-evidence-lifecycle.module';
import { StorageLifecycleModule } from '../../common/storage/storage-lifecycle.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { ProfilesModule } from '../profiles/profiles.module';
import { DirectoryModule } from '../directory/directory.module';
import { CommunityModule } from '../community/community.module';
import {
  IdentityAuthoritiesController,
  IdentityPoliciesController,
  IdentityCasesController,
  IdentityChecksController,
  IdentityManualReviewController,
  IdentityAssertionsController,
  IdentityWorkerController,
  IdentitySelfServiceController,
} from './controllers';
import {
  IdentityAuthoritiesService,
  IdentityPoliciesService,
  IdentityCasesService,
  IdentityChecksService,
  IdentityManualReviewService,
  IdentityAssertionsService,
  IdentityVerificationEffectsService,
  IdentitySelfServiceService,
} from './services';
import {
  IdentityAuthoritiesRepository,
  IdentityAuthorityEndpointsRepository,
  IdentityVerificationPoliciesRepository,
  IdentityVerificationCasesRepository,
  IdentityEvidenceRecordsRepository,
  IdentityChecksRepository,
  IdentityVerificationAttemptsRepository,
  IdentityCheckResultsRepository,
  IdentityFraudSignalsRepository,
  IdentityManualReviewCasesRepository,
  IdentityAssertionsRepository,
} from './repositories';

/**
 * Módulo Identity Assurance (27): proofing de identidad NIST 800-63, aserciones
 * IAL/AAL y controles de fraude. Autoridades, políticas, casos de verificación,
 * evidencia, checks/intentos/resultados, señales de fraude, revisión manual y
 * aserciones. Autenticación vía guard global (`AuthModule`).
 */
@Module({
  imports: [
    IdentityEvidenceLifecycleModule,
    StorageLifecycleModule,
    MikroOrmModule.forFeature(Object.values(entities)),
    // Verificar una matrícula o una institución cambia el estado de esos
    // dominios, no del propio caso: el efecto lo aplica
    // `IdentityVerificationEffectsService` con sus repositorios.
    ProfilesModule,
    DirectoryModule,
    // P13: verificar una matrícula o una institución también emite el sello
    // «Verificado» del perfil público. Community sabe qué significa el sello;
    // este módulo sólo sabe que el caso quedó verificado. Sin ciclo: community
    // no importa `identity_assurance`.
    CommunityModule,
  ],
  controllers: [
    IdentityAuthoritiesController,
    IdentityPoliciesController,
    IdentityCasesController,
    IdentityChecksController,
    IdentityManualReviewController,
    IdentityAssertionsController,
    IdentityWorkerController,
    IdentitySelfServiceController,
  ],
  providers: [
    // Repositorios
    IdentityAuthoritiesRepository,
    IdentityAuthorityEndpointsRepository,
    IdentityVerificationPoliciesRepository,
    IdentityVerificationCasesRepository,
    IdentityEvidenceRecordsRepository,
    IdentityChecksRepository,
    IdentityVerificationAttemptsRepository,
    IdentityCheckResultsRepository,
    IdentityFraudSignalsRepository,
    IdentityManualReviewCasesRepository,
    IdentityAssertionsRepository,
    // Servicios
    IdentityAuthoritiesService,
    IdentityPoliciesService,
    IdentityCasesService,
    IdentityChecksService,
    IdentityManualReviewService,
    IdentityAssertionsService,
    IdentityVerificationEffectsService,
    IdentitySelfServiceService,
  ],
})
export class IdentityAssuranceModule {}
