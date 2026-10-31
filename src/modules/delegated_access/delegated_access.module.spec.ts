import { DelegatedAccessModule } from './delegated_access.module';
import {
  AccessAnomaliesRepository,
  AccessDecisionLogRepository,
  AccessReviewRepository,
  FourEyesRepository,
  GovernanceRulesRepository,
  GrantUsageStatsRepository,
  LifecycleRepository,
  PatientRestrictionFlagsRepository,
  SodRepository,
} from './repositories';

/** Los proveedores que el módulo declara, leídos de su metadata. */
function providers(): readonly unknown[] {
  return (Reflect.getMetadata('providers', DelegatedAccessModule) ??
    []) as readonly unknown[];
}

/**
 * Un repositorio escrito e importado no se inyecta si no entra en `providers`:
 * Nest falla al arrancar con `can't resolve dependencies` en el primer servicio
 * que lo pida. Ninguna prueba que instancie la clase a mano lo ve.
 */
describe('DelegatedAccessModule: persistencia del gobierno de accesos', () => {
  it.each([
    ['GovernanceRulesRepository', GovernanceRulesRepository],
    ['SodRepository', SodRepository],
    ['FourEyesRepository', FourEyesRepository],
    ['AccessReviewRepository', AccessReviewRepository],
    ['LifecycleRepository', LifecycleRepository],
    ['PatientRestrictionFlagsRepository', PatientRestrictionFlagsRepository],
    ['AccessDecisionLogRepository', AccessDecisionLogRepository],
    ['GrantUsageStatsRepository', GrantUsageStatsRepository],
    ['AccessAnomaliesRepository', AccessAnomaliesRepository],
  ])('declara %s como proveedor', (_nombre, clase) => {
    expect(providers()).toContain(clase);
  });
});
