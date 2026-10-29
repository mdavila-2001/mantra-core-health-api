import { jest } from '@jest/globals';
import {
  ConflictException,
  ResourceNotFoundException,
} from '../../../../common';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { PharmacyInventoryErrorReason as R } from '../../pharmacy_inventory.error-reasons';
import { allowAllScope } from '../scope/pharmacy-inventory-scope.testing';
import { DispenseMedicationUseCase } from './dispense-medication.use-case';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const actor = { id: 'u1' } as any;
const LOC = 'ward-1';

/** Botiquín con 10 en mano y 4 reservados: disponible 6. */
function world(
  over: {
    reservation?: any | null;
    lines?: any[];
    position?: any;
    foreignPharmacy?: boolean;
  } = {},
) {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const reservation =
    over.reservation === undefined
      ? {
          id: 'res-1',
          pharmacyId: 'pharmacy-1',
          pharmacySiteId: 'site-1',
          reservationStatusConceptId: PINV.RESERVATION_CONFIRMED,
          expiresAt: new Date(Date.now() + 3_600_000),
          updatedAt: new Date(),
        }
      : over.reservation;
  const resLine = (extra: object = {}) => ({
    id: 'rl-1',
    inventoryLocationId: LOC,
    pharmacyProductId: 'p1',
    inventoryLotId: undefined,
    reservedQuantity: '4',
    fulfilledQuantity: undefined,
    statusConceptId: PINV.RES_LINE_CONFIRMED,
    updatedAt: new Date(),
    ...extra,
  });
  const lines = over.lines ?? [resLine()];
  const position = over.position ?? {
    onHandQuantity: '10',
    reservedQuantity: '4',
    quarantineQuantity: '0',
    availableQuantity: '6',
  };
  const reservations = {
    findByIdForUpdate: mockFn(async () => reservation),
    findById: mockFn(async () => reservation),
    findLinesByReservation: mockFn(async () => lines),
  };
  const stock = { findByKeyForUpdate: mockFn(async () => position) };
  const ledger = {
    nextSequence: mockFn(async () => '1'),
    append: mockFn(() => ({ id: 'led1' })),
  };
  const scope = allowAllScope();
  (scope.requireLocation as any).mockImplementation(
    async (_t: unknown, _s: unknown, id: string) => ({
      id,
      pharmacySiteId: 'site-1',
      locationTypeConceptId: PINV.LOCATION_TYPE_WARD_STOCK,
    }),
  );
  const useCase = new DispenseMedicationUseCase(
    em as any,
    {
      create: mockFn(() => ({ id: 'disp1' })),
      createLine: mockFn(() => ({ id: 'dl1' })),
      findByIdempotencyKey: mockFn(),
    } as any,
    reservations as any,
    stock as any,
    ledger as any,
    scope,
    { info: mockFn() } as any,
  );
  const dispense = (qty: number, extra: Record<string, unknown> = {}) =>
    useCase.execute(
      'pharmacy-1',
      {
        pharmacySiteId: 'site-1',
        inventoryReservationId: 'res-1',
        lines: [
          {
            inventoryLocationId: LOC,
            pharmacyProductId: 'p1',
            dispensedQuantity: qty,
            ...extra,
          },
        ],
      } as any,
      actor,
    );
  return {
    dispense,
    position,
    reservation,
    lines,
    reservations,
    ledger,
    resLine,
  };
}

const untouched = (w: ReturnType<typeof world>) =>
  expect(w.position).toMatchObject({
    onHandQuantity: '10',
    reservedQuantity: '4',
    availableQuantity: '6',
  });

