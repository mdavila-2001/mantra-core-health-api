import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';
import { FUNCTIONS } from '../../../practice/infrastructure-catalog';
import { PRAC } from '../../../practice/practice.concepts';
import { PharmacyInventoryErrorReason as R } from '../../pharmacy_inventory.error-reasons';
import { PracticeStockPointAccessAdapter } from './practice-stock-point-access.adapter';

const TENANT = 'tenant-1';
const PRACTICE_SITE = 'practice-site-1';
const fn = (code: string) => FUNCTIONS.byInput(code)!.id;

/** `tx.execute` que contesta según un fragmento del SQL. */
function fakeTx(answers: Record<string, unknown[]>) {
  const execute = (jest.fn as any)(async (sql: string) => {
    for (const [needle, rows] of Object.entries(answers)) {
      if (sql.includes(needle)) return rows;
    }
    return [];
  });
  return { tx: { execute } as any, execute };
}

const space = (over: Record<string, unknown> = {}) => ({
  id: 'space-1',
  practice_site_id: PRACTICE_SITE,
  space_type_concept_id: fn('SPACE_FN_PHARMACY'),
  status_concept_id: PRAC.SPACE_ACTIVE,
  valid_from: null,
  valid_to: null,
  ...over,
});
const unit = (over: Record<string, unknown> = {}) => ({
  id: 'unit-1',
  practice_site_id: PRACTICE_SITE,
  status_concept_id: PRAC.UNIT_ACTIVE,
  ...over,
});

