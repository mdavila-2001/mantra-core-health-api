import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../../common';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
import { ApproveInventoryCountUseCase } from '../inventory-count/approve-inventory-count.use-case';
import { OpenInventoryCountUseCase } from '../inventory-count/open-inventory-count.use-case';
import { CreateInventoryLocationUseCase } from '../inventory-locations/create-inventory-location.use-case';
import { CreateRecallHoldUseCase } from '../inventory-recall/create-recall-hold.use-case';
import { ReleaseRecallHoldUseCase } from '../inventory-recall/release-recall-hold.use-case';
import { ReserveInventoryUseCase } from '../inventory-reservations/reserve-inventory.use-case';
import { CreateInventorySyncBatchUseCase } from '../inventory-sync/create-inventory-sync-batch.use-case';
import { ReconcileInventorySyncBatchUseCase } from '../inventory-sync/reconcile-inventory-sync-batch.use-case';
import { TransferInventoryUseCase } from '../inventory-transfers/transfer-inventory.use-case';
import { DispenseMedicationUseCase } from '../medication-dispensations/dispense-medication.use-case';
import { ReverseMedicationDispensationUseCase } from '../medication-dispensations/reverse-medication-dispensation.use-case';
import { PharmacyProcurementUseCases } from '../pharmacy-procurement/pharmacy-procurement.use-cases';
import { buildScopeWorld } from './pharmacy-inventory-scope.testing';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const T1 = 'tenant-1';
const NOT_AVAILABLE =
  PharmacyInventoryErrorReason.PHARMACY_INVENTORY_RESOURCE_NOT_AVAILABLE;
const INCONSISTENT =
  PharmacyInventoryErrorReason.PHARMACY_INVENTORY_SCOPE_INCONSISTENT;

/** Administrador de T1: el mundo de prueba trae la cadena de T2 con sufijo 2. */
const admin = {
  id: 'admin-1',
  roles: ['SECURITY_ADMIN'],
  tenantIds: [T1],
} as any;

const inTenant = <T>(fn: () => Promise<T>): Promise<T> => runWithTenant(T1, fn);

/** Captura el rechazo de una promesa para comparar su respuesta HTTP. */
async function rejection(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('no rechazó');
}

/** Unidad de trabajo simulada y la política real sobre el mundo de dos tenants. */
function base() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const { policy } = buildScopeWorld();
  const logger = { setContext: mockFn(), info: mockFn() };
  return { tx, em, policy, logger };
}

/** Afirma que la respuesta es el 404 uniforme del módulo, sin `details`. */
function expectUniformNotFound(error: any): void {
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  expect(error.getStatus()).toBe(404);
  expect(error.reason).toBe(NOT_AVAILABLE);
  expect(error.details).toBeUndefined();
}

/** Autoridad de stock permisiva: este caso prueba el ámbito de la farmacia, no el de la estructura. */
const stockAccess = () => ({
  practiceSiteOf: mockFn(async () => 'practice-site-1'),
  assertCanManage: mockFn(async () => undefined),
  resolve: mockFn(async () => ({ careSpaceId: null, clinicalUnitId: null })),
});

