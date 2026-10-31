import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { GovernanceRules } from '../entities';
import { GovernanceRulesRepository } from './governance-rules.repository';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const NOW = new Date('2026-11-02T12:00:00Z');

function build(rows: unknown[] = []) {
  const em = {
    find: mockFn().mockResolvedValue(rows),
    findOne: mockFn().mockResolvedValue(rows[0] ?? null),
    create: mockFn((_e: unknown, data: unknown) => data),
  };
  return { repo: new GovernanceRulesRepository(), em };
}

describe('GovernanceRulesRepository', () => {
  it('lee las reglas VIGENTES de la organización: activas y dentro de su ventana', async () => {
    const { repo, em } = build([{ id: 'r1' }]);

    const out = await repo.findActiveForTenant(em as any, 't1', NOW);

    expect(out).toEqual([{ id: 'r1' }]);
    const [entity, where, opts] = em.find.mock.calls[0];
    expect(entity).toBe(GovernanceRules);
    expect(where).toMatchObject({
      tenantId: 't1',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    expect(JSON.stringify(where.$and)).toContain(NOW.toISOString());
    expect(opts.orderBy).toEqual({ createdAt: 'asc', id: 'asc' });
  });

  it('crea una regla activa con la organización del contexto y el autor', () => {
    const { repo, em } = build();

    const row: any = repo.create(em as any, {
      tenantId: 't1',
      ruleKindConceptId: DELEG.GOV_RULE_CEILING,
      roleTemplateCode: 'SECRETARY',
      permissionPattern: 'reports.*.export',
      ruleJson: {},
      ruleSchemaVersion: 1,
      messageText: 'Ninguna secretaria exporta',
      actorUserId: 'admin-1',
    });

    expect(row).toMatchObject({
      tenantId: 't1',
      ruleKindConceptId: DELEG.GOV_RULE_CEILING,
      roleTemplateCode: 'SECRETARY',
      permissionPattern: 'reports.*.export',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      createdByUserId: 'admin-1',
      updatedByUserId: 'admin-1',
    });
    expect(em.create.mock.calls[0][0]).toBe(GovernanceRules);
  });

  it('retira una regla sin borrarla: estado revocado y valid_to = ahora', () => {
    const { repo } = build();
    const row: any = { statusConceptId: CONCEPTS.STATE_ACTIVE, updatedAt: NOW };
    const later = new Date(NOW.getTime() + 1000);

    repo.retire(row, 'admin-2', later);

    expect(row.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
    expect(row.validTo).toEqual(later);
    expect(row.updatedByUserId).toBe('admin-2');
    expect(row.updatedAt).toEqual(later);
  });

  it('lista por organización con filtro de tipo y estado, en orden estable', async () => {
    const { repo, em } = build([]);

    await repo.findByTenant(em as any, 't1', {
      kindConceptId: DELEG.GOV_RULE_DENY_PERMISSION,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });

    const [, where, opts] = em.find.mock.calls[0];
    expect(where).toEqual({
      tenantId: 't1',
      ruleKindConceptId: DELEG.GOV_RULE_DENY_PERMISSION,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    expect(opts.orderBy).toEqual({ createdAt: 'asc', id: 'asc' });
  });

  it('busca por id acotado a la organización (ajeno = nulo, no filtra existencia)', async () => {
    const { repo, em } = build();
    await repo.findById(em as any, 't1', 'r9');
    expect(em.findOne.mock.calls[0][1]).toEqual({ tenantId: 't1', id: 'r9' });
  });
});