describe('PracticeStockPointAccessAdapter', () => {
  const infra = { assertCan: (jest.fn as any)() };
  const service = new PracticeStockPointAccessAdapter(infra as any);
  beforeEach(() => infra.assertCan.mockReset());

  describe('autoridad', () => {
    it('el personal de farmacia del tenant opera sin pasar por la estructura', async () => {
      const { tx } = fakeTx({});
      const actor = { id: 'u', roles: ['PHARMACY_STAFF'] } as any;
      await service.assertCanManage(tx, actor, TENANT, PRACTICE_SITE);
      expect(infra.assertCan).not.toHaveBeenCalled();
    });

    it('el resto pasa por infra.stock.manage sobre la sede de práctica de la farmacia', async () => {
      const { tx } = fakeTx({});
      const actor = { id: 'u', roles: [] } as any;
      await service.assertCanManage(tx, actor, TENANT, PRACTICE_SITE);
      expect(infra.assertCan).toHaveBeenCalledWith(
        actor,
        'infra.stock.manage',
        { siteId: PRACTICE_SITE },
        tx,
      );
    });

    it('si la estructura niega, el error sube tal cual (404/403)', async () => {
      const { tx } = fakeTx({});
      infra.assertCan.mockRejectedValue(new ResourceNotFoundException('x'));
      await expect(
        service.assertCanManage(
          tx,
          { id: 'u', roles: [] } as any,
          TENANT,
          PRACTICE_SITE,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('ver: farmacia exige que el espacio sea del tenant; enfermería pasa por infra.stock.view', async () => {
      const found = fakeTx({
        'from practice.care_spaces': [{ id: 'space-1' }],
      });
      await service.assertCanView(
        found.tx,
        { id: 'u', roles: ['PHARMACY_STAFF'] } as any,
        TENANT,
        'space-1',
      );
      const missing = fakeTx({});
      await expect(
        service.assertCanView(
          missing.tx,
          { id: 'u', roles: ['PHARMACY_STAFF'] } as any,
          TENANT,
          'space-x',
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      const nurse = { id: 'n', roles: [] } as any;
      await service.assertCanView(missing.tx, nurse, TENANT, 'space-1');
      expect(infra.assertCan).toHaveBeenCalledWith(
        nurse,
        'infra.stock.view',
        { careSpaceId: 'space-1' },
        missing.tx,
      );
    });
  });

  describe('resolve', () => {
    it('un espacio del tenant, de la sede, punto de stock y activo se acepta', async () => {
      const { tx, execute } = fakeTx({
        'from practice.care_spaces': [space()],
      });
      await expect(
        service.resolve(tx, TENANT, PRACTICE_SITE, { careSpaceId: 'space-1' }),
      ).resolves.toEqual({ careSpaceId: 'space-1', clinicalUnitId: null });
      // se pregunta siempre acotado por el tenant del contexto
      expect(execute.mock.calls[0][1]).toEqual(['space-1', TENANT]);
    });

    it('espacio o unidad ajenos al tenant: 404 uniforme', async () => {
      const { tx } = fakeTx({});
      for (const input of [{ careSpaceId: 'x' }, { clinicalUnitId: 'x' }]) {
        const failure = await service
          .resolve(tx, TENANT, PRACTICE_SITE, input)
          .catch((e: unknown) => e);
        expect(failure).toBeInstanceOf(ResourceNotFoundException);
        expect((failure as any).response.reason).toBe(
          R.PHARMACY_INVENTORY_RESOURCE_NOT_AVAILABLE,
        );
      }
    });

    it('un espacio de otra sede: 422 STOCK_POINT_SITE_MISMATCH', async () => {
      const { tx } = fakeTx({
        'from practice.care_spaces': [space({ practice_site_id: 'otra' })],
      });
      await expect(
        service.resolve(tx, TENANT, PRACTICE_SITE, { careSpaceId: 'space-1' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          reason: R.STOCK_POINT_SITE_MISMATCH,
        }),
      });
    });

    it('una unidad de otra sede: 422 STOCK_POINT_SITE_MISMATCH', async () => {
      const { tx } = fakeTx({
        'from practice.clinical_units': [unit({ practice_site_id: 'otra' })],
      });
      await expect(
        service.resolve(tx, TENANT, PRACTICE_SITE, {
          clinicalUnitId: 'unit-1',
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          reason: R.STOCK_POINT_SITE_MISMATCH,
        }),
      });
    });

    it('una función sin la bandera stockPoint: 422 SPACE_NOT_STOCK_POINT', async () => {
      const { tx } = fakeTx({
        'from practice.care_spaces': [
          space({ space_type_concept_id: fn('SPACE_FN_CONSULTING_ROOM') }),
        ],
      });
      await expect(
        service.resolve(tx, TENANT, PRACTICE_SITE, { careSpaceId: 'space-1' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          reason: R.SPACE_NOT_STOCK_POINT,
          details: { functionCode: 'SPACE_FN_CONSULTING_ROOM' },
        }),
      });
    });

    it('un espacio clausurado o aún no vigente no recibe stock', async () => {
      for (const over of [
        { status_concept_id: PRAC.SPACE_RETIRED },
        { valid_from: new Date(Date.now() + 86_400_000).toISOString() },
        { valid_to: new Date(Date.now() - 86_400_000).toISOString() },
      ]) {
        const { tx } = fakeTx({ 'from practice.care_spaces': [space(over)] });
        await expect(
          service.resolve(tx, TENANT, PRACTICE_SITE, {
            careSpaceId: 'space-1',
          }),
        ).rejects.toMatchObject({
          response: expect.objectContaining({
            reason: R.STOCK_POINT_SPACE_NOT_ACTIVE,
          }),
        });
      }
    });

    it('una unidad suspendida: 422 STOCK_POINT_UNIT_NOT_ACTIVE', async () => {
      const { tx } = fakeTx({
        'from practice.clinical_units': [unit({ status_concept_id: 'otro' })],
      });
      await expect(
        service.resolve(tx, TENANT, PRACTICE_SITE, {
          clinicalUnitId: 'unit-1',
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          reason: R.STOCK_POINT_UNIT_NOT_ACTIVE,
        }),
      });
    });

    it('el espacio que no cuelga de la unidad: 422 STOCK_POINT_UNIT_MISMATCH', async () => {
      const { tx } = fakeTx({
        'with recursive anc': [],
        'from practice.care_spaces': [space()],
        'from practice.clinical_units': [unit()],
      });
      await expect(
        service.resolve(tx, TENANT, PRACTICE_SITE, {
          careSpaceId: 'space-1',
          clinicalUnitId: 'unit-1',
        }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('espacio y unidad coherentes se aceptan', async () => {
      const { tx } = fakeTx({
        'with recursive anc': [{ ok: 1 }],
        'from practice.care_spaces': [space()],
        'from practice.clinical_units': [unit()],
      });
      await expect(
        service.resolve(tx, TENANT, PRACTICE_SITE, {
          careSpaceId: 'space-1',
          clinicalUnitId: 'unit-1',
        }),
      ).resolves.toEqual({ careSpaceId: 'space-1', clinicalUnitId: 'unit-1' });
    });
  });
});
