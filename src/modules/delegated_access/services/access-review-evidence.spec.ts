import {
  ROUTING_KEY,
  addRoutedReviewers,
  buildEngagementEvidence,
  hashEvidenceObject,
  routedReviewerIds,
  shownEvidence,
  sodOfGrant,
  usageOfGrant,
  withRouting,
} from './access-review-evidence';
import { DAY, NOW, engagement, grant } from './governance-world.testing';

describe('enrutamiento fuera del hash', () => {
  const evidence = { schemaVersion: 1, summary: 'x', usage90d: [] };

  it('el hash es de lo que se mostró: no cambia si cambia el enrutamiento', () => {
    const a = withRouting(evidence, {
      reviewerKind: 'ADMIN',
      reviewerUserIds: ['a'],
    });
    const b = addRoutedReviewers(a, ['b']);
    expect(hashEvidenceObject(shownEvidence(a))).toBe(
      hashEvidenceObject(evidence),
    );
    expect(hashEvidenceObject(shownEvidence(b))).toBe(
      hashEvidenceObject(evidence),
    );
    expect(hashEvidenceObject(evidence)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('shownEvidence quita solo el enrutamiento y tolera formas rotas', () => {
    const full = withRouting(evidence, {
      reviewerKind: 'ADMIN',
      reviewerUserIds: ['a'],
    });
    expect(ROUTING_KEY in shownEvidence(full)).toBe(false);
    expect(shownEvidence(full)).toEqual(evidence);
    expect(shownEvidence(null)).toEqual({});
    expect(shownEvidence([1])).toEqual({});
  });

  it('routedReviewerIds y addRoutedReviewers: sin repetir, ordenados y sin tocar la evidencia', () => {
    const base = withRouting(evidence, {
      reviewerKind: 'ADMIN',
      reviewerUserIds: ['b', 'a'],
    });
    expect(routedReviewerIds(base)).toEqual(['b', 'a']);
    expect(routedReviewerIds(addRoutedReviewers(base, ['a', 'c']))).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(routedReviewerIds(undefined)).toEqual([]);
    expect(addRoutedReviewers(undefined, ['z'])[ROUTING_KEY]).toEqual({
      reviewerUserIds: ['z'],
    });
  });
});

describe('usageOfGrant y sodOfGrant', () => {
  it('suma por átomo, toma el último uso y ordena', () => {
    const rows = [
      {
        grantId: 'g',
        permissionCode: 'b.x.y',
        permit: 2,
        deny: 1,
        lastUsedAt: new Date(NOW.getTime() - 5 * DAY),
      },
      {
        grantId: 'g',
        permissionCode: 'a.x.y',
        permit: 1,
        deny: 0,
        lastUsedAt: null,
      },
      {
        grantId: 'g',
        permissionCode: 'b.x.y',
        permit: 3,
        deny: 0,
        lastUsedAt: new Date(NOW.getTime() - DAY),
      },
      {
        grantId: 'otro',
        permissionCode: 'c.x.y',
        permit: 9,
        deny: 9,
        lastUsedAt: null,
      },
    ];
    const u = usageOfGrant(rows, 'g');
    expect(u.map((x) => x.atom)).toEqual(['a.x.y', 'b.x.y']);
    expect(u[1]).toMatchObject({
      permitCount: 5,
      denyCount: 1,
      lastUsedAt: new Date(NOW.getTime() - DAY),
    });
  });

  it('solo los hallazgos que involucran a la concesión, con código y acción', () => {
    const f: any = [
      {
        ruleCode: 'SOD-1',
        action: 'BLOCK',
        grantIdsA: ['g'],
        grantIdsB: ['h'],
      },
      { ruleCode: 'SOD-2', action: 'WARN', grantIdsA: ['x'], grantIdsB: ['y'] },
    ];
    expect(sodOfGrant(f, 'h')).toEqual([
      { ruleCode: 'SOD-1', action: 'BLOCK' },
    ]);
  });
});

describe('buildEngagementEvidence', () => {
  const e = engagement({
    engagementId: 'e1',
    subjectUserId: 'u1',
    supervisorUserId: 'owner',
    nextRecertificationAt: new Date('2026-11-23T14:30:00Z'),
    grants: [
      grant({
        grantId: 'g1',
        actions: ['agenda.appointment.cancel'],
        aboveCeiling: true,
      }),
      grant({
        grantId: 'g2',
        actions: ['agenda.appointment.view'],
        effect: 'DENY',
      }),
    ],
  });

  it('describe lo que la persona puede hacer hoy (permisos vivos ALLOW), sin datos de pacientes y de forma determinista', () => {
    const usage = [
      {
        grantId: 'g1',
        permissionCode: 'agenda.appointment.cancel',
        permit: 4,
        deny: 0,
        lastUsedAt: NOW,
      },
    ];
    const a = buildEngagementEvidence({
      engagement: e,
      usage,
      openAlerts: 2,
      now: NOW,
    });
    const b = buildEngagementEvidence({
      engagement: e,
      usage,
      openAlerts: 2,
      now: NOW,
    });
    expect(hashEvidenceObject(a)).toBe(hashEvidenceObject(b));
    expect(a).toMatchObject({
      kind: 'ENGAGEMENT',
      openAlerts: 2,
      aboveCeiling: true,
      grants: [expect.objectContaining({ grantId: 'g1' })],
      usage90d: [
        expect.objectContaining({
          atom: 'agenda.appointment.cancel',
          permit: 4,
        }),
      ],
    });
    expect(a.atoms.map((x) => x.code)).toEqual(['agenda.appointment.cancel']);
    expect(a.summary).toMatch(/con dueño de cuenta/);
  });
});
