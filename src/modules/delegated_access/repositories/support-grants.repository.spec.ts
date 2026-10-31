import { jest } from '@jest/globals';
import { AUTHZ } from '../../authz/authz.concepts';
import { DELEG } from '../delegated_access.concepts';
import { SupportGrantActions, SupportScopeGrants } from '../entities';
import { SupportGrantsRepository } from './support-grants.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build(rows: unknown[] = []) {
  const em: any = {
    find: mockFn().mockResolvedValue(rows),
    create: mockFn((_e: unknown, data: unknown) => data),
    remove: mockFn(),
  };
  return { repo: new SupportGrantsRepository(), em };
}

const BASE = {
  tenantId: 't1',
  organizationUserAssignmentId: 'v1',
  targetKindConceptId: DELEG.SUPPORT_TARGET_ALL,
  expansionModeConceptId: DELEG.SUPPORT_EXPANSION_DYNAMIC,
  statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
};

describe('SupportGrantsRepository: efecto, condición y origen (v4.2.72)', () => {
  it('sin efecto ni condición la fila nace como hoy: el efecto lo pone el DEFAULT de la base (ALLOW)', () => {
    const { repo, em } = build();

    const row: any = repo.create(em, { ...BASE, actorUserId: 'admin-1' });

    expect(em.create.mock.calls[0][0]).toBe(SupportScopeGrants);
    expect(row.effectConceptId).toBeUndefined();
    expect(row.conditionJson).toBeUndefined();
    expect(row.conditionSchemaVersion).toBeUndefined();
    expect(row.reasonText).toBeUndefined();
    expect(row.sourceRoleTemplateId).toBeUndefined();
  });

  it('guarda el efecto DENY, la condición con su versión de esquema, el motivo y la plantilla de origen', () => {
    const { repo, em } = build();

    const row: any = repo.create(em, {
      ...BASE,
      effectConceptId: AUTHZ.EFFECT_DENY,
      condition: { schemaVersion: 1, network: { require: 'ORG_RULES' } },
      conditionSchemaVersion: 1,
      reasonText: 'Cierre de caja solo desde el hospital',
      sourceRoleTemplateId: 'tpl-v2',
    });

    expect(row).toMatchObject({
      effectConceptId: AUTHZ.EFFECT_DENY,
      conditionJson: { schemaVersion: 1, network: { require: 'ORG_RULES' } },
      conditionSchemaVersion: 1,
      reasonText: 'Cierre de caja solo desde el hospital',
      sourceRoleTemplateId: 'tpl-v2',
    });
  });

  it('addActions sigue aceptando ids sueltos (compatibilidad con los llamadores actuales)', () => {
    const { repo, em } = build();

    repo.addActions(em, { id: 'g1', tenantId: 't1' }, ['p1', 'p2']);

    expect(em.create).toHaveBeenCalledTimes(2);
    const [entity, data] = em.create.mock.calls[0];
    expect(entity).toBe(SupportGrantActions);
    expect(data).toMatchObject({
      tenantId: 't1',
      supportScopeGrantId: 'g1',
      permissionId: 'p1',
    });
    expect(data.conditionJson).toBeUndefined();
    expect(data.supersededAt).toBeUndefined();
  });

  it('addActions acepta una condición propia por acción', () => {
    const { repo, em } = build();

    repo.addActions(em, { id: 'g1', tenantId: 't1' }, [
      'p1',
      {
        permissionId: 'p2',
        condition: { schemaVersion: 1, limits: { perDay: 20 } },
        conditionSchemaVersion: 1,
      },
    ]);

    expect(em.create.mock.calls[0][1].conditionJson).toBeUndefined();
    expect(em.create.mock.calls[1][1]).toMatchObject({
      permissionId: 'p2',
      conditionJson: { schemaVersion: 1, limits: { perDay: 20 } },
      conditionSchemaVersion: 1,
    });
  });

  it('findActions devuelve todas (como hoy) y findLiveActions solo las no reemplazadas', async () => {
    const { repo, em } = build([]);

    await repo.findActions(em, 'g1');
    await repo.findLiveActions(em, 'g1');

    expect(em.find.mock.calls[0][1]).toEqual({ supportScopeGrantId: 'g1' });
    expect(em.find.mock.calls[1][1]).toEqual({
      supportScopeGrantId: 'g1',
      supersededAt: null,
    });
  });

  it('marca como reemplazadas las filas de alias sin borrarlas', () => {
    const { repo } = build();
    const now = new Date('2026-11-02T12:00:00Z');
    const rows: any[] = [{ id: 'a1' }, { id: 'a2' }];

    repo.markSuperseded(rows, now, 'admin-1');

    for (const r of rows) {
      expect(r).toMatchObject({
        supersededAt: now,
        updatedAt: now,
        updatedByUserId: 'admin-1',
      });
    }
  });

  it('reactivar (revert) limpia la marca de reemplazo', () => {
    const { repo } = build();
    const now = new Date('2026-11-02T12:00:00Z');
    const row: any = { supersededAt: now };
    repo.clearSuperseded([row], now, 'admin-1');
    expect(row.supersededAt).toBeNull();
    expect(row.updatedAt).toEqual(now);
  });
});
