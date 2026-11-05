import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IdentityAssertionsService } from './identity-assertions.service';
import {
  ConflictException,
  PreconditionFailedException,
  runWithTenant,
} from '../../../common';
import { IdentityAssuranceErrorReason } from '../identity_assurance.error-reasons';
import { IDA } from '../identity_assurance.concepts';

const T1 = '11111111-1111-4111-8111-111111111111';

/**
 * Ejecuta cada método del servicio dentro del contexto de tenant, como lo hace
 * `TenantContextInterceptor` en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant activo del contexto.
 * @returns Proxy que fija el tenant en cada llamada.
 */
function scoped<S extends object>(service: S, tenantId: string): S {
  return new Proxy(service, {
    get(target, key) {
      const value = (target as any)[key];
      return typeof value === 'function'
        ? (...args: unknown[]) =>
            runWithTenant(tenantId, () => value.apply(target, args))
        : value;
    },
  });
}

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const assertionsRepo = { findById: mockFn() };
  const casesRepo = { findById: mockFn() };
  const fraudRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const effects = { applyRevoked: mockFn().mockResolvedValue(undefined) };
  // La política de alcance se prueba aparte (identity-case-scope.service.spec.ts).
  const scope = {
    findAuthorizedCase: mockFn((_tx: unknown, id: string) =>
      casesRepo.findById(_tx, id),
    ),
  };
  const raw = new IdentityAssertionsService(
    em as any,
    assertionsRepo as any,
    fraudRepo as any,
    effects as any,
    scope as any,
    logger as any,
  );
  return {
    service: scoped(raw, T1),
    rawService: raw,
    scope,
    tx,
    assertionsRepo,
    casesRepo,
    fraudRepo,
    effects,
  };
}

describe('IdentityAssertionsService', () => {
  it('revokes a live assertion and marks the case revoked (UC-27-11)', async () => {
    const d = build();
    const assertion: any = {
      id: 'as1',
      identityVerificationCaseId: 'k1',
      revokedAt: undefined,
    };
    const kase: any = {
      id: 'k1',
      statusConceptId: IDA.CASE_ASSERTED,
      updatedAt: new Date(),
    };
    d.assertionsRepo.findById.mockResolvedValue(assertion);
    d.casesRepo.findById.mockResolvedValue(kase);
    const res = await d.service.revoke('as1', {}, actor);
    expect(res.caseStatus).toBe(IDA.CASE_REVOKED);
    expect(assertion.revokedAt).toBeInstanceOf(Date);
    expect(assertion.revocationReasonConceptId).toBe(IDA.REVOCATION_FRAUD);
  });

  it('rejects double revocation (conflict)', async () => {
    const d = build();
    d.assertionsRepo.findById.mockResolvedValue({
      id: 'as1',
      identityVerificationCaseId: 'k1',
      revokedAt: new Date(),
    });
    d.casesRepo.findById.mockResolvedValue({ id: 'k1' });
    await expect(
      d.service.revoke('as1', {} as any, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  describe('alcance por tenant (IDA-01)', () => {
    it('revoca consultando el caso con el tenant del contexto', async () => {
      const d = build();
      d.assertionsRepo.findById.mockResolvedValue({
        id: 'as1',
        identityVerificationCaseId: 'k1',
      });
      d.casesRepo.findById.mockResolvedValue({
        id: 'k1',
        statusConceptId: IDA.CASE_ASSERTED,
        updatedAt: new Date(),
      });
      await d.service.revoke('as1', {}, actor);
      expect(d.scope.findAuthorizedCase).toHaveBeenCalledWith(d.tx, 'k1', T1);
    });

    it('la aserción de un caso ajeno responde como inexistente y no se revoca ni se cambia el caso', async () => {
      const d = build();
      const assertion: any = {
        id: 'as-t2',
        identityVerificationCaseId: 'k-t2',
        revokedAt: undefined,
      };
      d.assertionsRepo.findById.mockResolvedValue(assertion);
      d.casesRepo.findById.mockResolvedValue(null);
      const error: any = await d.service
        .revoke('as-t2', {} as any, actor)
        .catch((e: unknown) => e);
      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(
        IdentityAssuranceErrorReason.ASSERTION_NOT_AVAILABLE,
      );
      expect(error.details).toBeUndefined();
      expect(assertion.revokedAt).toBeUndefined();
      expect(d.effects.applyRevoked).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('una aserción ajena y una inexistente responden idéntico', async () => {
      const foreign = build();
      foreign.assertionsRepo.findById.mockResolvedValue({
        id: 'a',
        identityVerificationCaseId: 'k',
      });
      foreign.casesRepo.findById.mockResolvedValue(null);
      const missing = build();
      missing.assertionsRepo.findById.mockResolvedValue(null);
      const a: any = await foreign.service
        .revoke('a', {} as any, actor)
        .catch((e: unknown) => e);
      const b: any = await missing.service
        .revoke('a', {} as any, actor)
        .catch((e: unknown) => e);
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('sin tenant en el contexto se rechaza (412) antes de leer la aserción', async () => {
      const d = build();
      await expect(
        d.rawService.revoke('as1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.assertionsRepo.findById).not.toHaveBeenCalled();
    });
  });
});
