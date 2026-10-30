import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { KpiSnapshotsService } from './kpi-snapshots.service';
import {
  ConflictException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { BillingErrorReason } from '../billing.error-reasons';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Ejecuta cada método del servicio dentro del contexto de tenant dado, como lo
 * hace `TenantContextInterceptor` en una petición real.
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
 * Puerto de `practice` de prueba: la práctica `pr1` es del tenant A y `pr-b`
 * del tenant B; cualquier otra no existe.
 *
 * @returns Doble de `PracticeTenantLookupService`.
 */
function buildLookup() {
  return {
    findTenantOfPractice: mockFn(async (practiceId: string) =>
      practiceId === 'pr1' ? TENANT_A : practiceId === 'pr-b' ? TENANT_B : null,
    ),
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const kpiRepo = { findExisting: mockFn(), create: mockFn() };
  const lookup = buildLookup();
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const raw = new KpiSnapshotsService(
    em as any,
    kpiRepo,
    lookup as any,
    logger as any,
  );
  return {
    service: inTenant(raw, TENANT_A),
    raw,
    asTenantB: inTenant(raw, TENANT_B),
    kpiRepo,
  };
}

describe('KpiSnapshotsService (UC-17-12)', () => {
  it('records the snapshot when none exists for the key', async () => {
    const d = build();
    d.kpiRepo.findExisting.mockResolvedValue(null);
    d.kpiRepo.create.mockReturnValue({
      id: 'k1',
      kpiCode: 'DSO',
      valueNumeric: '42.50',
      recordedAt: new Date('2026-01-01'),
    });

    const res = await d.service.compute(
      { practiceId: 'pr1', kpiCode: 'DSO', valueNumeric: '42.50' },
      actor,
    );

    expect(res.id).toBe('k1');
    expect(res.kpiCode).toBe('DSO');
  });

  it('rejects a duplicate snapshot for the same key (conflict / idempotency)', async () => {
    const d = build();
    d.kpiRepo.findExisting.mockResolvedValue({ id: 'existing' });
    await expect(
      d.service.compute(
        {
          practiceId: 'pr1',
          kpiCode: 'DSO',
          valueNumeric: '42.50',
          computedAt: '2026-01-01T00:00:00.000Z',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('KpiSnapshotsService · alcance de tenant (BILL-01)', () => {
  const dto = (practiceId: string) =>
    ({ practiceId, kpiCode: 'DSO', valueNumeric: '42.50' }) as any;

  it('el snapshot de una práctica de otro tenant responde como práctica inexistente, sin escribir ni consultar', async () => {
    const d = build();
    d.kpiRepo.findExisting.mockResolvedValue({ id: 'existing' });

    const foreign = await d.service
      .compute(dto('pr-b'), actor)
      .catch((e: any) => e);
    const missing = await d.service
      .compute(dto('pr-x'), actor)
      .catch((e: any) => e);

    expect(foreign).toBeInstanceOf(ResourceNotFoundException);
    expect(foreign.reason).toBe(BillingErrorReason.BILLING_PRACTICE_NOT_FOUND);
    expect(foreign.getResponse()).toEqual(missing.getResponse());
    expect(d.kpiRepo.findExisting).not.toHaveBeenCalled();
    expect(d.kpiRepo.create).not.toHaveBeenCalled();
  });

  it('la práctica de A es ajena desde B', async () => {
    const d = build();

    await expect(d.asTenantB.compute(dto('pr1'), actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('sin tenant en el contexto no calcula nada (denegar por defecto)', async () => {
    const d = build();

    const error = await d.raw.compute(dto('pr1'), actor).catch((e: any) => e);

    expect(error.details).toEqual({ reason: 'TENANT_REQUIRED' });
    expect(d.kpiRepo.create).not.toHaveBeenCalled();
  });
});
