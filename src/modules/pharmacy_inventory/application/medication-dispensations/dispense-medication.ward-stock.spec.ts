import { describe, expect, it, jest } from '@jest/globals';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import {
  SCOPE_PHARMACY_ID,
  allowAllScope,
} from '../scope/pharmacy-inventory-scope.testing';
import { DispenseMedicationUseCase } from './dispense-medication.use-case';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * Dispensa desde un botiquín (§F5c, revisión de seguridad): la sola presencia
 * de una reserva no saltea el control de disponible; sólo suma lo que esa
 * reserva vigente retiene para la misma ubicación, producto y lote.
 */
describe('DispenseMedicationUseCase · botiquín (WARD_STOCK)', () => {
  function build(opts: {
    available: string;
    reserved?: string;
    reservation?: any;
    lines?: any[];
  }) {
    const tx = { flush: mockFn(async () => undefined) };
    const em = { transactional: mockFn((cb: any) => cb(tx)) };
    const scope = allowAllScope();
    scope.requireStockKey.mockImplementation(
      async () =>
        ({
          id: 'loc-1',
          locationTypeConceptId: PINV.LOCATION_TYPE_WARD_STOCK,
        }) as any,
    );
    const position = {
      onHandQuantity: '9',
      reservedQuantity: opts.reserved ?? '0',
      quarantineQuantity: '0',
      availableQuantity: opts.available,
    };
    const dispensations = {
      create: mockFn(() => ({ id: 'disp-1' })),
      createLine: mockFn(() => ({ id: 'dl-1' })),
      findByIdempotencyKey: mockFn(async () => null),
    };
    const reservations = {
      findById: mockFn(async () => opts.reservation ?? null),
      findLinesByReservation: mockFn(async () => opts.lines ?? []),
      updateStatus: mockFn(),
    };
    const ledger = {
      nextSequence: mockFn(async () => '1'),
      append: mockFn(() => ({ id: 'le' })),
    };
    const useCase = new DispenseMedicationUseCase(
      em as any,
      dispensations as any,
      reservations as any,
      { findByKeyForUpdate: mockFn(async () => position) } as any,
      ledger as any,
      scope,
      { info: mockFn() } as any,
    );
    return { useCase, ledger, position };
  }
  const dto = (extra: Record<string, unknown> = {}) => ({
    pharmacySiteId: 'site-1',
    patientProfileId: 'pat-1',
    lines: [
      {
        inventoryLocationId: 'loc-1',
        pharmacyProductId: 'prod-1',
        inventoryLotId: 'lot-1',
        dispensedQuantity: 2,
      },
    ],
    ...extra,
  });
  const reservation = (over: Record<string, unknown> = {}) => ({
    id: 'res-1',
    pharmacyId: SCOPE_PHARMACY_ID,
    pharmacySiteId: 'site-1',
    reservationStatusConceptId: PINV.RESERVATION_CONFIRMED,
    expiresAt: new Date(Date.now() + 3_600_000),
    ...over,
  });
  const line = (over: Record<string, unknown> = {}) => ({
    inventoryLocationId: 'loc-1',
    pharmacyProductId: 'prod-1',
    inventoryLotId: 'lot-1',
    reservedQuantity: '2',
    fulfilledQuantity: '0',
    statusConceptId: PINV.RES_LINE_CONFIRMED,
    ...over,
  });
  const run = (b: ReturnType<typeof build>, body: any) =>
    b.useCase
      .execute(SCOPE_PHARMACY_ID, body, { id: 'u1' } as any)
      .catch((e: any) => e);

  it('sin reserva y sin disponible → rechaza, sin asientos', async () => {
    const b = build({ available: '0' });
    const err = await run(b, dto());
    expect(err.reason).toBe('INSUFFICIENT_AVAILABLE_STOCK');
    expect(b.ledger.append).not.toHaveBeenCalled();
  });

  it('reserva de otro lote → rechaza (no suma nada)', async () => {
    const b = build({
      available: '0',
      reserved: '2',
      reservation: reservation(),
      lines: [line({ inventoryLotId: 'lot-2' })],
    });
    const err = await run(b, dto({ inventoryReservationId: 'res-1' }));
    expect(err.reason).toBe('INSUFFICIENT_AVAILABLE_STOCK');
    expect(b.ledger.append).not.toHaveBeenCalled();
  });

  it('reserva por menos cantidad → rechaza', async () => {
    const b = build({
      available: '0',
      reserved: '1',
      reservation: reservation(),
      lines: [line({ reservedQuantity: '1' })],
    });
    const err = await run(b, dto({ inventoryReservationId: 'res-1' }));
    expect(err.reason).toBe('INSUFFICIENT_AVAILABLE_STOCK');
  });

  it('reserva vencida o no confirmada → 422 RESERVATION_NOT_ACTIVE', async () => {
    const b = build({
      available: '0',
      reservation: reservation({ expiresAt: new Date(Date.now() - 1000) }),
      lines: [line()],
    });
    const err = await run(b, dto({ inventoryReservationId: 'res-1' }));
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe('RESERVATION_NOT_ACTIVE');
    const c = build({
      available: '0',
      reservation: reservation({
        reservationStatusConceptId: PINV.RESERVATION_CANCELLED,
      }),
      lines: [line()],
    });
    expect(
      (await run(c, dto({ inventoryReservationId: 'res-1' }))).reason,
    ).toBe('RESERVATION_NOT_ACTIVE');
  });

  it('reserva de otra farmacia/sede (otro tenant) → 404', async () => {
    const b = build({
      available: '5',
      reservation: reservation({ pharmacyId: 'otra' }),
      lines: [line()],
    });
    const err = await run(b, dto({ inventoryReservationId: 'res-1' }));
    expect(err.getStatus()).toBe(404);
  });

  it('reserva válida para la misma clave → dispensa y libera sólo lo retenido', async () => {
    const b = build({
      available: '0',
      reserved: '2',
      reservation: reservation(),
      lines: [line()],
    });
    const res = await run(b, dto({ inventoryReservationId: 'res-1' }));
    expect(res).toMatchObject({ id: 'disp-1' });
    expect(b.ledger.append).toHaveBeenCalledTimes(1);
    expect(b.position.reservedQuantity).toBe('0');
    expect(b.position.onHandQuantity).toBe('7');
  });
});
