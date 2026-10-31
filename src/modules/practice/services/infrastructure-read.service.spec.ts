import { describe, expect, it, jest } from '@jest/globals';
import { ResourceNotFoundException } from '../../../common';
import {
  PARENT_RULE_SEED,
  TYPOLOGY_RULE_SEED,
} from '../domain/structure/structure-catalog';
import { InfrastructureReadService } from './infrastructure-read.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'tenant-a';
const actor = { id: 'o1', roles: ['USER'] } as any;

function build() {
  const space = { id: 'c1', tenantId: TENANT, practiceSiteId: 's1' };
  const em: any = {
    execute: mockFn().mockResolvedValue([{ id: 'o1', display_name: 'Ana' }]),
  };
  const access = {
    requireSpace: mockFn(async (_e: any, id: string, tenant: string) => {
      if (id !== 'c1' || tenant !== TENANT)
        throw new ResourceNotFoundException('no');
      return space;
    }),
    assertCanRead: mockFn().mockResolvedValue(undefined),
  };
  const rulesRepo = {
    parentRules: mockFn().mockResolvedValue(PARENT_RULE_SEED),
    typologyRules: mockFn().mockResolvedValue(TYPOLOGY_RULE_SEED),
  };
  const t = (s: string) => new Date(`2026-10-30T10:00:${s}Z`);
  const historyRepo = {
    timeline: mockFn().mockResolvedValue([
      {
        revisionNo: 1,
        recordedAt: t('01'),
        changedByUserId: 'o1',
        dataSnapshot: { name: 'A', parentSpaceId: null, rowVersion: 1 },
      },
      {
        revisionNo: 2,
        recordedAt: t('02'),
        changedByUserId: 'o1',
        dataSnapshot: { name: 'B', parentSpaceId: null, rowVersion: 2 },
      },
      {
        revisionNo: 3,
        recordedAt: t('03'),
        changedByUserId: 'o1',
        dataSnapshot: { name: 'B', parentSpaceId: 'p1', rowVersion: 3 },
      },
      {
        revisionNo: 4,
        recordedAt: t('04'),
        changedByUserId: 'x',
        dataSnapshot: {
          name: 'B',
          parentSpaceId: 'p1',
          rowVersion: 4,
          statusConceptId: 'r',
          lifecycleAction: 'retire',
          lifecycleReason: 'obra',
        },
      },
    ]),
  };
  const service = new InfrastructureReadService(
    em,
    access as any,
    {} as any,
    {} as any,
    {} as any,
    rulesRepo as any,
    historyRepo as any,
  );
  return { service, historyRepo };
}

describe('InfrastructureReadService', () => {
  it('catálogo: raíz como {parent: null} y reglas de la base', async () => {
    const d = build();
    const cat = await d.service.catalog();
    expect(cat.parentRules).toEqual(
      expect.arrayContaining([
        { parent: null, child: 'LOC_FORM_BUILDING' },
        { parent: 'LOC_FORM_ROOM', child: 'LOC_FORM_BED' },
      ]),
    );
    expect(cat.forms.find((f) => f.code === 'LOC_FORM_BED')?.fhirCode).toBe(
      'bd',
    );
    expect(cat.functions.find((f) => f.code === 'SPACE_TYPE_ROOM')?.key).toBe(
      'GENERIC',
    );
    expect(cat.lifecycle.map((c) => c.code)).toEqual([
      'SPACE_PLANNED',
      'SPACE_ACTIVE',
      'SPACE_SUSPENDED',
      'SPACE_RETIRED',
    ]);
  });

  it('historial: del más nuevo al más viejo, con acción, motivo y actor', async () => {
    const d = build();
    const h = await d.service.spaceHistory('c1', actor, TENANT);
    expect(h.map((e) => e.action)).toEqual([
      'retire',
      'moved',
      'updated',
      'created',
    ]);
    expect(h[0]).toMatchObject({
      id: 'c1:4',
      reason: 'obra',
      actorName: null,
      rowVersion: 4,
    });
    expect(h[2]).toMatchObject({ summary: 'name', actorName: 'Ana' });
  });

  it('historial de un espacio de otro tenant: 404 sin leer la historia', async () => {
    const d = build();
    await expect(
      d.service.spaceHistory('c1', actor, 'tenant-b'),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.historyRepo.timeline).not.toHaveBeenCalled();
  });
});
