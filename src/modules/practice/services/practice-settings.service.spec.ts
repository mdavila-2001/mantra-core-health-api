import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PracticeSettingsService } from './practice-settings.service';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
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
  const settingsRepo = { findByPracticeAndKey: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PracticeSettingsService(
    em as any,
    practicesRepo as any,
    settingsRepo,
    logger as any,
  );
  return {
    service: inTenant(service, TENANT_A),
    raw: service,
    tx,
    practicesRepo,
    settingsRepo,
  };
}

describe('PracticeSettingsService (UC-14-07)', () => {
  it('throws when the practice is missing', async () => {
    const d = build();
    d.practicesRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.upsert('p1', 'k', { valueJson: {} } as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('inserts when the key does not exist (created=true)', async () => {
    const d = build();
    d.practicesRepo.findById.mockResolvedValue({ id: 'p1' });
    d.settingsRepo.findByPracticeAndKey.mockResolvedValue(null);
    d.settingsRepo.create.mockReturnValue({ id: 'st1' });
    const res = await d.service.upsert(
      'p1',
      'k',
      { valueJson: { a: 1 } },
      actor,
    );
    expect(res).toEqual({
      id: 'st1',
      practiceId: 'p1',
      settingKey: 'k',
      created: true,
    });
  });

  it('updates when the key exists (created=false)', async () => {
    const d = build();
    d.practicesRepo.findById.mockResolvedValue({ id: 'p1' });
    const existing = {
      id: 'st1',
      valueJson: { a: 1 },
      categoryConceptId: 'c',
      updatedAt: new Date(),
    };
    d.settingsRepo.findByPracticeAndKey.mockResolvedValue(existing);
    const res = await d.service.upsert(
      'p1',
      'k',
      { valueJson: { a: 2 } },
      actor,
    );
    expect(res.created).toBe(false);
    expect(existing.valueJson).toEqual({ a: 2 });
    expect(d.settingsRepo.create).not.toHaveBeenCalled();
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

describe('PracticeSettingsService · alcance de tenant (PRAC-01)', () => {
  it('configurar un ajuste de la práctica de otro tenant: 404 uniforme, igual que inexistente; no escribe', async () => {
    const d = build();
    d.practicesRepo.findById.mockResolvedValue({
      id: 'p1',
      tenantId: TENANT_B,
    });
    const foreign = await expectOutOfScope(
      d.service.upsert('p1', 'k', { valueJson: { a: 1 } } as any, actor),
      'Práctica no encontrada',
    );
    d.practicesRepo.findById.mockResolvedValue(null);
    const missing = await expectOutOfScope(
      d.service.upsert('p1', 'k', { valueJson: { a: 1 } } as any, actor),
      'Práctica no encontrada',
    );

    expect(foreign.getResponse()).toEqual(missing.getResponse());
    expect(d.settingsRepo.findByPracticeAndKey).not.toHaveBeenCalled();
    expect(d.settingsRepo.create).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('sin tenant en el contexto no se escribe el ajuste', async () => {
    const d = build();

    await expect(
      d.raw.upsert('p1', 'k', { valueJson: {} } as any, actor),
    ).rejects.toThrow();
    expect(d.practicesRepo.findById).not.toHaveBeenCalled();
  });
});
