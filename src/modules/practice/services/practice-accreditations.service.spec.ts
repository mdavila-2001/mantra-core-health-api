import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PracticeAccreditationsService } from './practice-accreditations.service';
import { PRAC } from '../practice.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { PracticeErrorReason } from '../practice.error-reasons';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Devuelve el servicio de modo que cada llamada corra con `tenantId` como
 * tenant activo, igual que lo deja el `TenantContextInterceptor`.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant del contexto de la petición.
 * @returns Un proxy que ejecuta cada método dentro de `runWithTenant`.
 */
function inTenant<T extends object>(service: T, tenantId: string): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

/**
 * Mock de `PracticesRepository.findById`. Las prácticas de prueba son del tenant
 * activo (`TENANT_A`) salvo que la propia práctica declare otro `tenantId`; sin
 * configurar, resuelve una práctica del tenant activo (la dueña de los hijos).
 *
 * @returns Un `jest.fn` cuyo `mockResolvedValue` sella el tenant de la práctica.
 */
function practiceLookupMock(): any {
  const lookup = mockFn();
  const resolve = lookup.mockResolvedValue.bind(lookup);
  const stamp = (row: any) =>
    row && typeof row === 'object' && row.tenantId === undefined
      ? Object.assign(row, { tenantId: TENANT_A })
      : row;
  lookup.mockResolvedValue = (row: any) => resolve(stamp(row));
  resolve(stamp({ id: 'p1' }));
  return lookup;
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const practicesRepo = { findById: practiceLookupMock() };
  const sitesRepo = { findById: mockFn() };
  const accreditationsRepo = { findById: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PracticeAccreditationsService(
    em as any,
    practicesRepo as any,
    sitesRepo as any,
    accreditationsRepo,
    logger as any,
  );
  return {
    service: inTenant(service, TENANT_A),
    raw: service,
    tx,
    practicesRepo,
    sitesRepo,
    accreditationsRepo,
  };
}

describe('PracticeAccreditationsService', () => {
  describe('create (UC-14-02)', () => {
    it('throws when the practice is missing', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.create('p1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects a site that does not belong to the practice', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({ id: 'p1' });
      d.sitesRepo.findById.mockResolvedValue({ id: 's1', practiceId: 'other' });
      await expect(
        d.service.create('p1', { practiceSiteId: 's1' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates a PENDING accreditation', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({ id: 'p1' });
      const created = {
        id: 'a1',
        practiceId: 'p1',
        verificationStatusConceptId: PRAC.ACCRED_PENDING,
        createdAt: new Date(),
      };
      d.accreditationsRepo.create.mockReturnValue(created);
      const res = await d.service.create('p1', {}, actor);
      expect(res.verificationStatus).toBe(PRAC.ACCRED_PENDING);
      expect(d.tx.flush).toHaveBeenCalled();
    });
  });

  describe('verify (UC-14-03)', () => {
    it('throws when the accreditation is missing', async () => {
      const d = build();
      d.accreditationsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.verify('a1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects verifying an accreditation that is not pending', async () => {
      const d = build();
      d.accreditationsRepo.findById.mockResolvedValue({
        id: 'a1',
        verificationStatusConceptId: PRAC.ACCRED_VERIFIED,
        updatedAt: new Date(),
      });
      await expect(
        d.service.verify('a1', { decision: 'VERIFIED' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('transitions PENDING -> VERIFIED', async () => {
      const d = build();
      const acc = {
        id: 'a1',
        practiceId: 'p1',
        verificationStatusConceptId: PRAC.ACCRED_PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      d.accreditationsRepo.findById.mockResolvedValue(acc);
      const res = await d.service.verify(
        'a1',
        { decision: 'VERIFIED' } as any,
        actor,
      );
      expect(res.verificationStatus).toBe(PRAC.ACCRED_VERIFIED);
      expect(acc.verificationStatusConceptId).toBe(PRAC.ACCRED_VERIFIED);
    });

    it('expires an accreditation on EXPIRED decision', async () => {
      const d = build();
      const acc = {
        id: 'a1',
        practiceId: 'p1',
        verificationStatusConceptId: PRAC.ACCRED_VERIFIED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      d.accreditationsRepo.findById.mockResolvedValue(acc);
      const res = await d.service.verify(
        'a1',
        { decision: 'EXPIRED' } as any,
        actor,
      );
      expect(res.verificationStatus).toBe(PRAC.ACCRED_EXPIRED);
    });
  });
});

/** Aserciones del 404 uniforme de PRAC-01. */
async function expectOutOfScope(promise: Promise<unknown>, message: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  const exception = error as ResourceNotFoundException;
  expect(exception.getStatus()).toBe(404);
  expect(exception.message).toBe(message);
  expect(exception.reason).toBe(
    PracticeErrorReason.PRACTICE_RESOURCE_OUT_OF_SCOPE,
  );
  expect(exception.details).toBeUndefined();
  return exception;
}

describe('PracticeAccreditationsService · alcance de tenant (PRAC-01)', () => {
  it('registrar una acreditación en la práctica de otro tenant: 404 uniforme y no persiste', async () => {
    const d = build();
    d.practicesRepo.findById.mockResolvedValue({
      id: 'p1',
      tenantId: TENANT_B,
    });

    await expectOutOfScope(
      d.service.create('p1', {} as any, actor),
      'Práctica no encontrada',
    );

    expect(d.accreditationsRepo.create).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('verificar la acreditación de otro tenant: 404 uniforme, igual que inexistente; su estado no cambia', async () => {
    const d = build();
    const accreditation: any = {
      id: 'a1',
      practiceId: 'p-de-b',
      verificationStatusConceptId: PRAC.ACCRED_PENDING,
    };
    d.accreditationsRepo.findById.mockResolvedValue(accreditation);
    d.practicesRepo.findById.mockResolvedValue({
      id: 'p-de-b',
      tenantId: TENANT_B,
    });
    const foreign = await expectOutOfScope(
      d.service.verify('a1', { decision: 'VERIFIED' } as any, actor),
      'Acreditación no encontrada',
    );
    d.accreditationsRepo.findById.mockResolvedValue(null);
    const missing = await expectOutOfScope(
      d.service.verify('a1', { decision: 'VERIFIED' } as any, actor),
      'Acreditación no encontrada',
    );

    expect(foreign.getResponse()).toEqual(missing.getResponse());
    expect(accreditation.verificationStatusConceptId).toBe(PRAC.ACCRED_PENDING);
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('caducar la acreditación de otro tenant tampoco la cambia', async () => {
    const d = build();
    const accreditation: any = {
      id: 'a1',
      practiceId: 'p-de-b',
      verificationStatusConceptId: PRAC.ACCRED_VERIFIED,
    };
    d.accreditationsRepo.findById.mockResolvedValue(accreditation);
    d.practicesRepo.findById.mockResolvedValue({
      id: 'p-de-b',
      tenantId: TENANT_B,
    });

    await expectOutOfScope(
      d.service.verify('a1', { decision: 'EXPIRED' } as any, actor),
      'Acreditación no encontrada',
    );

    expect(accreditation.verificationStatusConceptId).toBe(
      PRAC.ACCRED_VERIFIED,
    );
  });

  it('sin tenant en el contexto no se verifica nada', async () => {
    const d = build();

    await expect(
      d.raw.verify('a1', { decision: 'VERIFIED' } as any, actor),
    ).rejects.toThrow();
    expect(d.accreditationsRepo.findById).not.toHaveBeenCalled();
  });
});
