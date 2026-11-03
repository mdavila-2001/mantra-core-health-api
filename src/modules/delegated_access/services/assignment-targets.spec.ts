import { describe, expect, it, jest } from '@jest/globals';
import {
  assertAssignmentTargets,
  assertSingleUnitHead,
} from './assignment-targets';

function tx(rows: Record<string, unknown[]>) {
  return {
    execute: jest.fn<any>().mockImplementation(async (sql: string) => {
      for (const [k, v] of Object.entries(rows)) if (sql.includes(k)) return v;
      return [];
    }),
  } as any;
}

describe('F5g · destinos de una asignación (§F5g)', () => {
  it('permitido: espacio del tenant con alcance SPACE', async () => {
    const t = tx({
      tenant_memberships: [{ tenant_id: 't1' }],
      care_spaces: [{ tenant_id: 't1', site: 's1' }],
    });
    await expect(
      assertAssignmentTargets(t, 'm1', 'SPACE', { careSpaceId: 'sp1' }),
    ).resolves.toBeUndefined();
  });

  it('fail-closed por tenant: espacio de otro tenant → 404', async () => {
    const t = tx({
      tenant_memberships: [{ tenant_id: 't1' }],
      care_spaces: [{ tenant_id: 't2', site: 's9' }],
    });
    await expect(
      assertAssignmentTargets(t, 'm1', 'SPACE', { careSpaceId: 'sp1' }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('alcance sin destino 422; unidad de otra sede 422', async () => {
    const t = tx({ tenant_memberships: [{ tenant_id: 't1' }] });
    await expect(
      assertAssignmentTargets(t, 'm1', 'UNIT', {}),
    ).rejects.toMatchObject({ reason: 'ASSIGNMENT_SCOPE_TARGET_REQUIRED' });
    const t2 = tx({
      tenant_memberships: [{ tenant_id: 't1' }],
      practice_sites: [{ tenant_id: 't1', site: 's1', practice: 'p1' }],
      clinical_units: [{ tenant_id: 't1', site: 's2' }],
    });
    await expect(
      assertAssignmentTargets(t2, 'm1', 'UNIT', {
        practiceSiteId: 's1',
        clinicalUnitId: 'u1',
      }),
    ).rejects.toMatchObject({
      reason: 'ASSIGNMENT_SCOPE_TARGET_MISMATCH',
    });
  });

  it('segundo jefe vigente de la unidad → 409 UNIT_HEAD_ALREADY_ASSIGNED', async () => {
    await expect(
      assertSingleUnitHead(
        tx({ organization_user_assignments: [{ id: 'a1' }] }),
        'u1',
      ),
    ).rejects.toMatchObject({
      reason: 'UNIT_HEAD_ALREADY_ASSIGNED',
    });
    await expect(assertSingleUnitHead(tx({}), 'u1')).resolves.toBeUndefined();
  });
});
