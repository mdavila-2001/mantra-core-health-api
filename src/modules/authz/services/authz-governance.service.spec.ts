import { jest } from '@jest/globals';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { encodeKeysetCursor } from '../../../common/pagination/keyset-cursor';
import { AuthzErrorReason } from '../authz.error-reasons';
import { ACCESS_REVIEWED_ACTION } from '../repositories/authz-governance-read.repository';
import { AuthzGovernanceService } from './authz-governance.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ACTOR = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const USER = {
  id: 'user-1',
  display_name: 'Usuario Uno',
  status_concept_id: CONCEPTS.USER_ACTIVE,
};
const REVIEW_ROW = {
  id: 'rev-1',
  user_id: 'user-1',
  user_display_name: 'Usuario Uno',
  reviewer_user_id: 'admin-1',
  reviewer_display_name: 'Admin',
  reviewed_at: '2026-10-31T10:00:00.000Z',
};

/** Servicio con todas sus dependencias dobladas; `userExists` decide si el usuario existe. */
function build(
  opts: { userExists?: boolean; permissionExists?: boolean } = {},
) {
  const { userExists = true, permissionExists = true } = opts;
  const tx = { flush: mockFn(async () => undefined) };
  const forkEm = {};
  const em: any = {
    fork: mockFn(() => forkEm),
    transactional: mockFn(async (cb: any) => cb(tx)),
  };
  const repo: any = {
    userById: mockFn(async () => (userExists ? USER : null)),
    permissionExists: mockFn(async () => permissionExists),
    countsForUser: mockFn(async () => ({ direct: 1, scope: 2, fields: 3 })),
    lastReviewOf: mockFn(async () => null),
    directGrants: mockFn(async () => []),
    scopeGrants: mockFn(async () => []),
    restrictedFields: mockFn(async () => []),
    holders: mockFn(async () => []),
    reviews: mockFn(async () => [REVIEW_ROW]),
    dueReviews: mockFn(async () => []),
  };
  const adminRepo: any = {
    assignmentsOfUser: mockFn(async () => []),
    globalRolesOf: mockFn(async () => []),
  };
  const pdp: any = {
    evaluate: mockFn(async () => ({ decision: 'DENY', reasons: [] })),
  };
  const auditTrail: any = { record: mockFn(async () => undefined) };
  const logger: any = { setContext: mockFn(), info: mockFn() };
  const service = new AuthzGovernanceService(
    em,
    repo,
    adminRepo,
    pdp,
    auditTrail,
    logger,
  );
  return { service, em, repo, adminRepo, pdp, auditTrail, tx };
}

