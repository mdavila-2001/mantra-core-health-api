import { jest } from '@jest/globals';
import {
  ConflictException,
  PreconditionFailedException,
} from '../../../../common';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { PharmacyInventoryErrorReason as R } from '../../pharmacy_inventory.error-reasons';
import { allowAllScope } from '../scope/pharmacy-inventory-scope.testing';
import { DispenseMedicationUseCase } from '../medication-dispensations/dispense-medication.use-case';
import { TransferInventoryUseCase } from './transfer-inventory.use-case';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const actor = { id: 'u1' } as any;

/** Botiquín con 10 en mano, 8 reservados: disponible 2. */
const position = () => ({
  onHandQuantity: '10',
  reservedQuantity: '8',
  quarantineQuantity: '0',
  availableQuantity: '2',
});

function ward(type: string | undefined) {
  const scope = allowAllScope();
  (scope.requireLocationInPharmacy as any).mockImplementation(
    async (_t: unknown, _p: unknown, id: string) => ({
      id,
      pharmacySiteId: 'site-1',
      locationTypeConceptId: id === 'from-1' ? type : undefined,
    }),
  );
  (scope.requireLocation as any).mockImplementation(
    async (_t: unknown, _s: unknown, id: string) => ({
      id,
      pharmacySiteId: 'site-1',
      locationTypeConceptId: type,
    }),
  );
  return scope;
}

describe('botiquín de piso · available_quantity', () => {
  describe('transferencia', () => {
    const build = (type: string | undefined) => {
      const tx = { flush: mockFn() };
      const em = { transactional: mockFn((cb: any) => cb(tx)) };
      const stock = {
        findByKeyForUpdate: mockFn(async () => position()),
      };
      const ledger = { nextSequence: mockFn(), append: mockFn() };
      return new TransferInventoryUseCase(
        em as any,
        stock as any,
        ledger as any,
        ward(type),
        { info: mockFn() } as any,
      );
    };
    const dto = {
      pharmacySiteId: 'site-1',
      fromLocationId: 'from-1',
      toLocationId: 'to-1',
      pharmacyProductId: 'p1',
      quantity: 5,
    } as any;

    it('desde un botiquín sin disponible suficiente: 409 INSUFFICIENT_AVAILABLE_STOCK', async () => {
      const failure = await build(PINV.LOCATION_TYPE_WARD_STOCK)
        .execute('ph-1', dto, actor)
        .catch((e: unknown) => e);
      expect(failure).toBeInstanceOf(ConflictException);
      expect((failure as any).response.reason).toBe(
        R.INSUFFICIENT_AVAILABLE_STOCK,
      );
      expect((failure as any).response.details).toMatchObject({
        available: 2,
        requested: 5,
      });
    });

    it('desde cualquier otra ubicación conserva su regla de siempre (422)', async () => {
      await expect(
        build(PINV.LOCATION_TYPE_SHELF).execute('ph-1', dto, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('dispensa', () => {
    const build = (type: string | undefined) => {
      const tx = { flush: mockFn() };
      const em = { transactional: mockFn((cb: any) => cb(tx)) };
      const dispensations = {
        create: mockFn(() => ({ id: 'disp1' })),
        createLine: mockFn(() => ({ id: 'dl1' })),
        findByIdempotencyKey: mockFn(),
      };
      const reservations = {
        findById: mockFn(async () => ({
          id: 'res-1',
          pharmacyId: 'pharmacy-1',
          pharmacySiteId: 'site-1',
          reservationStatusConceptId: 'no-pedido',
        })),
        findLinesByReservation: mockFn(async () => []),
      };
      const stock = { findByKeyForUpdate: mockFn(async () => position()) };
      const ledger = {
        nextSequence: mockFn(async () => '1'),
        append: mockFn(() => ({ id: 'led1' })),
      };
      return new DispenseMedicationUseCase(
        em as any,
        dispensations as any,
        reservations as any,
        stock as any,
        ledger as any,
        ward(type),
        { info: mockFn() } as any,
      );
    };
    const dto = (extra: object = {}) =>
      ({
        pharmacySiteId: 'site-1',
        lines: [
          {
            inventoryLocationId: 'from-1',
            pharmacyProductId: 'p1',
            dispensedQuantity: 5,
          },
        ],
        ...extra,
      }) as any;

    it('sin reserva, desde un botiquín sin disponible: 409 INSUFFICIENT_AVAILABLE_STOCK', async () => {
      const failure = await build(PINV.LOCATION_TYPE_WARD_STOCK)
        .execute('pharmacy-1', dto(), actor)
        .catch((e: unknown) => e);
      expect(failure).toBeInstanceOf(ConflictException);
      expect((failure as any).response.reason).toBe(
        R.INSUFFICIENT_AVAILABLE_STOCK,
      );
    });

    it('con la reserva que lo respalda rige la regla de siempre (no se debilita)', async () => {
      // 10 en mano alcanzan para 5: la reserva se libera al dispensar.
      await expect(
        build(PINV.LOCATION_TYPE_WARD_STOCK).execute(
          'pharmacy-1',
          dto({ inventoryReservationId: 'res-1' }),
          actor,
        ),
      ).resolves.toMatchObject({ id: 'disp1' });
    });

    it('desde un estante la dispensa conserva su regla (stock en mano)', async () => {
      await expect(
        build(PINV.LOCATION_TYPE_SHELF).execute('pharmacy-1', dto(), actor),
      ).resolves.toMatchObject({ id: 'disp1' });
    });
  });
});
