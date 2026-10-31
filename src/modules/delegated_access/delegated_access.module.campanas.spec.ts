import 'reflect-metadata';
import { DelegatedAccessModule } from './delegated_access.module';
import {
  AccessReviewCampaignsController,
  GovernanceReportsController,
  GovernanceSweepController,
  MyAccessReviewsController,
  PractitionerGovernanceController,
} from './controllers';
import { GovernanceQueriesRepository } from './repositories';
import {
  AccessReviewAutomationService,
  AccessReviewCampaignsService,
  AccessReviewClosureService,
  AccessReviewItemFactory,
  AccessReviewItemsService,
  GovernanceAccessService,
  GovernanceAnomaliesService,
  GovernanceAudit,
  GovernanceCampaignSettings,
  GovernanceEvents,
  GovernanceExportService,
  GovernanceMatrixService,
  GovernancePanelService,
  GovernanceReportsService,
  GovernanceSweepService,
  GovernanceWorldLoader,
  RecertificationReviewLink,
  ReviewerResolverService,
} from './services';
import { MessagingModule } from '../messaging/messaging.module';
import { AuditModule } from '../audit/audit.module';

const providers = (): readonly any[] =>
  (Reflect.getMetadata('providers', DelegatedAccessModule) ??
    []) as readonly any[];
const controllers = (): readonly any[] =>
  (Reflect.getMetadata('controllers', DelegatedAccessModule) ??
    []) as readonly any[];

const SERVICES = [
  GovernanceQueriesRepository,
  GovernanceWorldLoader,
  ReviewerResolverService,
  GovernanceEvents,
  GovernanceAudit,
  GovernanceAccessService,
  GovernanceCampaignSettings,
  AccessReviewItemFactory,
  AccessReviewClosureService,
  AccessReviewCampaignsService,
  AccessReviewItemsService,
  AccessReviewAutomationService,
  RecertificationReviewLink,
  GovernanceMatrixService,
  GovernanceReportsService,
  GovernanceAnomaliesService,
  GovernanceExportService,
  GovernancePanelService,
  GovernanceSweepService,
];
const CONTROLLERS = [
  AccessReviewCampaignsController,
  MyAccessReviewsController,
  GovernanceReportsController,
  PractitionerGovernanceController,
  GovernanceSweepController,
];

/**
 * Una clase escrita e importada que no entra en `providers` (o que pide una
 * dependencia que el módulo no resuelve) hace fallar a Nest al arrancar con
 * «can't resolve dependencies»; ninguna prueba que instancie la clase a mano lo
 * ve. Aquí se comprueba cada dependencia declarada de cada clase del bloque.
 */
describe('DelegatedAccessModule: campañas, informes, anomalías y barridos (B4b)', () => {
  it.each(SERVICES.map((c) => [c.name, c] as const))(
    'declara %s como proveedor',
    (_n, cls) => {
      expect(providers()).toContain(cls);
    },
  );

  it.each(CONTROLLERS.map((c) => [c.name, c] as const))(
    'declara %s como controlador',
    (_n, cls) => {
      expect(controllers()).toContain(cls);
    },
  );

  it('toda dependencia de constructor de estas clases la resuelve el módulo (propia, de AuditModule o de MessagingModule) o es opcional', () => {
    const own = new Set<unknown>(
      providers().map((p) =>
        p && typeof p === 'object' && 'provide' in p ? p.provide : p,
      ),
    );
    const external = new Set<string>([
      'EntityManager',
      'PostgreSqlEntityManager',
      'PinoLogger',
    ]);
    const missing: string[] = [];
    for (const cls of [...SERVICES, ...CONTROLLERS]) {
      const types = (Reflect.getMetadata('design:paramtypes', cls) ??
        []) as unknown[];
      const optional = new Set<number>(
        Reflect.getMetadata('optional:paramtypes', cls) ?? [],
      );
      const injected = (Reflect.getMetadata('self:paramtypes', cls) ??
        []) as Array<{ index: number; param: unknown }>;
      types.forEach((t, i) => {
        const token = injected.find((x) => x.index === i)?.param ?? t;
        const name = (token as { name?: string })?.name ?? String(token);
        if (own.has(token) || external.has(name) || optional.has(i)) return;
        if (name === 'OutboxService' || name === 'AuditTrailService') return;
        missing.push(`${cls.name}[${i}] ${name}`);
      });
    }
    expect(missing).toEqual([]);
  });

  it('importa los módulos que exportan OutboxService y AuditTrailService', () => {
    const imported = (Reflect.getMetadata('imports', DelegatedAccessModule) ??
      []) as unknown[];
    expect(imported).toContain(MessagingModule);
    expect(imported).toContain(AuditModule);
  });
});
