import { jest } from '@jest/globals';
import type {
  GovernanceWorld,
  WorldEngagement,
  WorldGrant,
} from './governance-world';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
export const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Reloj de las pruebas del contrato: martes 2026-11-03 10:30 (La Paz, UTC−4). */
export const NOW = new Date('2026-11-03T14:30:00Z');
export const DAY = 86_400_000;

export const ids = {
  tenant: '11111111-1111-4111-8111-111111111111',
  admin: '0a0a0a0a-0000-4000-8000-00000000a001',
  admin2: '0a0a0a0a-0000-4000-8000-00000000a002',
  sofia: '0a0a0a0a-0000-4000-8000-0000000050f1',
  marcos: '0a0a0a0a-0000-4000-8000-00000000ac05',
  ana: '0a0a0a0a-0000-4000-8000-0000000000a1',
  mario: '0a0a0a0a-0000-4000-8000-0000000000a2',
  perez: '0a0a0a0a-0000-4000-8000-0000000000d1',
  svcEco: 'da47af6a-fc7a-5d56-93cb-7bbe45b26ce5',
  svcCardio: 'da47af6a-fc7a-5d56-93cb-7bbe45b26ce6',
  praPerez: 'bbbbbbbb-0000-4000-8000-0000000000b1',
};

/** Concesión de prueba: por omisión, viva, `ALLOW`, de un servicio. */
export function grant(
  over: Partial<WorldGrant> & { grantId: string },
): WorldGrant {
  return {
    targetKind: 'SERVICE',
    expansionMode: 'DYNAMIC',
    healthcareServiceId: ids.svcEco,
    actions: [],
    effect: 'ALLOW',
    active: true,
    createdAt: new Date(NOW.getTime() - 100 * DAY),
    grantedAt: new Date(NOW.getTime() - 100 * DAY),
    grantedByUserId: ids.admin,
    approvedByUserIds: [],
    lastUsedAt: new Date(NOW.getTime() - 2 * DAY),
    ...over,
  } as WorldGrant;
}

/** Vínculo de prueba: activo, sin dueño ni conflictos. */
export function engagement(
  over: Partial<WorldEngagement> & {
    engagementId: string;
    subjectUserId: string;
  },
): WorldEngagement {
  return {
    tenantId: ids.tenant,
    supervisorUserId: null,
    templateCode: 'SECRETARY',
    state: 'ACTIVE',
    grants: [],
    sodGrantIds: [],
    sodFindings: [],
    createdAt: new Date(NOW.getTime() - 200 * DAY),
    lastCertifiedAt: null,
    nextRecertificationAt: null,
    recertifyEveryMonths: 12,
    validTo: null,
    acceptedPractitionerProfileIds: [],
    ...over,
  } as WorldEngagement;
}

/** Mundo de prueba con el reloj del contrato. */
export function worldOf(
  engagements: readonly WorldEngagement[],
  now: Date = NOW,
): GovernanceWorld {
  return { tenantId: ids.tenant, now, engagements };
}

/** Actor de sesión: administrador de seguridad de la organización. */
export const securityAdmin = (id: string = ids.admin): any => ({
  id,
  sessionId: 'sess-1',
  roles: ['SECURITY_ADMIN', 'USER'],
});

/** Actor de sesión: personal de apoyo (administrador delegado, jefe de servicio, doctor, …). */
export const staff = (id: string): any => ({
  id,
  sessionId: 'sess-2',
  roles: ['SUPPORT_STAFF', 'USER'],
});

/** Transacción simulada: `transactional` pasa de largo y `flush` no hace nada. */
export function fakeEm(): any {
  const em: any = {
    flush: mockFn().mockResolvedValue(undefined),
    isInTransaction: () => true,
    fork: () => em,
    transactional: (fn: any) => fn(em),
    execute: mockFn().mockResolvedValue([]),
    find: mockFn().mockResolvedValue([]),
  };
  return em;
}

export const loggerStub = {
  setContext: mockFn(),
  info: mockFn(),
  warn: mockFn(),
  error: mockFn(),
  debug: mockFn(),
};

/**
 * Repositorio de campañas e ítems en memoria: las filas viven en las listas
 * devueltas, y `decide` es el real del repositorio (solo asigna campos).
 */
export function reviewRepoFake(
  AccessReviewRepositoryClass: new () => any,
  concepts: { draft: string; open: string; pending: string },
) {
  const campaigns: any[] = [];
  const items: any[] = [];
  const repo = new AccessReviewRepositoryClass();
  repo.findCampaignById = mockFn(
    async (_e: any, _t: string, id: string) =>
      campaigns.find((c) => c.id === id) ?? null,
  );
  repo.findCampaigns = mockFn(async (_e: any, _t: string, status?: string[]) =>
    campaigns.filter((c) => !status || status.includes(c.statusConceptId)),
  );
  repo.findOpenCampaignsAcrossTenants = mockFn(async () =>
    campaigns.filter((c) => c.statusConceptId === concepts.open),
  );
  repo.createCampaign = mockFn((_e: any, data: any) => {
    const row = {
      id: `c-${campaigns.length + 1}`,
      tenantId: data.tenantId,
      name: data.name,
      kindConceptId: data.kindConceptId,
      scopeJson: data.scope,
      scopeSchemaVersion: data.scopeSchemaVersion,
      filtersJson: data.filters,
      dueAt: data.dueAt,
      graceDays: data.graceDays ?? 7,
      reminderDaysBeforeJson: data.reminderDaysBefore ?? [7, 3, 1],
      escalateAfterDays: data.escalateAfterDays ?? 3,
      uncertifiedActionConceptId: data.uncertifiedActionConceptId,
      ownerUserId: data.ownerUserId,
      statusConceptId: concepts.draft,
    };
    campaigns.push(row);
    return row;
  });
  repo.createItems = mockFn((_e: any, data: any[]) =>
    data.map((d) => {
      const row = {
        id: `i-${items.length + 1}`,
        tenantId: d.tenantId,
        accessReviewCampaignId: d.campaignId,
        organizationUserAssignmentId: d.organizationUserAssignmentId,
        supportScopeGrantId: d.supportScopeGrantId,
        reviewerUserId: d.reviewerUserId,
        reviewerKindConceptId: d.reviewerKindConceptId,
        decisionConceptId: concepts.pending,
        evidenceJson: d.evidence,
        evidenceHash: d.evidenceHash,
        dueAt: d.dueAt,
        reminderCount: 0,
      };
      items.push(row);
      return row;
    }),
  );
  repo.findItemsByCampaign = mockFn(async (_e: any, id: string) =>
    items.filter((i) => i.accessReviewCampaignId === id),
  );
  return { repo, campaigns, items };
}
