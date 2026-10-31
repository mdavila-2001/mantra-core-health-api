import { DelegatedAccessModule } from './delegated_access.module';
import { SupportDecisionPipeline } from './services/support-decision-pipeline';
import { SupportAccessContextLoader } from './services/support-access-context.loader';
import { SupportGovernanceRules } from './services/support-governance-rules.reader';
import { SupportUsageCounter } from './services/support-usage-counter';
import { SupportApprovalGate } from './services/support-approval-gate';
import { AccessDecisionRecorder } from './services/access-decision-recorder.service';
import { AccessUsageRecorder } from './services/access-usage-recorder';
import { StepUpStore } from '../iam/infrastructure/adapters/redis-step-up.store';
import {
  SUPPORT_DEVICE_PORT,
  SUPPORT_NETWORK_POLICY_PORT,
  SUPPORT_PATIENT_FACTS_PORT,
  SUPPORT_PRESENCE_PORT,
  SUPPORT_SESSION_INFO_PORT,
  SUPPORT_STEP_UP_PORT,
  SUPPORT_TENANT_ZONE_PORT,
} from './services/support-access-context.ports';

const providers = (): readonly any[] =>
  (Reflect.getMetadata('providers', DelegatedAccessModule) ??
    []) as readonly any[];
const imports = (): readonly unknown[] =>
  (Reflect.getMetadata('imports', DelegatedAccessModule) ??
    []) as readonly unknown[];
const exported = (): readonly unknown[] =>
  (Reflect.getMetadata('exports', DelegatedAccessModule) ??
    []) as readonly unknown[];

/**
 * Una clase o puerto que se escribió e importó pero no está en `providers` hace
 * que Nest falle al arrancar con «can't resolve dependencies» en el primer
 * servicio que lo pida; ninguna prueba que instancie la clase a mano lo ve.
 */
describe('DelegatedAccessModule: política con gobierno de accesos (B3b)', () => {
  it.each([
    ['SupportDecisionPipeline', SupportDecisionPipeline],
    ['SupportAccessContextLoader', SupportAccessContextLoader],
    ['SupportGovernanceRules', SupportGovernanceRules],
    ['SupportUsageCounter', SupportUsageCounter],
    ['SupportApprovalGate', SupportApprovalGate],
    ['AccessDecisionRecorder', AccessDecisionRecorder],
    ['AccessUsageRecorder', AccessUsageRecorder],
    [
      'StepUpStore (almacén del paso extra, sin importar IamModule)',
      StepUpStore,
    ],
  ])('declara %s como proveedor', (_n, clase) => {
    expect(providers()).toContain(clase);
  });

  it.each([
    ['SUPPORT_PATIENT_FACTS_PORT', SUPPORT_PATIENT_FACTS_PORT],
    ['SUPPORT_SESSION_INFO_PORT', SUPPORT_SESSION_INFO_PORT],
    ['SUPPORT_NETWORK_POLICY_PORT', SUPPORT_NETWORK_POLICY_PORT],
    ['SUPPORT_DEVICE_PORT', SUPPORT_DEVICE_PORT],
    ['SUPPORT_PRESENCE_PORT', SUPPORT_PRESENCE_PORT],
    ['SUPPORT_STEP_UP_PORT', SUPPORT_STEP_UP_PORT],
    ['SUPPORT_TENANT_ZONE_PORT', SUPPORT_TENANT_ZONE_PORT],
  ])('enlaza el puerto %s a su adaptador', (_n, token) => {
    const bound = providers().find(
      (p) => p && typeof p === 'object' && p.provide === token,
    );
    expect(bound?.useExisting).toBeDefined();
  });

  it('NO importa IamModule: iam → profiles → directory → community → delegated_access cerraría un ciclo de módulos', () => {
    const names = imports().map((m: any) => m?.name ?? m?.module?.name);
    expect(names).not.toContain('IamModule');
  });

  it('exporta lo que necesitan los servicios de gobierno (decidir sin efectos, invalidar la caché de reglas, aprobaciones, contadores)', () => {
    for (const cls of [
      SupportDecisionPipeline,
      SupportGovernanceRules,
      SupportApprovalGate,
      SupportUsageCounter,
    ]) {
      expect(exported()).toContain(cls);
    }
  });
});
