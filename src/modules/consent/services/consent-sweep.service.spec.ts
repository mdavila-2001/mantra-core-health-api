import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ConsentSweepService } from './consent-sweep.service';
import { CONS } from '../consent.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const consentsRepo = { findExpirable: mockFn().mockResolvedValue([]) };
  const authRepo = { findExpirable: mockFn().mockResolvedValue([]) };
  const restrictionsRepo = { findExpirable: mockFn().mockResolvedValue([]) };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new ConsentSweepService(
    em as any,
    consentsRepo as any,
    authRepo as any,
    restrictionsRepo as any,
    eventsRepo,
    logger as any,
  );
  return { service, tx, consentsRepo, authRepo, restrictionsRepo, eventsRepo };
}

describe('ConsentSweepService', () => {
  it('sweep (UC-07-11) returns zero counts when nothing is expirable', async () => {
    const d = build();
    const res = await d.service.sweep(actor);
    expect(res).toEqual({
      expiredConsents: 0,
      expiredAuthorizations: 0,
      expiredRestrictions: 0,
    });
  });

  it('sweep (UC-07-11) expires directives and records an expired event per row', async () => {
    const d = build();
    const consent = {
      id: 'c1',
      statusConceptId: CONS.CONSENT_ACTIVE,
      updatedAt: new Date(),
    };
    const auth = {
      id: 'h1',
      statusConceptId: CONS.HIPAA_ACTIVE,
      updatedAt: new Date(),
    };
    const restriction = {
      id: 'r1',
      statusConceptId: CONS.RESTRICTION_ACTIVE,
      updatedAt: new Date(),
    };
    d.consentsRepo.findExpirable.mockResolvedValue([consent]);
    d.authRepo.findExpirable.mockResolvedValue([auth]);
    d.restrictionsRepo.findExpirable.mockResolvedValue([restriction]);

    const res = await d.service.sweep(actor);

    expect(res).toEqual({
      expiredConsents: 1,
      expiredAuthorizations: 1,
      expiredRestrictions: 1,
    });
    expect(consent.statusConceptId).toBe(CONS.CONSENT_EXPIRED);
    expect(auth.statusConceptId).toBe(CONS.HIPAA_EXPIRED);
    expect(restriction.statusConceptId).toBe(CONS.RESTRICTION_EXPIRED);
    expect(d.eventsRepo.record).toHaveBeenCalledTimes(3);
  });
});
