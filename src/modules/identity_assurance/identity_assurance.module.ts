import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  IdentityAuthoritiesController,
  IdentityPoliciesController,
  IdentityCasesController,
  IdentityChecksController,
  IdentityManualReviewController,
  IdentityAssertionsController,
} from './controllers';
import {
  IdentityAuthoritiesService,
  IdentityPoliciesService,
  IdentityCasesService,
  IdentityChecksService,
  IdentityManualReviewService,
  IdentityAssertionsService,
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
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    IdentityAuthoritiesController,
    IdentityPoliciesController,
    IdentityCasesController,
    IdentityChecksController,
    IdentityManualReviewController,
    IdentityAssertionsController,
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
  ],
})
export class IdentityAssuranceModule {}
