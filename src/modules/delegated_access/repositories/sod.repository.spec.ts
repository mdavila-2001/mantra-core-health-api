import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { SodExceptions, SodRules } from '../entities';
import { SodRepository } from './sod.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const NOW = new Date('2026-11-02T12:00:00Z');

function build(rows: unknown[] = []) {
  const em: any = {
    find: mockFn().mockResolvedValue(rows),
    findOne: mockFn().mockResolvedValue(rows[0] ?? null),
    create: mockFn((_e: unknown, data: unknown) => data),
    isInTransaction: mockFn().mockReturnValue(true),
    transactional: mockFn((fn: any) => fn(em)),
  };
  return { repo: new SodRepository(), em };
}

describe('SodRepository: reglas', () => {
  it('las reglas visibles de una organización son las suyas y las de plataforma (tenant NULL), activas', async () => {
    const { repo, em } = build([{ id: 'a' }]);

    await repo.findRulesVisible(em, 't1');

    const [entity, where, opts] = em.find.mock.calls[0];
    expect(entity).toBe(SodRules);
    expect(where).toEqual({
      $or: [{ tenantId: 't1' }, { tenantId: null }],
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    expect(opts.orderBy).toEqual({
      code: 'asc',
      versionNumber: 'desc',
      id: 'asc',
    });
  });

  it('las reglas de plataforma se leen sin organización', async () => {
    const { repo, em } = build();
    await repo.findPlatformRules(em);
    expect(em.find.mock.calls[0][1]).toEqual({
      tenantId: null,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  });

  it('crea una regla de organización con versión 1 y la endurece sobre una de plataforma', () => {
    const { repo, em } = build();

    const row: any = repo.createRule(em, {
      tenantId: 't1',
      code: 'SOD-BILL-03',
      name: 'Crear citas y emitir comprobantes',
      baseRuleId: 'plataforma-1',
      atomsA: ['agenda.appointment.create'],
      atomsB: ['billing.receipt.issue'],
      scopeConceptId: DELEG.SOD_SCOPE_PERSON,
      actionConceptId: DELEG.SOD_ACTION_BLOCK,
      isHard: true,
      actorUserId: 'admin-1',
    });

    expect(row).toMatchObject({
      tenantId: 't1',
      baseRuleId: 'plataforma-1',
      atomsAJson: ['agenda.appointment.create'],
      atomsBJson: ['billing.receipt.issue'],
      isHard: true,
      versionNumber: 1,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      createdByUserId: 'admin-1',
    });
  });

  it('una regla de plataforma nace sin organización', () => {
    const { repo, em } = build();
    const row: any = repo.createRule(em, {
      id: 'fijo',
      code: 'SOD-BILL-01',
      name: 'Cobrar y anular',
      atomsA: ['billing.payment.collect'],
      atomsB: ['billing.receipt.void'],
      scopeConceptId: DELEG.SOD_SCOPE_PERSON,
      actionConceptId: DELEG.SOD_ACTION_BLOCK,
      isHard: true,
    });
    expect(row.id).toBe('fijo');
    expect(row.tenantId).toBeUndefined();
  });
});

describe('SodRepository: excepciones', () => {
  it('lee las excepciones activas y vigentes, de una organización o de sus vínculos', async () => {
    const { repo, em } = build([]);

    await repo.findActiveExceptions(em, 't1', NOW, ['v1', 'v2']);

    const [entity, where] = em.find.mock.calls[0];
    expect(entity).toBe(SodExceptions);
    expect(where).toMatchObject({
      tenantId: 't1',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      validFrom: { $lte: NOW },
      validTo: { $gt: NOW },
      organizationUserAssignmentId: { $in: ['v1', 'v2'] },
    });
  });

  it('crea una excepción activa con su cuatro ojos y vigencia', () => {
    const { repo, em } = build();
    const row: any = repo.createException(em, {
      tenantId: 't1',
      sodRuleId: 'r1',
      organizationUserAssignmentId: 'v1',
      fourEyesRequestId: 'f1',
      justificationText:
        'Consultorio pequeño: la misma persona cobra y agenda.',
      validFrom: NOW,
      validTo: new Date(NOW.getTime() + 86_400_000),
      actorUserId: 'admin-1',
    });
    expect(row).toMatchObject({
      sodRuleId: 'r1',
      fourEyesRequestId: 'f1',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      createdByUserId: 'admin-1',
    });
  });

  it('revoca antes de tiempo dejando quién, cuándo y por qué', () => {
    const { repo } = build();
    const row: any = { statusConceptId: CONCEPTS.STATE_ACTIVE };

    repo.revokeException(row, 'admin-2', 'Ya no hace falta', NOW);

    expect(row).toMatchObject({
      statusConceptId: CONCEPTS.STATE_REVOKED,
      revokedAt: NOW,
      revokedByUserId: 'admin-2',
      revokeReasonText: 'Ya no hace falta',
      updatedByUserId: 'admin-2',
    });
  });

  it('el barrido de vencimientos cruza organizaciones solo para LEER las vencidas y activas', async () => {
    const { repo, em } = build([{ id: 'e1', tenantId: 't9' }]);

    const out = await repo.findDueExceptionsAcrossTenants(em, NOW, 50);

    expect(out).toEqual([{ id: 'e1', tenantId: 't9' }]);
    const [, where, opts] = em.find.mock.calls[0];
    expect(where).toEqual({
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      validTo: { $lte: NOW },
    });
    expect(opts.limit).toBe(50);
  });

  it('marca la excepción como vencida', () => {
    const { repo } = build();
    const row: any = { statusConceptId: CONCEPTS.STATE_ACTIVE };
    repo.markExpired(row, NOW);
    expect(row.statusConceptId).toBe(CONCEPTS.STATE_EXPIRED);
    expect(row.updatedAt).toEqual(NOW);
  });
});
