import { Module } from '@nestjs/common';
import { EvidenceLifecycleJob } from './evidence-lifecycle.job';
import { ExpireSweepJob } from './expire-sweep.job';
import { DispatchIdentityChecksJob } from './dispatch-identity-checks.job';
import { MockProviderWiringService } from './mock-provider-wiring.service';

export {
  DispatchIdentityChecksJob,
  defaultIdentityVerificationAdapter,
  type DispatchableCheck,
  type IdentityDispatchOutcome,
  type IdentityVerdictOutcome,
  type IdentityVerificationProviderAdapter,
} from './dispatch-identity-checks.job';

/**
 * Worker de `identity_assurance`: barrido por expiración (UC-27-12) y despacho
 * de checks contra la autoridad externa.
 *
 * El despacho es lo que cierra el ciclo que antes no existía: descubre los
 * checks planificados, los encola en la autoridad y asienta su veredicto, que
 * es lo que verifica el caso y emite su aserción.
 */
@Module({
  providers: [
    EvidenceLifecycleJob,
    ExpireSweepJob,
    DispatchIdentityChecksJob,
    MockProviderWiringService,
  ],
})
export class IdentityAssuranceWorkerModule {}