describe('AuthzGovernanceService · revisión de accesos', () => {
  it('nadie revisa sus propios accesos: 422 y no sella nada', async () => {
    const { service, em, auditTrail, repo } = build();
    const err = await service
      .recordReview(ACTOR.id, ACTOR)
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PreconditionFailedException);
    expect((err as PreconditionFailedException).getResponse()).toMatchObject({
      reason: AuthzErrorReason.ACCESS_REVIEW_SELF_REVIEW_FORBIDDEN,
    });
    expect(em.transactional).not.toHaveBeenCalled();
    expect(auditTrail.record).not.toHaveBeenCalled();
    expect(repo.userById).not.toHaveBeenCalled();
  });

  it('un usuario inexistente responde 404 y no sella nada', async () => {
    const { service, auditTrail } = build({ userExists: false });
    const err = await service
      .recordReview('user-x', ACTOR)
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ResourceNotFoundException);
    expect((err as ResourceNotFoundException).getResponse()).toMatchObject({
      reason: AuthzErrorReason.GOVERNANCE_USER_NOT_FOUND,
    });
    expect(auditTrail.record).not.toHaveBeenCalled();
  });

  it('sella una revisión en la misma transacción y devuelve la fila escrita', async () => {
    const { service, auditTrail, tx, repo } = build();
    const out = await service.recordReview('user-1', ACTOR);
    expect(auditTrail.record).toHaveBeenCalledTimes(1);
    expect(auditTrail.record).toHaveBeenCalledWith(tx, ACTOR, {
      action: ACCESS_REVIEWED_ACTION,
      entity: 'user',
      entityId: 'user-1',
    });
    // La fila se lee con el flush hecho y acotada a quien revisó.
    expect(tx.flush.mock.invocationCallOrder[0]).toBeLessThan(
      repo.reviews.mock.invocationCallOrder[0],
    );
    expect(repo.reviews).toHaveBeenCalledWith(tx, {
      userId: 'user-1',
      reviewerId: ACTOR.id,
      limit: 1,
    });
    expect(out).toMatchObject({
      id: 'rev-1',
      userId: 'user-1',
      reviewerUserId: 'admin-1',
    });
  });

  it('cuentas pendientes: 90 días por defecto y los roles de plataforma como criterio', async () => {
    const { service, repo } = build();
    const page = await service.dueReviews({});
    expect(page.olderThanDays).toBe(90);
    expect(repo.dueReviews.mock.calls[0][1]).toMatchObject({
      olderThanDays: 90,
      c: {
        platformRoleConceptIds: [
          CONCEPTS.ROLE_SECURITY_ADMIN,
          CONCEPTS.ROLE_SUPERADMIN,
        ],
      },
    });
  });

  it('un cursor válido pero de otra forma es un 400, no un 500', async () => {
    const { service } = build();
    await expect(
      service.reviews({ cursor: encodeKeysetCursor({ x: 'y' }) } as any),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('pagina con cursor sólo si hay una fila de más', async () => {
    const { service, repo } = build();
    repo.reviews.mockResolvedValueOnce([
      { ...REVIEW_ROW, id: 'r3' },
      { ...REVIEW_ROW, id: 'r2' },
      { ...REVIEW_ROW, id: 'r1' },
    ]);
    const page = await service.reviews({ limit: 2 } as any);
    expect(page.items.map((i) => i.id)).toEqual(['r3', 'r2']);
    expect(page.nextCursor).not.toBeNull();
    repo.reviews.mockResolvedValueOnce([{ ...REVIEW_ROW, id: 'r1' }]);
    expect((await service.reviews({ limit: 2 } as any)).nextCursor).toBeNull();
  });
});

describe('AuthzGovernanceService · lecturas «quién puede qué»', () => {
  const lecturas: [string, (s: AuthzGovernanceService) => Promise<unknown>][] =
    [
      ['accessMap', (s) => s.accessMap('user-x')],
      ['directGrants', (s) => s.directGrants('user-x', {})],
      ['scopeGrants', (s) => s.scopeGrants('user-x', {})],
      ['restrictedFields', (s) => s.restrictedFields('user-x', {})],
    ];

  it.each(lecturas)(
    '%s sobre un usuario inexistente responde 404 y no consulta nada más',
    async (_n, call) => {
      const { service, repo, adminRepo } = build({ userExists: false });
      const err = await call(service).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect((err as ResourceNotFoundException).getResponse()).toMatchObject({
        reason: AuthzErrorReason.GOVERNANCE_USER_NOT_FOUND,
      });
      expect(repo.directGrants).not.toHaveBeenCalled();
      expect(repo.scopeGrants).not.toHaveBeenCalled();
      expect(repo.restrictedFields).not.toHaveBeenCalled();
      expect(repo.countsForUser).not.toHaveBeenCalled();
      expect(adminRepo.assignmentsOfUser).not.toHaveBeenCalled();
    },
  );

  it('un permiso inexistente responde 404 y no busca titulares', async () => {
    const { service, repo } = build({ permissionExists: false });
    const err = await service.holdersOf('perm-x', {}).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ResourceNotFoundException);
    expect((err as ResourceNotFoundException).getResponse()).toMatchObject({
      reason: AuthzErrorReason.GOVERNANCE_PERMISSION_NOT_FOUND,
    });
    expect(repo.holders).not.toHaveBeenCalled();
  });

  it('una excepción directa sólo es vigente si está ACTIVA y dentro de su ventana', async () => {
    const { service, repo } = build();
    const base = {
      permission_id: 'p',
      code: 'c',
      name: 'n',
      resource: 'r',
      effect_concept_id: 'x',
      scope_concept_id: null,
      tenant_id: null,
      reason: null,
      valid_from: null,
      valid_to: null,
      created_by_user_id: null,
      created_at: '2026-01-01T00:00:00.000Z',
    };
    repo.directGrants.mockResolvedValueOnce([
      {
        ...base,
        id: 'a',
        state_concept_id: CONCEPTS.STATE_ACTIVE,
        in_window: true,
      },
      {
        ...base,
        id: 'b',
        state_concept_id: CONCEPTS.STATE_ACTIVE,
        in_window: false,
      },
      {
        ...base,
        id: 'c',
        state_concept_id: CONCEPTS.STATE_REVOKED,
        in_window: true,
      },
    ]);
    const page = await service.directGrants('user-1', { show: 'ALL' } as any);
    expect(page.items.map((g) => [g.id, g.isEffective])).toEqual([
      ['a', true],
      ['b', false],
      ['c', false],
    ]);
    expect(repo.directGrants.mock.calls[0][2]).toMatchObject({
      onlyEffective: false,
    });
  });
});

describe('AuthzGovernanceService · simulador', () => {
  const dto = { userId: 'user-1', resource: 'patient', action: 'read' } as any;

  it('un usuario inexistente responde 404 y NO consulta al PDP (daría un DENY engañoso)', async () => {
    const { service, pdp } = build({ userExists: false });
    await expect(service.simulate(dto, ACTOR)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(pdp.evaluate).not.toHaveBeenCalled();
  });

  it('delega la decisión en el PDP real sin tocarla y la marca como simulada', async () => {
    const { service, pdp } = build();
    const decision = { decision: 'ALLOW', reasons: ['x'] };
    pdp.evaluate.mockResolvedValueOnce(decision);
    const out = await service.simulate(dto, ACTOR);
    expect(pdp.evaluate).toHaveBeenCalledWith(dto, ACTOR);
    expect(out).toEqual({ simulated: true, decision });
  });
});