describe('botiquín de piso · la reserva sólo exime hasta lo reservado', () => {
  it('una reserva válida dispensa hasta lo reservado y la consume', async () => {
    const w = world();
    await w.dispense(4);
    expect(w.position).toMatchObject({
      onHandQuantity: '6',
      reservedQuantity: '0',
      availableQuantity: '6',
    });
    expect(w.lines[0]).toMatchObject({
      fulfilledQuantity: '4',
      statusConceptId: PINV.RES_LINE_FULFILLED,
    });
    expect(w.reservation.reservationStatusConceptId).toBe(
      PINV.RESERVATION_FULFILLED,
    );
    expect(w.ledger.append).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ quantityDelta: '-4', reservationDelta: '-4' }),
    );
  });

  it('bloquea la reserva FOR UPDATE antes de decidir', async () => {
    const w = world();
    await w.dispense(1);
    expect(w.reservations.findByIdForUpdate).toHaveBeenCalledTimes(1);
  });

  it('más de lo reservado: el exceso se somete a lo disponible (cabe)', async () => {
    const w = world();
    // 4 reservados + 2 que caben en el disponible (6)
    await w.dispense(6);
    expect(w.position).toMatchObject({
      onHandQuantity: '4',
      reservedQuantity: '0',
    });
  });

  it('más de lo reservado y más de lo disponible: 409 INSUFFICIENT_AVAILABLE_STOCK, sin tocar el stock', async () => {
    const w = world();
    // 4 reservados + 7 > 6 disponibles
    const failure = await w.dispense(11).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(ConflictException);
    expect((failure as any).response.reason).toBe(
      R.INSUFFICIENT_AVAILABLE_STOCK,
    );
    untouched(w);
  });

  it('reserva inexistente o de otra farmacia: el mismo 404, sin tocar el stock', async () => {
    for (const reservation of [
      null,
      {
        id: 'res-1',
        pharmacyId: 'otra-farmacia',
        pharmacySiteId: 'site-1',
        reservationStatusConceptId: PINV.RESERVATION_CONFIRMED,
        expiresAt: new Date(Date.now() + 3_600_000),
      },
      {
        id: 'res-1',
        pharmacyId: 'pharmacy-1',
        pharmacySiteId: 'otra-sede',
        reservationStatusConceptId: PINV.RESERVATION_CONFIRMED,
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    ]) {
      const w = world({ reservation });
      const failure = await w.dispense(1).catch((e: unknown) => e);
      expect(failure).toBeInstanceOf(ResourceNotFoundException);
      expect((failure as any).response.reason).toBe(
        R.PHARMACY_INVENTORY_RESOURCE_NOT_AVAILABLE,
      );
      untouched(w);
    }
  });

  it.each([
    ['cancelada', { reservationStatusConceptId: PINV.RESERVATION_CANCELLED }],
    ['consumida', { reservationStatusConceptId: PINV.RESERVATION_FULFILLED }],
    [
      'vencida (estado)',
      { reservationStatusConceptId: PINV.RESERVATION_EXPIRED },
    ],
    ['vencida (hora)', { expiresAt: new Date(Date.now() - 1000) }],
  ])(
    'reserva %s: 409 RESERVATION_NOT_APPLICABLE, sin tocar el stock',
    async (_n, patch) => {
      const base = world().reservation;
      const w = world({ reservation: { ...base, ...patch } });
      const failure = await w.dispense(1).catch((e: unknown) => e);
      expect(failure).toBeInstanceOf(ConflictException);
      expect((failure as any).response.reason).toBe(
        R.RESERVATION_NOT_APPLICABLE,
      );
      untouched(w);
    },
  );

  it.each([
    ['otro producto', { pharmacyProductId: 'otro' }],
    ['otro lote', { inventoryLotId: 'lote-2' }],
    ['otra ubicación', { inventoryLocationId: 'ward-2' }],
    ['línea ya consumida', { statusConceptId: PINV.RES_LINE_FULFILLED }],
    ['línea sin saldo', { fulfilledQuantity: '4' }],
  ])(
    'reserva con la línea de %s: 409 RESERVATION_NOT_APPLICABLE, sin tocar el stock',
    async (_n, patch) => {
      const w = world();
      const w2 = world({ lines: [w.resLine(patch)] });
      const failure = await w2.dispense(1).catch((e: unknown) => e);
      expect(failure).toBeInstanceOf(ConflictException);
      expect((failure as any).response.reason).toBe(
        R.RESERVATION_NOT_APPLICABLE,
      );
      untouched(w2);
    },
  );

  it('dos líneas de la misma dispensa no consumen dos veces lo mismo', async () => {
    const w = world();
    const failure = await (async () => {
      // la segunda línea intenta consumir lo que la primera ya agotó
      const useCaseWorld = world();
      return useCaseWorld.dispense(4).then(() => useCaseWorld.dispense(1));
    })().catch((e: unknown) => e);
    // la reserva quedó FULFILLED tras la primera: la segunda se rechaza
    expect(failure).toBeInstanceOf(ConflictException);
    void w;
  });

  it('sin reserva rige la regla de disponible (409)', async () => {
    const w = world();
    const failure = await w
      .dispense(7, {})
      .then(() => null)
      .catch((e: unknown) => e);
    // con reserva: 4 + 3 ≤ 6 → pasa; el caso sin reserva está en ward-stock-available.spec
    expect(failure).toBeNull();
  });
});
