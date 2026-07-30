import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AssetService } from './asset.service';
import { ACCT } from '../accounting.concepts';
import {
  ConflictException,
  PreconditionFailedException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const assetRepo = {
    findByCode: mockFn().mockResolvedValue(null),
    createAsset: mockFn((_em: any, d: any) => ({
      id: 'as1',
      code: d.code,
      statusConceptId: d.statusConceptId,
      bookValue: d.bookValue,
    })),
    createValuation: mockFn(),
    createAssignment: mockFn(),
    createPosting: mockFn(),
    activeAssets: mockFn().mockResolvedValue([]),
    findDepreciation: mockFn().mockResolvedValue(null),
    createDepreciation: mockFn(),
  };
  const posting = {
    post: mockFn().mockResolvedValue({
      transactionId: 'tx1',
      entryIds: ['e1', 'e2'],
    }),
    generateNumber: mockFn(() => 'ASSET-1'),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new AssetService(
    em as any,
    assetRepo as any,
    posting as any,
    logger as any,
  );
  return { service, tx, assetRepo, posting };
}

const capDto = {
  practiceId: 'p1',
  code: 'AST-1',
  name: 'Server',
  acquisitionAccountId: 'acc-acq',
  offsetAccountId: 'acc-bank',
  acquisitionCost: '12000.00',
  acquisitionDate: '2026-01-15',
  usefulLifeMonths: 60,
};

describe('AssetService', () => {
  describe('capitalize (UC-16-10)', () => {
    it('rechaza (409) código de activo duplicado', async () => {
      const d = build();
      d.assetRepo.findByCode.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.capitalize(capDto as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('capitaliza el activo y postea su alta', async () => {
      const d = build();
      const res = await d.service.capitalize(capDto, actor);
      expect(res.status).toBe(ACCT.ASSET_ACTIVE);
      expect(res.transactionId).toBe('tx1');
      expect(d.posting.post).toHaveBeenCalledTimes(1);
      expect(d.assetRepo.createPosting).toHaveBeenCalled();
    });
  });

  describe('runDepreciation (UC-16-11)', () => {
    const runDto = {
      practiceId: 'p1',
      fiscalPeriodId: 'fp1',
      depreciationExpenseAccountId: 'exp',
      accumulatedDepreciationAccountId: 'acc',
      postingDate: '2026-01-31',
    };

    it('rechaza si no hay activos elegibles', async () => {
      const d = build();
      d.assetRepo.activeAssets.mockResolvedValue([]);
      await expect(
        d.service.runDepreciation(runDto as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('deprecia un activo elegible (idempotente por periodo)', async () => {
      const d = build();
      const asset = {
        id: 'as1',
        code: 'AST-1',
        usefulLifeMonths: 60,
        acquisitionCost: '12000.00',
        salvageValue: '0',
        bookValue: '12000.00',
        accumulatedDepreciation: '0',
        updatedAt: new Date(),
      };
      d.assetRepo.activeAssets.mockResolvedValue([asset]);
      const res = await d.service.runDepreciation(runDto, actor);
      expect(res.depreciatedAssets).toBe(1);
      expect(d.assetRepo.createDepreciation).toHaveBeenCalled();
      // 12000/60 = 200 → bookValue 11800
      expect(asset.bookValue).toBe('11800.00');
    });

    it('omite un activo ya depreciado en el periodo', async () => {
      const d = build();
      const asset = {
        id: 'as1',
        code: 'A',
        usefulLifeMonths: 60,
        acquisitionCost: '12000.00',
        salvageValue: '0',
        bookValue: '12000.00',
        accumulatedDepreciation: '0',
      };
      d.assetRepo.activeAssets.mockResolvedValue([asset]);
      d.assetRepo.findDepreciation.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.runDepreciation(runDto as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
