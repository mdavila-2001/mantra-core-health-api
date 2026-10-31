import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { AuditTrailService } from '../audit/services/audit-trail.service';
import { OutboxService } from '../messaging/services/outbox.service';
import { DelegatedAccessModule } from './delegated_access.module';
import { SupportLifecycleController } from './controllers/support-lifecycle.controller';
import { TeamAdminController } from './controllers/team-admin.controller';
import {
  EngagementHandoverService,
  EngagementMoveService,
  EngagementSuspensionService,
  LifecycleService,
  TeamAdminCasesService,
  TeamAdminRequestsService,
  TeamAdminService,
} from './services';
import { GovernanceStepUpGate } from './services/governance-step-up.gate';
import { GrantProposalValidator } from './services/grant-proposal.validator';
import { JoinerFactsReader } from './services/lifecycle-joiner-facts';
import { LifecycleApprovalExecutors } from './services/lifecycle-approval-executors';
import { LifecycleFourEyes } from './services/lifecycle-four-eyes';
import { LifecycleReviewOpener } from './services/lifecycle-review-opener';
import { SupportAdminDirectory } from './services/support-admin-directory';
import { LifecycleSettingsReader } from './services/support-lifecycle-settings';
import { SupportOnboardingGate } from './services/support-onboarding-gate';
import { TeamAdminPolicy } from './services/team-admin.policy';
import { HandoverWorkRepository } from './repositories/handover-work.repository';

const meta = (key: string): readonly unknown[] =>
  (Reflect.getMetadata(key, DelegatedAccessModule) ?? []) as readonly unknown[];

/** Lo que el módulo recibe de fuera (módulos importados o globales). */
const EXTERNAL: readonly unknown[] = [
  EntityManager,
  PinoLogger,
  OutboxService,
  AuditTrailService,
];

const OWN = [
  HandoverWorkRepository,
  LifecycleSettingsReader,
  SupportAdminDirectory,
  JoinerFactsReader,
  LifecycleService,
  LifecycleFourEyes,
  LifecycleApprovalExecutors,
  LifecycleReviewOpener,
  GrantProposalValidator,
  EngagementMoveService,
  EngagementSuspensionService,
  EngagementHandoverService,
  TeamAdminPolicy,
  TeamAdminService,
  TeamAdminRequestsService,
  TeamAdminCasesService,
  SupportOnboardingGate,
  GovernanceStepUpGate,
];

/**
 * Un proveedor escrito y no registrado hace fallar el arranque con «can't
 * resolve dependencies»: ninguna prueba que instancie la clase a mano lo ve.
 */
describe('DelegatedAccessModule: ciclo de vida y administración delegada', () => {
  it.each(OWN.map((c) => [c.name, c] as const))(
    'declara %s como proveedor',
    (_n, cls) => {
      expect(meta('providers')).toContain(cls);
    },
  );

  it('registra los dos controladores nuevos', () => {
    expect(meta('controllers')).toContain(SupportLifecycleController);
    expect(meta('controllers')).toContain(TeamAdminController);
  });

  it.each(OWN.map((c) => [c.name, c] as const))(
    'cada dependencia de %s se puede resolver desde el módulo',
    (_n, cls) => {
      const params = (Reflect.getMetadata('design:paramtypes', cls) ??
        []) as unknown[];
      const known = [...meta('providers'), ...EXTERNAL];
      for (const dep of params) {
        // Los parámetros opcionales sin metadata (interfaces) llegan como `Object`.
        if (dep === Object) continue;
        expect(known).toContain(dep);
      }
    },
  );

  it('los controladores resuelven sus servicios', () => {
    for (const controller of [
      SupportLifecycleController,
      TeamAdminController,
    ]) {
      const params = (Reflect.getMetadata('design:paramtypes', controller) ??
        []) as unknown[];
      for (const dep of params) expect(meta('providers')).toContain(dep);
    }
  });

  it('exporta lo que consumen el cuatro ojos y el barrido', () => {
    const exported = meta('exports');
    for (const cls of [
      LifecycleApprovalExecutors,
      LifecycleFourEyes,
      LifecycleService,
      EngagementSuspensionService,
      SupportAdminDirectory,
      SupportOnboardingGate,
    ]) {
      expect(exported).toContain(cls);
    }
  });
});
