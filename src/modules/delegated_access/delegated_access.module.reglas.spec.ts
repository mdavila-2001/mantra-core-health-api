import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { AuditTrailService } from '../audit/services/audit-trail.service';
import { OutboxService } from '../messaging/services/outbox.service';
import { DelegatedAccessModule } from './delegated_access.module';
import { AccessCatalogController } from './controllers/access-catalog.controller';
import { AccessExplainController } from './controllers/access-explain.controller';
import { FourEyesController } from './controllers/four-eyes.controller';
import { GovernanceRulesController } from './controllers/governance-rules.controller';
import { GovernanceSodController } from './controllers/governance-sod.controller';
import { PatientRestrictionFlagsController } from './controllers/patient-restriction-flags.controller';
import { AccessExplainService } from './services/access-explain.service';
import { AccessSummaryService } from './services/access-summary.service';
import { ApproverDirectoryBuilder } from './services/four-eyes-directory';
import {
  FourEyesExecutors,
  FourEyesService,
} from './services/four-eyes.service';
import { GovernanceAccessGate } from './services/governance-access.gate';
import { GovernanceRulesService } from './services/governance-rules.service';
import { GovernanceSettingsService } from './services/governance-settings.service';
import { GovernanceStepUpGate } from './services/governance-step-up.gate';
import { LegacyNormalizationService } from './services/legacy-normalization.service';
import { PatientRestrictionFlagsService } from './services/patient-restriction-flags.service';
import { SodService } from './services/sod.service';
import { SupportEngagementsService } from './services/support-engagements.service';
import { EngagementRequestsService } from './services/engagement-requests.service';
import { SupportGrantWriteGuard } from './services/support-grant-write.guard';
import { SupportPersonGrantsLoader } from './services/support-person-grants.loader';

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
  GovernanceStepUpGate,
  GovernanceSettingsService,
  GovernanceAccessGate,
  GovernanceRulesService,
  SupportPersonGrantsLoader,
  FourEyesExecutors,
  ApproverDirectoryBuilder,
  FourEyesService,
  SodService,
  SupportGrantWriteGuard,
  AccessExplainService,
  AccessSummaryService,
  LegacyNormalizationService,
  PatientRestrictionFlagsService,
];

const CONTROLLERS = [
  GovernanceRulesController,
  GovernanceSodController,
  FourEyesController,
  AccessExplainController,
  AccessCatalogController,
  PatientRestrictionFlagsController,
];

/**
 * Un proveedor escrito y no registrado hace fallar el arranque con «can't
 * resolve dependencies»: ninguna prueba que instancie la clase a mano lo ve.
 */
describe('DelegatedAccessModule: reglas, SoD, cuatro ojos, explicar y simular', () => {
  it.each(OWN.map((c) => [c.name, c] as const))(
    'declara %s como proveedor',
    (_n, cls) => {
      expect(meta('providers')).toContain(cls);
    },
  );

  it.each(CONTROLLERS.map((c) => [c.name, c] as const))(
    'registra %s',
    (_n, cls) => {
      expect(meta('controllers')).toContain(cls);
    },
  );

  it.each(
    [...OWN, SupportEngagementsService, EngagementRequestsService].map(
      (c) => [c.name, c] as const,
    ),
  )('cada dependencia de %s se puede resolver desde el módulo', (_n, cls) => {
    const params = (Reflect.getMetadata('design:paramtypes', cls) ??
      []) as unknown[];
    const known = [...meta('providers'), ...EXTERNAL];
    for (const dep of params) {
      // Los parámetros opcionales sin metadata (interfaces) llegan como `Object`.
      if (dep === Object) continue;
      expect(known).toContain(dep);
    }
  });

  it.each(CONTROLLERS.map((c) => [c.name, c] as const))(
    '%s resuelve sus servicios',
    (_n, controller) => {
      const params = (Reflect.getMetadata('design:paramtypes', controller) ??
        []) as unknown[];
      for (const dep of params) expect(meta('providers')).toContain(dep);
    },
  );

  it('el guardián de escritura llega a los dos servicios que otorgan permisos', () => {
    for (const service of [
      SupportEngagementsService,
      EngagementRequestsService,
    ]) {
      const params = (Reflect.getMetadata('design:paramtypes', service) ??
        []) as unknown[];
      expect(params).toContain(SupportGrantWriteGuard);
    }
  });

  it('exporta explicar, cuatro ojos y SoD para los demás servicios de gobierno', () => {
    const exported = meta('exports');
    for (const cls of [AccessExplainService, FourEyesService, SodService]) {
      expect(exported).toContain(cls);
    }
  });
});
