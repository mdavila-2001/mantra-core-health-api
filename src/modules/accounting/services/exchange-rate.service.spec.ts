import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ExchangeRateService } from './exchange-rate.service';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { AccountingErrorReason } from '../accounting.error-reasons';

// La tabla de tipos de cambio es de plataforma: la escribe un actor de plataforma.
const actor = { id: 'admin-1', roles: ['SUPERADMIN'] } as any;
const systemActor = { id: 'sys-1', roles: ['SYSTEM'] } as any;
const tenantAdmin = { id: 'admin-2', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const ratesRepo = {
    findForPair: mockFn(),
    create: mockFn((_em: any, d: any) => ({
      id: 'fx1',
      rate: d.rate,
      validOn: d.validOn,
    })),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new ExchangeRateService(em as any, ratesRepo, logger as any);
  return { service, tx, ratesRepo };
}

const dto = {
  fromCurrencyConceptId: 'usd',
  toCurrencyConceptId: 'pen',
  rate: '3.75',
  validOn: '2026-01-31',
};

describe('ExchangeRateService (UC-16-14)', () => {
  it('crea una tasa nueva cuando no existe', async () => {
    const d = build();
    d.ratesRepo.findForPair.mockResolvedValue(null);
    const res = await d.service.registerRate(dto, actor);
    expect(res.created).toBe(true);
    expect(res.rate).toBe('3.75');
  });

  it('actualiza la tasa existente (upsert)', async () => {
    const d = build();
    const existing = {
      id: 'fx1',
      rate: '3.50',
      validOn: new Date('2026-01-31'),
      updatedAt: new Date(),
    };
    d.ratesRepo.findForPair.mockResolvedValue(existing);
    const res = await d.service.registerRate(dto, actor);
    expect(res.created).toBe(false);
    expect(existing.rate).toBe('3.75');
    expect(d.ratesRepo.create).not.toHaveBeenCalled();
  });

  describe('tabla de plataforma (ACC-01)', () => {
    it('un actor SYSTEM también la escribe', async () => {
      const d = build();
      d.ratesRepo.findForPair.mockResolvedValue(null);
      const res = await d.service.registerRate(dto, systemActor);
      expect(res.created).toBe(true);
    });

    it('un administrador de tenant recibe 403 y no la lee ni la modifica', async () => {
      const d = build();
      const existing = { id: 'fx1', rate: '3.50', validOn: new Date() };
      d.ratesRepo.findForPair.mockResolvedValue(existing);

      const error: any = await d.service.registerRate(dto, tenantAdmin).then(
        () => null,
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(InsufficientRoleException);
      expect(error.getStatus()).toBe(403);
      expect(error.reason).toBe(
        AccountingErrorReason.EXCHANGE_RATE_PLATFORM_ONLY,
      );
      expect(d.ratesRepo.findForPair).not.toHaveBeenCalled();
      expect(d.ratesRepo.create).not.toHaveBeenCalled();
      expect(existing.rate).toBe('3.50');
    });

    it('un administrador de tenant con el rol SYSTEM acotado a otro tenant no pasa', async () => {
      const d = build();
      const scoped = {
        id: 'sys-2',
        roles: ['SYSTEM'],
        scopedRoles: { 'tenant-1': ['SYSTEM'] },
      } as any;

      await expect(d.service.registerRate(dto, scoped)).rejects.toBeInstanceOf(
        InsufficientRoleException,
      );
      expect(d.ratesRepo.create).not.toHaveBeenCalled();
    });

    it('un SUPERADMIN acotado a un tenant no la escribe; el global sí (#1241)', async () => {
      const denied = build();
      await expect(
        denied.service.registerRate(dto, {
          id: 'sa-scoped',
          roles: ['SUPERADMIN'],
          scopedRoles: { 'tenant-1': ['SUPERADMIN'] },
        } as any),
      ).rejects.toBeInstanceOf(InsufficientRoleException);
      expect(denied.ratesRepo.create).not.toHaveBeenCalled();

      const d = build();
      d.ratesRepo.findForPair.mockResolvedValue(null);
      const res = await d.service.registerRate(dto, {
        id: 'sa-g',
        roles: ['SUPERADMIN'],
      } as any);
      expect(res.created).toBe(true);
    });
  });
});