describe('Ámbito del inventario por caso de uso (PINV-01 / PINV-02)', () => {
  describe('ubicaciones', () => {
    it('crea la ubicación en una sede de la farmacia del tenant', async () => {
      const b = base();
      const locations = { create: mockFn(() => ({ id: 'loc-new' })) };
      const useCase = new CreateInventoryLocationUseCase(
        b.em as any,
        locations as any,
        b.policy,
        b.logger as any,
        stockAccess() as any,
        { located: mockFn() } as any,
      );

      await expect(
        inTenant(() =>
          useCase.execute(
            'site-1',
            { code: 'A', name: 'A', parentLocationId: 'loc-1' } as any,
            admin,
          ),
        ),
      ).resolves.toEqual({ id: 'loc-new' });
    });

    it('rechaza una sede de T2 y una ubicación padre de otra sede, sin escribir', async () => {
      const b = base();
      const locations = { create: mockFn() };
      const useCase = new CreateInventoryLocationUseCase(
        b.em as any,
        locations as any,
        b.policy,
        b.logger as any,
        stockAccess() as any,
        { located: mockFn() } as any,
      );

      const foreignSite = await rejection(
        inTenant(() =>
          useCase.execute('site-2', { code: 'A', name: 'A' } as any, admin),
        ),
      );
      const foreignParent = await rejection(
        inTenant(() =>
          useCase.execute(
            'site-1',
            { code: 'A', name: 'A', parentLocationId: 'loc-2' } as any,
            admin,
          ),
        ),
      );

      expectUniformNotFound(foreignSite);
      expectUniformNotFound(foreignParent);
      expect(locations.create).not.toHaveBeenCalled();
    });
  });

  describe('reserva', () => {
    function reserveUseCase() {
      const b = base();
      const reservations = {
        create: mockFn(() => ({ id: 'res-1' })),
        createLine: mockFn(() => ({ id: 'rl-1' })),
      };
      const position = {
        availableQuantity: '9',
        onHandQuantity: '9',
        reservedQuantity: '0',
        quarantineQuantity: '0',
      };
      const stock = { findByKeyForUpdate: mockFn(async () => position) };
      const ledger = {
        nextSequence: mockFn(async () => '1'),
        append: mockFn(() => ({ id: 'le-1' })),
      };
      const useCase = new ReserveInventoryUseCase(
        b.em as any,
        reservations as any,
        stock as any,
        ledger as any,
        b.policy,
        b.logger as any,
      );
      return { b, useCase, reservations, stock, ledger };
    }
    const line = {
      inventoryLocationId: 'loc-1',
      pharmacyProductId: 'prod-1',
      inventoryLotId: 'lot-1',
      requestedQuantity: 2,
    };

    it('reserva sobre la cadena íntegra de T1 con paciente y receta verificados', async () => {
      const { useCase, reservations, ledger } = reserveUseCase();

      await expect(
        inTenant(() =>
          useCase.execute(
            'ph-1',
            {
              pharmacySiteId: 'site-1',
              patientProfileId: 'pat-1',
              medicationRequestId: 'rx-1',
              lines: [line],
            } as any,
            admin,
          ),
        ),
      ).resolves.toMatchObject({ id: 'res-1' });
      expect(reservations.create).toHaveBeenCalledTimes(1);
      expect(ledger.append).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          pharmacyId: 'ph-1',
          pharmacySiteId: 'site-1',
        }),
      );
    });

    it.each([
      ['farmacia de T2', 'ph-2', 'site-2', line],
      ['sede de T2 bajo la farmacia de T1', 'ph-1', 'site-2', line],
      [
        'ubicación de T2',
        'ph-1',
        'site-1',
        { ...line, inventoryLocationId: 'loc-2' },
      ],
      [
        'producto de T2',
        'ph-1',
        'site-1',
        { ...line, pharmacyProductId: 'prod-2' },
      ],
      ['lote de T2', 'ph-1', 'site-1', { ...line, inventoryLotId: 'lot-2' }],
    ])(
      'rechaza %s sin una sola escritura',
      async (_name, pharmacyId, siteId, badLine) => {
        const { b, useCase, reservations, stock, ledger } = reserveUseCase();

        const error = await rejection(
          inTenant(() =>
            useCase.execute(
              pharmacyId,
              { pharmacySiteId: siteId, lines: [line, badLine] } as any,
              admin,
            ),
          ),
        );

        expectUniformNotFound(error);
        expect(reservations.create).not.toHaveBeenCalled();
        expect(stock.findByKeyForUpdate).not.toHaveBeenCalled();
        expect(ledger.append).not.toHaveBeenCalled();
        expect(b.tx.flush).not.toHaveBeenCalled();
      },
    );

    it('rechaza un paciente inexistente y una receta ajena al paciente', async () => {
      const { useCase, reservations } = reserveUseCase();

      const patient = await rejection(
        inTenant(() =>
          useCase.execute(
            'ph-1',
            {
              pharmacySiteId: 'site-1',
              patientProfileId: 'pat-9',
              lines: [line],
            } as any,
            admin,
          ),
        ),
      );
      const request = await rejection(
        inTenant(() =>
          useCase.execute(
            'ph-1',
            {
              pharmacySiteId: 'site-1',
              patientProfileId: 'pat-1',
              medicationRequestId: 'rx-9',
              lines: [line],
            } as any,
            admin,
          ),
        ),
      );

      expectUniformNotFound(patient);
      expectUniformNotFound(request);
      expect(reservations.create).not.toHaveBeenCalled();
    });
  });

  describe('transferencia', () => {
    function transferUseCase() {
      const b = base();
      const fromPosition = {
        onHandQuantity: '8',
        availableQuantity: '8',
        reservedQuantity: '0',
        quarantineQuantity: '0',
      };
      const toPosition = {
        onHandQuantity: '1',
        availableQuantity: '1',
        reservedQuantity: '0',
        quarantineQuantity: '0',
      };
      const stock = {
        findByKeyForUpdate: mockFn()
          .mockResolvedValueOnce(fromPosition)
          .mockResolvedValueOnce(toPosition),
        create: mockFn(),
      };
      const ledger = {
        nextSequence: mockFn(async () => '1'),
        append: mockFn(() => ({ id: 'le' })),
      };
      const useCase = new TransferInventoryUseCase(
        b.em as any,
        stock as any,
        ledger as any,
        b.policy,
        b.logger as any,
      );
      return { b, useCase, stock, ledger, fromPosition, toPosition };
    }
    const dto = {
      pharmacySiteId: 'site-1',
      fromLocationId: 'loc-1',
      toLocationId: 'loc-1b',
      pharmacyProductId: 'prod-1',
      inventoryLotId: 'lot-1',
      quantity: 3,
    };

    it('mueve stock entre dos sedes de la misma farmacia con la sede verdadera en cada asiento y saldo conservado', async () => {
      const { useCase, ledger, fromPosition, toPosition } = transferUseCase();

      await inTenant(() => useCase.execute('ph-1', dto as any, admin));

      expect(ledger.nextSequence).toHaveBeenCalledWith(
        expect.anything(),
        'ph-1',
      );
      expect(ledger.append).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.objectContaining({
          pharmacyId: 'ph-1',
          pharmacySiteId: 'site-1',
          inventoryLocationId: 'loc-1',
          quantityDelta: '-3',
        }),
      );
      expect(ledger.append).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.objectContaining({
          pharmacyId: 'ph-1',
          pharmacySiteId: 'site-1b',
          inventoryLocationId: 'loc-1b',
          quantityDelta: '3',
        }),
      );
      expect(
        Number(fromPosition.onHandQuantity) + Number(toPosition.onHandQuantity),
      ).toBe(9);
    });

    it.each([
      ['destino de T2', { ...dto, toLocationId: 'loc-2' }],
      ['origen de T2', { ...dto, fromLocationId: 'loc-2' }],
      ['producto de T2', { ...dto, pharmacyProductId: 'prod-2' }],
      ['lote de T2', { ...dto, inventoryLotId: 'lot-2' }],
    ])('rechaza %s sin asientos ni cambio de stock', async (_name, body) => {
      const { b, useCase, stock, ledger, fromPosition, toPosition } =
        transferUseCase();

      const error = await rejection(
        inTenant(() => useCase.execute('ph-1', body as any, admin)),
      );

      expectUniformNotFound(error);
      expect(stock.findByKeyForUpdate).not.toHaveBeenCalled();
      expect(ledger.append).not.toHaveBeenCalled();
      expect(b.tx.flush).not.toHaveBeenCalled();
      expect(fromPosition.onHandQuantity).toBe('8');
      expect(toPosition.onHandQuantity).toBe('1');
    });

    it('una farmacia de T2 en la ruta responde 404 uniforme', async () => {
      const { useCase, ledger } = transferUseCase();

      const error = await rejection(
        inTenant(() => useCase.execute('ph-2', dto as any, admin)),
      );

      expectUniformNotFound(error);
      expect(ledger.append).not.toHaveBeenCalled();
    });
  });

  describe('conteo', () => {
    it('abre la sesión sobre una ubicación de la sede y rechaza la de T2', async () => {
      const b = base();
      const sessions = {
        countOpenAtLocation: mockFn(async () => 0),
        create: mockFn(() => ({ id: 's-1' })),
        createLine: mockFn(() => ({ id: 'l-1' })),
      };
      const stock = { findByKey: mockFn(async () => null) };
      const useCase = new OpenInventoryCountUseCase(
        b.em as any,
        sessions as any,
        stock as any,
        b.policy,
        b.logger as any,
      );
      const items = [{ pharmacyProductId: 'prod-1', inventoryLotId: 'lot-1' }];

      await expect(
        inTenant(() =>
          useCase.execute(
            'site-1',
            { inventoryLocationId: 'loc-1', items } as any,
            admin,
          ),
        ),
      ).resolves.toMatchObject({ id: 's-1' });
      sessions.create.mockClear();

      const foreignSite = await rejection(
        inTenant(() =>
          useCase.execute(
            'site-2',
            { inventoryLocationId: 'loc-2', items } as any,
            admin,
          ),
        ),
      );
      const foreignLocation = await rejection(
        inTenant(() =>
          useCase.execute(
            'site-1',
            { inventoryLocationId: 'loc-2', items } as any,
            admin,
          ),
        ),
      );
      const foreignProduct = await rejection(
        inTenant(() =>
          useCase.execute(
            'site-1',
            {
              inventoryLocationId: 'loc-1',
              items: [{ pharmacyProductId: 'prod-2' }],
            } as any,
            admin,
          ),
        ),
      );

      for (const error of [foreignSite, foreignLocation, foreignProduct]) {
        expectUniformNotFound(error);
      }
      expect(sessions.create).not.toHaveBeenCalled();
    });

    function approveUseCase(session: any) {
      const b = base();
      const line = {
        id: 'line-1',
        inventoryCountSessionId: 's-1',
        pharmacyProductId: 'prod-1',
        inventoryLotId: 'lot-1',
        expectedQuantity: '5',
      };
      const sessions = {
        findById: mockFn(async (_tx: unknown, id: string) =>
          id === 's-1' ? session : null,
        ),
        findLineById: mockFn(async () => line),
      };
      const position = {
        onHandQuantity: '5',
        reservedQuantity: '0',
        quarantineQuantity: '0',
      };
      const stock = { findByKeyForUpdate: mockFn(async () => position) };
      const ledger = {
        nextSequence: mockFn(async () => '1'),
        append: mockFn(),
      };
      const useCase = new ApproveInventoryCountUseCase(
        b.em as any,
        sessions as any,
        stock as any,
        ledger as any,
        b.policy,
        b.logger as any,
      );
      return { b, useCase, ledger, position, line };
    }
    const counts = { counts: [{ lineId: 'line-1', countedQuantity: 7 }] };

    it('aprueba con la farmacia y la sede verdaderas en el asiento', async () => {
      const session = {
        id: 's-1',
        pharmacySiteId: 'site-1',
        inventoryLocationId: 'loc-1',
        statusConceptId: PINV.COUNT_OPEN,
      };
      const { useCase, ledger } = approveUseCase(session);

      await expect(
        inTenant(() => useCase.execute('s-1', counts as any, admin)),
      ).resolves.toMatchObject({ adjustments: 1 });

      expect(ledger.nextSequence).toHaveBeenCalledWith(
        expect.anything(),
        'ph-1',
      );
      expect(ledger.append).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          pharmacyId: 'ph-1',
          pharmacySiteId: 'site-1',
          inventoryLocationId: 'loc-1',
          quantityDelta: '2',
        }),
      );
    });

    it('una sesión de una sede de T2 responde igual que una inexistente y no escribe', async () => {
      const session = {
        id: 's-1',
        pharmacySiteId: 'site-2',
        inventoryLocationId: 'loc-2',
        statusConceptId: PINV.COUNT_OPEN,
      };
      const { b, useCase, ledger, position } = approveUseCase(session);

      const foreign = await rejection(
        inTenant(() => useCase.execute('s-1', counts as any, admin)),
      );
      const missing = await rejection(
        inTenant(() => useCase.execute('s-9', counts as any, admin)),
      );

      expectUniformNotFound(foreign);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(ledger.append).not.toHaveBeenCalled();
      expect(b.tx.flush).not.toHaveBeenCalled();
      expect(position.onHandQuantity).toBe('5');
    });

    it('relación inconsistente: la ubicación contada no es de la sede de la sesión responde 422 SCOPE_INCONSISTENT sin asientos', async () => {
      const session = {
        id: 's-1',
        pharmacySiteId: 'site-1',
        inventoryLocationId: 'loc-1b',
        statusConceptId: PINV.COUNT_OPEN,
      };
      const { b, useCase, ledger } = approveUseCase(session);

      const error = await rejection(
        inTenant(() => useCase.execute('s-1', counts as any, admin)),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.getStatus()).toBe(422);
      expect(error.reason).toBe(INCONSISTENT);
      expect(ledger.append).not.toHaveBeenCalled();
      expect(b.tx.flush).not.toHaveBeenCalled();
    });

    it('relación inconsistente: una línea con el producto de otra farmacia responde 422 y no ajusta el stock', async () => {
      const session = {
        id: 's-1',
        pharmacySiteId: 'site-1',
        inventoryLocationId: 'loc-1',
        statusConceptId: PINV.COUNT_OPEN,
      };
      const { useCase, ledger, position, line } = approveUseCase(session);
      line.pharmacyProductId = 'prod-2';

      const error = await rejection(
        inTenant(() => useCase.execute('s-1', counts as any, admin)),
      );

      expect(error.reason).toBe(INCONSISTENT);
      expect(ledger.append).not.toHaveBeenCalled();
      expect(position.onHandQuantity).toBe('5');
    });
  });

  describe('recall', () => {
    function createHoldUseCase() {
      const b = base();
      const lot = { id: 'lot-1', pharmacyProductId: 'prod-1' };
      const holds = { create: mockFn(() => ({ id: 'hold-1' })) };
      const lots = { findById: mockFn(async () => lot) };
      const stock = { findByKey: mockFn(async () => null) };
      const ledger = {
        nextSequence: mockFn(async () => '1'),
        append: mockFn(),
      };
      const useCase = new CreateRecallHoldUseCase(
        b.em as any,
        holds as any,
        lots as any,
        stock as any,
        ledger as any,
        b.policy,
        b.logger as any,
      );
      return { b, useCase, holds, lot, ledger };
    }
    const hold = {
      pharmacyId: 'ph-1',
      pharmacySiteId: 'site-1',
      inventoryLocationId: 'loc-1',
      pharmacyProductId: 'prod-1',
      inventoryLotId: 'lot-1',
      recallReference: 'R-1',
    };

    it('aplica el recall sobre la cadena íntegra de T1', async () => {
      const { useCase, holds, ledger } = createHoldUseCase();

      await expect(
        inTenant(() => useCase.execute(hold as any, admin)),
      ).resolves.toEqual({ id: 'hold-1' });
      expect(holds.create).toHaveBeenCalledTimes(1);
      expect(ledger.append).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          pharmacyId: 'ph-1',
          pharmacySiteId: 'site-1',
        }),
      );
    });

    it.each([
      ['farmacia de T2', { ...hold, pharmacyId: 'ph-2' }],
      [
        'lote de T2 con la farmacia propia',
        { ...hold, inventoryLotId: 'lot-2' },
      ],
      ['producto de T2', { ...hold, pharmacyProductId: 'prod-2' }],
      ['ubicación de T2', { ...hold, inventoryLocationId: 'loc-2' }],
    ])('rechaza %s sin crear el hold ni tocar el lote', async (_name, body) => {
      const { b, useCase, holds, lot, ledger } = createHoldUseCase();

      const error = await rejection(
        inTenant(() => useCase.execute(body as any, admin)),
      );

      expectUniformNotFound(error);
      expect(holds.create).not.toHaveBeenCalled();
      expect(ledger.append).not.toHaveBeenCalled();
      expect(b.tx.flush).not.toHaveBeenCalled();
      expect((lot as any).recallStatusConceptId).toBeUndefined();
    });

    function releaseUseCase(
      holdRow: any,
      positions: any[],
      lotRow: any = { id: 'lot-1', pharmacyProductId: 'prod-1' },
    ) {
      const b = base();
      const holds = {
        findById: mockFn(async (_tx: unknown, id: string) =>
          id === 'hold-1' ? holdRow : null,
        ),
      };
      const lots = { findById: mockFn(async () => lotRow) };
      const stock = { findByLot: mockFn(async () => positions) };
      const ledger = {
        nextSequence: mockFn(async () => '1'),
        append: mockFn(),
      };
      const useCase = new ReleaseRecallHoldUseCase(
        b.em as any,
        holds as any,
        lots as any,
        stock as any,
        ledger as any,
        b.policy,
        b.logger as any,
      );
      return { b, useCase, ledger, lotRow };
    }
    const activeHold = () => ({
      id: 'hold-1',
      holdStatusConceptId: PINV.HOLD_ACTIVE,
      pharmacyProductId: 'prod-1',
      inventoryLotId: 'lot-1',
    });
    const quarantined = (locationId: string, productId = 'prod-1') => ({
      inventoryLocationId: locationId,
      pharmacyProductId: productId,
      inventoryLotId: 'lot-1',
      onHandQuantity: '10',
      reservedQuantity: '0',
      quarantineQuantity: '4',
    });

    it('libera un recall con posiciones en dos sedes: un asiento válido por posición y cuarentena en cero', async () => {
      const positions = [quarantined('loc-1'), quarantined('loc-1b')];
      const { useCase, ledger } = releaseUseCase(activeHold(), positions);

      await expect(
        inTenant(() =>
          useCase.execute('hold-1', { writeOff: false } as any, admin),
        ),
      ).resolves.toEqual({ id: 'hold-1', status: 'RELEASED' });

      expect(ledger.nextSequence).toHaveBeenCalledWith(
        expect.anything(),
        'ph-1',
      );
      expect(ledger.append).toHaveBeenCalledTimes(2);
      expect(ledger.append).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.objectContaining({
          pharmacyId: 'ph-1',
          pharmacySiteId: 'site-1',
          inventoryLocationId: 'loc-1',
        }),
      );
      expect(ledger.append).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.objectContaining({
          pharmacyId: 'ph-1',
          pharmacySiteId: 'site-1b',
          inventoryLocationId: 'loc-1b',
        }),
      );
      expect(positions.map((p) => p.quarantineQuantity)).toEqual(['0', '0']);
    });

    it('un hold de T2 responde igual que uno inexistente y no muta nada', async () => {
      const foreignHold = { ...activeHold(), pharmacyProductId: 'prod-2' };
      const positions = [quarantined('loc-2', 'prod-2')];
      const { useCase, ledger } = releaseUseCase(foreignHold, positions);

      const foreign = await rejection(
        inTenant(() =>
          useCase.execute('hold-1', { writeOff: true } as any, admin),
        ),
      );
      const missing = await rejection(
        inTenant(() =>
          useCase.execute('hold-9', { writeOff: true } as any, admin),
        ),
      );

      expectUniformNotFound(foreign);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(foreignHold.holdStatusConceptId).toBe(PINV.HOLD_ACTIVE);
      expect(positions[0].quarantineQuantity).toBe('4');
      expect(ledger.append).not.toHaveBeenCalled();
    });

    it.each([
      [
        'una posición en una ubicación de otra farmacia',
        [quarantined('loc-1'), quarantined('loc-2')],
        { id: 'lot-1', pharmacyProductId: 'prod-1' },
      ],
      [
        'una posición de otro producto',
        [quarantined('loc-1', 'prod-2')],
        { id: 'lot-1', pharmacyProductId: 'prod-1' },
      ],
      [
        'un lote que no es del producto retenido',
        [quarantined('loc-1')],
        { id: 'lot-1', pharmacyProductId: 'prod-2' },
      ],
    ])(
      'relación inconsistente (%s): 422 SCOPE_INCONSISTENT sin ninguna mutación',
      async (_name, positions, lotRow) => {
        const holdRow = activeHold();
        const { b, useCase, ledger } = releaseUseCase(
          holdRow,
          positions,
          lotRow,
        );

        const error = await rejection(
          inTenant(() =>
            useCase.execute('hold-1', { writeOff: true } as any, admin),
          ),
        );

        expect(error).toBeInstanceOf(PreconditionFailedException);
        expect(error.getStatus()).toBe(422);
        expect(error.reason).toBe(INCONSISTENT);
        expect(holdRow.holdStatusConceptId).toBe(PINV.HOLD_ACTIVE);
        expect(positions.map((p) => p.quarantineQuantity)).toEqual(
          positions.map(() => '4'),
        );
        expect(ledger.append).not.toHaveBeenCalled();
        expect(b.tx.flush).not.toHaveBeenCalled();
      },
    );
  });

  describe('dispensación', () => {
    function dispenseUseCases(reservation?: any) {
      const b = base();
      const dispensations = {
        create: mockFn(() => ({ id: 'disp-1' })),
        createLine: mockFn(() => ({ id: 'dl-1' })),
        findByIdempotencyKey: mockFn(async () => null),
        findLines: mockFn(async () => []),
        findById: mockFn(async (_tx: unknown, id: string) =>
          id === 'disp-1'
            ? {
                id: 'disp-1',
                pharmacyId: 'ph-2',
                pharmacySiteId: 'site-2',
                dispensationStatusConceptId: PINV.DISPENSE_DISPENSED,
              }
            : null,
        ),
      };
      const reservations = {
        findById: mockFn(async () => reservation ?? null),
        findLinesByReservation: mockFn(async () => []),
      };
      const position = {
        onHandQuantity: '9',
        reservedQuantity: '0',
        quarantineQuantity: '0',
        availableQuantity: '9',
      };
      const stock = { findByKeyForUpdate: mockFn(async () => position) };
      const ledger = {
        nextSequence: mockFn(async () => '1'),
        append: mockFn(() => ({ id: 'le' })),
        findEntryIdsBySource: mockFn(async () => []),
      };
      const dispense = new DispenseMedicationUseCase(
        b.em as any,
        dispensations as any,
        reservations as any,
        stock as any,
        ledger as any,
        b.policy,
        b.logger as any,
      );
      const reverse = new ReverseMedicationDispensationUseCase(
        b.em as any,
        dispensations as any,
        reservations as any,
        stock as any,
        ledger as any,
        b.policy,
        b.logger as any,
      );
      return { b, dispense, reverse, dispensations, ledger, position };
    }
    const body = {
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
    };

    it('dispensa sobre la cadena íntegra de T1', async () => {
      const { dispense, ledger } = dispenseUseCases();

      await expect(
        inTenant(() => dispense.execute('ph-1', body as any, admin)),
      ).resolves.toMatchObject({ id: 'disp-1' });
      expect(ledger.append).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          pharmacyId: 'ph-1',
          pharmacySiteId: 'site-1',
        }),
      );
    });

    it.each([
      ['farmacia de T2', 'ph-2', body],
      [
        'ubicación de T2',
        'ph-1',
        {
          ...body,
          lines: [{ ...body.lines[0], inventoryLocationId: 'loc-2' }],
        },
      ],
      [
        'lote de T2',
        'ph-1',
        { ...body, lines: [{ ...body.lines[0], inventoryLotId: 'lot-2' }] },
      ],
      ['paciente inexistente', 'ph-1', { ...body, patientProfileId: 'pat-9' }],
      ['receta ajena', 'ph-1', { ...body, medicationRequestId: 'rx-9' }],
      [
        'paciente sin relación con la farmacia',
        'ph-1',
        { ...body, patientProfileId: 'pat-foreign' },
      ],
      [
        'receta de un paciente sin relación con la farmacia',
        'ph-1',
        {
          ...body,
          patientProfileId: 'pat-foreign',
          medicationRequestId: 'rx-foreign',
        },
      ],
    ])(
      'rechaza %s sin dispensación, asientos ni descuento de stock',
      async (_name, pharmacyId, payload) => {
        const { b, dispense, dispensations, ledger, position } =
          dispenseUseCases();

        const error = await rejection(
          inTenant(() => dispense.execute(pharmacyId, payload as any, admin)),
        );

        expectUniformNotFound(error);
        expect(dispensations.create).not.toHaveBeenCalled();
        expect(ledger.append).not.toHaveBeenCalled();
        expect(b.tx.flush).not.toHaveBeenCalled();
        expect(position.onHandQuantity).toBe('9');
      },
    );

    it('rechaza una reserva de otra farmacia con el mismo 404 que una inexistente', async () => {
      const foreignReservation = {
        id: 'res-2',
        pharmacyId: 'ph-2',
        pharmacySiteId: 'site-2',
        reservationStatusConceptId: PINV.RESERVATION_CONFIRMED,
      };
      const { dispense, dispensations } = dispenseUseCases(foreignReservation);
      const withReservation = { ...body, inventoryReservationId: 'res-2' };

      const foreign = await rejection(
        inTenant(() => dispense.execute('ph-1', withReservation as any, admin)),
      );

      expectUniformNotFound(foreign);
      expect(dispensations.create).not.toHaveBeenCalled();
    });

    it('reversar una dispensación de T2 responde igual que una inexistente y no escribe', async () => {
      const { reverse, ledger, dispensations } = dispenseUseCases();

      const foreign = await rejection(
        inTenant(() =>
          reverse.execute(
            'disp-1',
            { inventoryLocationId: 'loc-2' } as any,
            admin,
          ),
        ),
      );
      const missing = await rejection(
        inTenant(() => reverse.execute('disp-9', {} as any, admin)),
      );

      expectUniformNotFound(foreign);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(ledger.append).not.toHaveBeenCalled();
      expect(dispensations.findLines).not.toHaveBeenCalled();
    });
  });

  describe('compras y recepción', () => {
    function procurementUseCases(overrides: { orderPharmacy?: string } = {}) {
      const b = base();
      const suppliers = {
        create: mockFn(() => ({ id: 'sup-new' })),
        findById: mockFn(async (_tx: unknown, id: string) =>
          id === 'sup-1'
            ? { id, pharmacyId: 'ph-1', statusConceptId: PINV.SUPPLIER_ACTIVE }
            : id === 'sup-2'
              ? {
                  id,
                  pharmacyId: 'ph-2',
                  statusConceptId: PINV.SUPPLIER_ACTIVE,
                }
              : null,
        ),
      };
      const order = {
        id: 'po-1',
        pharmacyId: overrides.orderPharmacy ?? 'ph-1',
        statusConceptId: PINV.PO_ORDERED,
      };
      const orders = {
        findById: mockFn(async () => order),
        findByIdempotencyKey: mockFn(async () => null),
        create: mockFn(() => ({ id: 'po-new' })),
        createLine: mockFn(() => ({ id: 'pol-new' })),
        findLineById: mockFn(async (_tx: unknown, id: string) =>
          id === 'pol-1'
            ? {
                id,
                pharmacyPurchaseOrderId: 'po-1',
                pharmacyProductId: 'prod-1',
                orderedQuantity: '10',
                receivedQuantity: '0',
              }
            : id === 'pol-other-order'
              ? {
                  id,
                  pharmacyPurchaseOrderId: 'po-other',
                  pharmacyProductId: 'prod-1',
                  orderedQuantity: '10',
                  receivedQuantity: '0',
                }
              : null,
        ),
      };
      const receipts = {
        create: mockFn(() => ({ id: 'gr-1', receiptNumber: 'GR-1' })),
        createLine: mockFn(),
        findByIdempotencyKey: mockFn(async () => null),
      };
      const lots = {
        findByProductAndNumber: mockFn(async () => null),
        create: mockFn(() => ({ id: 'lot-new' })),
      };
      const ledger = {
        nextSequence: mockFn(async () => '1'),
        append: mockFn(() => ({ id: 'le' })),
      };
      const stock = {
        findByKeyForUpdate: mockFn(async () => null),
        create: mockFn(() => ({})),
      };
      const useCases = new PharmacyProcurementUseCases(
        b.em as any,
        suppliers as any,
        orders as any,
        receipts as any,
        lots as any,
        ledger as any,
        stock as any,
        b.policy,
        b.logger as any,
      );
      return { b, useCases, orders, receipts, ledger, stock, lots };
    }

    it('crea la orden con proveedor, sede y productos de la farmacia', async () => {
      const { useCases, orders } = procurementUseCases();

      await expect(
        inTenant(() =>
          useCases.createPurchaseOrder(
            'ph-1',
            {
              pharmacySiteId: 'site-1',
              pharmacySupplierId: 'sup-1',
              lines: [{ pharmacyProductId: 'prod-1', orderedQuantity: 3 }],
            } as any,
            admin,
          ),
        ),
      ).resolves.toMatchObject({ id: 'po-new' });
      expect(orders.create).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['farmacia de T2', 'ph-2', 'site-2', 'sup-2', 'prod-2'],
      ['proveedor de T2', 'ph-1', 'site-1', 'sup-2', 'prod-1'],
      ['sede de T2', 'ph-1', 'site-2', 'sup-1', 'prod-1'],
      ['producto de T2', 'ph-1', 'site-1', 'sup-1', 'prod-2'],
    ])(
      'rechaza %s sin crear la orden',
      async (_n, pharmacyId, siteId, supplierId, productId) => {
        const { b, useCases, orders } = procurementUseCases();

        const error = await rejection(
          inTenant(() =>
            useCases.createPurchaseOrder(
              pharmacyId,
              {
                pharmacySiteId: siteId,
                pharmacySupplierId: supplierId,
                lines: [{ pharmacyProductId: productId, orderedQuantity: 3 }],
              } as any,
              admin,
            ),
          ),
        );

        expectUniformNotFound(error);
        expect(orders.create).not.toHaveBeenCalled();
        expect(b.tx.flush).not.toHaveBeenCalled();
      },
    );

    it('registrar un proveedor exige la farmacia del tenant', async () => {
      const { useCases } = procurementUseCases();

      await expect(
        inTenant(() =>
          useCases.createSupplier(
            'ph-1',
            { supplierTenantId: 'x' } as any,
            admin,
          ),
        ),
      ).resolves.toEqual({ id: 'sup-new' });
      const error = await rejection(
        inTenant(() =>
          useCases.createSupplier(
            'ph-2',
            { supplierTenantId: 'x' } as any,
            admin,
          ),
        ),
      );
      expectUniformNotFound(error);
    });

    const receipt = {
      pharmacyPurchaseOrderId: 'po-1',
      pharmacySiteId: 'site-1',
      inventoryLocationId: 'loc-1',
      lines: [
        {
          pharmacyPurchaseOrderLineId: 'pol-1',
          pharmacyProductId: 'prod-1',
          lotNumber: 'L1',
          receivedQuantity: 10,
        },
      ],
    };

    it('recibe mercancía de una orden de la farmacia con asientos de la farmacia y sede verdaderas', async () => {
      const { useCases, ledger } = procurementUseCases();

      await expect(
        inTenant(() => useCases.receiveGoods('ph-1', receipt as any, admin)),
      ).resolves.toMatchObject({ id: 'gr-1' });
      expect(ledger.append).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          pharmacyId: 'ph-1',
          pharmacySiteId: 'site-1',
        }),
      );
    });

    it.each([
      ['orden de T2', { ...receipt }, 'ph-2'],
      ['ubicación de T2', { ...receipt, inventoryLocationId: 'loc-2' }, 'ph-1'],
      [
        'línea que es de otra orden',
        {
          ...receipt,
          lines: [
            {
              ...receipt.lines[0],
              pharmacyPurchaseOrderLineId: 'pol-other-order',
            },
          ],
        },
        'ph-1',
      ],
      [
        'producto distinto al de la línea de la orden',
        {
          ...receipt,
          lines: [{ ...receipt.lines[0], pharmacyProductId: 'prod-2' }],
        },
        'ph-1',
      ],
    ])(
      'rechaza %s sin recibo, lote, asiento ni stock',
      async (_n, payload, orderPharmacy) => {
        const { b, useCases, receipts, lots, ledger, stock } =
          procurementUseCases({ orderPharmacy });

        const error = await rejection(
          inTenant(() => useCases.receiveGoods('ph-1', payload as any, admin)),
        );

        expectUniformNotFound(error);
        expect(receipts.create).not.toHaveBeenCalled();
        expect(lots.create).not.toHaveBeenCalled();
        expect(ledger.append).not.toHaveBeenCalled();
        expect(stock.create).not.toHaveBeenCalled();
        expect(b.tx.flush).not.toHaveBeenCalled();
      },
    );

    it('una clave de idempotencia de la recepción de otra farmacia no devuelve esa recepción', async () => {
      const { useCases, receipts } = procurementUseCases({
        orderPharmacy: 'ph-2',
      });
      receipts.findByIdempotencyKey.mockResolvedValue({
        id: 'gr-foreign',
        pharmacyPurchaseOrderId: 'po-1',
        receiptNumber: 'GR-X',
      });

      const error = await rejection(
        inTenant(() =>
          useCases.receiveGoods(
            'ph-1',
            { ...receipt, idempotencyKey: 'shared-key' } as any,
            admin,
          ),
        ),
      );

      expectUniformNotFound(error);
    });
  });

  describe('sincronización', () => {
    it('ingiere el lote de una conexión de la farmacia y rechaza la de T2', async () => {
      const b = base();
      const sync = {
        createBatch: mockFn(() => ({ id: 'batch-1' })),
        createItem: mockFn(() => ({ id: 'item-1' })),
        findItemByIdempotencyKey: mockFn(async () => null),
      };
      const useCase = new CreateInventorySyncBatchUseCase(
        b.em as any,
        sync as any,
        b.policy,
        b.logger as any,
      );
      const batch = {
        pharmacyIntegrationConnectionId: 'conn-1',
        sourceBatchIdentifier: 'erp-1',
        items: [{ pharmacyProductId: 'prod-1', externalProductCode: 'E1' }],
      };

      await expect(
        inTenant(() => useCase.execute(batch as any, admin)),
      ).resolves.toMatchObject({ id: 'batch-1' });
      sync.createBatch.mockClear();

      const foreignConnection = await rejection(
        inTenant(() =>
          useCase.execute(
            { ...batch, pharmacyIntegrationConnectionId: 'conn-2' } as any,
            admin,
          ),
        ),
      );
      const foreignProduct = await rejection(
        inTenant(() =>
          useCase.execute(
            { ...batch, items: [{ pharmacyProductId: 'prod-2' }] } as any,
            admin,
          ),
        ),
      );

      expectUniformNotFound(foreignConnection);
      expectUniformNotFound(foreignProduct);
      expect(sync.createBatch).not.toHaveBeenCalled();
    });

    it('conciliar un lote de una conexión de T2 responde igual que uno inexistente y no lo cierra', async () => {
      const b = base();
      const foreignBatch = {
        id: 'batch-2',
        pharmacyIntegrationConnectionId: 'conn-2',
        statusConceptId: PINV.BATCH_RECEIVED,
      };
      const sync = {
        findBatchById: mockFn(async (_tx: unknown, id: string) =>
          id === 'batch-2' ? foreignBatch : null,
        ),
        findItems: mockFn(async () => []),
      };
      const useCase = new ReconcileInventorySyncBatchUseCase(
        b.em as any,
        sync as any,
        b.policy,
        b.logger as any,
      );

      const foreign = await rejection(
        inTenant(() => useCase.execute('batch-2', admin)),
      );
      const missing = await rejection(
        inTenant(() => useCase.execute('batch-9', admin)),
      );

      expectUniformNotFound(foreign);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(foreignBatch.statusConceptId).toBe(PINV.BATCH_RECEIVED);
      expect(sync.findItems).not.toHaveBeenCalled();
    });
  });
});
