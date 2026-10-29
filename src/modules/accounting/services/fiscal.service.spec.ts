import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { FiscalService } from './fiscal.service';
import { ACCT } from '../accounting.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { AccountingErrorReason } from '../accounting.error-reasons';
import {
  buildScope,
  expectScopeNotFound,
  inTenant,
} from './accounting-scope.testing';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build(ownOffice = false) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const fiscalRepo = {
    findYearByCode: mockFn().mockResolvedValue(null),
    createYear: mockFn((_em: any, d: any) => ({
      id: 'y1',
      code: d.code,
      statusConceptId: d.statusConceptId,
    })),
    createPeriod: mockFn(() => ({ id: `per-${Math.random()}` })),
    findPeriodById: mockFn(),
    findYearById: mockFn().mockResolvedValue({ id: 'y1', practiceId: 'p1' }),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const { scope } = buildScope({ fiscalRepo });
  const practices = { isOwnOffice: mockFn().mockResolvedValue(ownOffice) };
  const service = inTenant(
    new FiscalService(
      em as any,
      fiscalRepo as any,
      scope,
      logger as any,
      practices as any,
    ),
  );
  return { service, tx, fiscalRepo, practices };
}

describe('FiscalService', () => {
  describe('openFiscalYear (UC-16-04)', () => {
    const dto = {
      practiceId: 'p1',
      code: 'FY2026',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      periods: [
        { code: '2026-01', startDate: '2026-01-01', endDate: '2026-01-31' },
        { code: '2026-02', startDate: '2026-02-01', endDate: '2026-02-28' },
      ],
    };

    it('crea el ejercicio y sus periodos', async () => {
      const d = build();
      const res = await d.service.openFiscalYear(dto, actor);
      expect(res.status).toBe(ACCT.YEAR_OPEN);
      expect(res.periodIds).toHaveLength(2);
      expect(d.fiscalRepo.createPeriod).toHaveBeenCalledTimes(2);
    });

    it('rechaza (409) un código de ejercicio duplicado', async () => {
      const d = build();
      d.fiscalRepo.findYearByCode.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.openFiscalYear(dto as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('quién abre el ejercicio (S-8)', () => {
    const dto = {
      practiceId: 'p1',
      code: 'FY2026',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      periods: [
        { code: '2026-01', startDate: '2026-01-01', endDate: '2026-01-31' },
      ],
    };
    const practitioner = {
      id: 'doc-1',
      roles: ['USER', 'PRACTITIONER'],
    } as any;

    it.each(['SECURITY_ADMIN', 'ACCOUNTING_APPROVER', 'SUPERADMIN'])(
      'la administración (%s) abre el ejercicio',
      async (role) => {
        const d = build();
        const res = await d.service.openFiscalYear(dto, {
          id: 'u1',
          roles: [role],
        } as any);
        expect(res.status).toBe(ACCT.YEAR_OPEN);
        expect(d.practices.isOwnOffice).not.toHaveBeenCalled();
      },
    );

    it('el médico titular abre el ejercicio de su consultorio propio', async () => {
      const d = build(true);
      const res = await d.service.openFiscalYear(dto, practitioner);
      expect(res.status).toBe(ACCT.YEAR_OPEN);
      expect(d.practices.isOwnOffice).toHaveBeenCalledWith('p1', 'doc-1');
    });

    it('un médico sobre una práctica que no es su consultorio recibe 403 y no se escribe nada', async () => {
      const d = build(false);
      const error = await d.service.openFiscalYear(dto, practitioner).then(
        () => null,
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(InsufficientRoleException);
      const forbidden = error as InsufficientRoleException;
      expect(forbidden.getStatus()).toBe(403);
      expect(forbidden.reason).toBe(
        AccountingErrorReason.FISCAL_YEAR_OPEN_NOT_ALLOWED,
      );
      expect(forbidden.message).toContain('médico titular');
      expect(d.fiscalRepo.findYearByCode).not.toHaveBeenCalled();
      expect(d.fiscalRepo.createYear).not.toHaveBeenCalled();
    });

    it('un actor sin rol de administración ni de médico recibe 403', async () => {
      const d = build(true);
      await expect(
        d.service.openFiscalYear(dto, { id: 'p-1', roles: ['PATIENT'] } as any),
      ).rejects.toBeInstanceOf(InsufficientRoleException);
    });

    it('otra organización sigue respondiendo 404 antes de mirar el rol', async () => {
      const d = build(false);
      await expectScopeNotFound(
        d.service.openFiscalYear({ ...dto, practiceId: 'p-b' }, practitioner),
        AccountingErrorReason.PRACTICE_NOT_FOUND,
      );
      expect(d.practices.isOwnOffice).not.toHaveBeenCalled();
    });
  });

  describe('lockPeriod (UC-16-05)', () => {
    it('lanza 404 si el periodo no existe', async () => {
      const d = build();
      d.fiscalRepo.findPeriodById.mockResolvedValue(null);
      await expect(d.service.lockPeriod('x', {}, actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('rechaza bloquear un periodo no ABIERTO', async () => {
      const d = build();
      d.fiscalRepo.findPeriodById.mockResolvedValue({
        id: 'per1',
        fiscalYearId: 'y1',
        statusConceptId: ACCT.PERIOD_LOCKED,
      });
      await expect(
        d.service.lockPeriod('per1', {}, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('bloquea un periodo ABIERTO', async () => {
      const d = build();
      const period = {
        id: 'per1',
        fiscalYearId: 'y1',
        statusConceptId: ACCT.PERIOD_OPEN,
        updatedAt: new Date(),
      };
      d.fiscalRepo.findPeriodById.mockResolvedValue(period);
      const res = await d.service.lockPeriod('per1', {}, actor);
      expect(res).toEqual({ ok: true, id: 'per1' });
      expect(period.statusConceptId).toBe(ACCT.PERIOD_LOCKED);
    });
  });

  describe('alcance de tenant (ACC-01)', () => {
    it('abrir un ejercicio en una práctica de otra organización responde como inexistente', async () => {
      const foreign = build();
      const absent = build();
      const dto = {
        practiceId: 'p-b',
        code: 'FY2026',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        periods: [
          { code: '2026-01', startDate: '2026-01-01', endDate: '2026-01-31' },
        ],
      };

      const a = await expectScopeNotFound(
        foreign.service.openFiscalYear(dto, actor),
        AccountingErrorReason.PRACTICE_NOT_FOUND,
      );
      const b = await expectScopeNotFound(
        absent.service.openFiscalYear(
          { ...dto, practiceId: 'no-existe' },
          actor,
        ),
        AccountingErrorReason.PRACTICE_NOT_FOUND,
      );

      expect(a.getResponse()).toEqual(b.getResponse());
      expect(foreign.fiscalRepo.findYearByCode).not.toHaveBeenCalled();
      expect(foreign.fiscalRepo.createYear).not.toHaveBeenCalled();
      expect(foreign.fiscalRepo.createPeriod).not.toHaveBeenCalled();
    });

    it('bloquear un periodo de otra organización responde como inexistente y lo deja abierto', async () => {
      const foreign = build();
      const foreignPeriod = {
        id: 'per-b',
        fiscalYearId: 'y-b',
        statusConceptId: ACCT.PERIOD_OPEN,
        updatedAt: new Date(),
      };
      foreign.fiscalRepo.findPeriodById.mockResolvedValue(foreignPeriod);
      foreign.fiscalRepo.findYearById.mockResolvedValue({
        id: 'y-b',
        practiceId: 'p-b',
      });
      const absent = build();
      absent.fiscalRepo.findPeriodById.mockResolvedValue(null);

      const a = await expectScopeNotFound(
        foreign.service.lockPeriod('per-b', {}, actor),
        AccountingErrorReason.FISCAL_PERIOD_NOT_FOUND,
      );
      const b = await expectScopeNotFound(
        absent.service.lockPeriod('per-b', {}, actor),
        AccountingErrorReason.FISCAL_PERIOD_NOT_FOUND,
      );

      expect(a.getResponse()).toEqual(b.getResponse());
      expect(foreignPeriod.statusConceptId).toBe(ACCT.PERIOD_OPEN);
    });

    it('un periodo ajeno ya bloqueado no delata su estado (404, no 422)', async () => {
      const d = build();
      d.fiscalRepo.findPeriodById.mockResolvedValue({
        id: 'per-b',
        fiscalYearId: 'y-b',
        statusConceptId: ACCT.PERIOD_LOCKED,
      });
      d.fiscalRepo.findYearById.mockResolvedValue({
        id: 'y-b',
        practiceId: 'p-b',
      });

      await expectScopeNotFound(
        d.service.lockPeriod('per-b', {}, actor),
        AccountingErrorReason.FISCAL_PERIOD_NOT_FOUND,
      );
    });
  });
});
