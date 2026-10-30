import { jest } from '@jest/globals';
import { LockMode } from '@mikro-orm/core';
import { MedicationRequests } from '../../../clinical/entities';
import { CLIN } from '../../../clinical/clinical.concepts';
import { PharmacyProducts } from '../../../pharmacy/entities';
import {
  InventoryReservationLines,
  InventoryReservations,
  MedicationDispensationLines,
  MedicationDispensations,
} from '../../entities';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import {
  PrescriptionBalanceRepository,
  RESERVING_ORDER_STATUS_IDS,
  toPrescriptionOrderItem,
} from './prescription-balance.repository';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

type Row = Record<string, unknown>;

/** ¿La fila cumple el filtro? Soporta igualdad, `$in` y `$ne`, como los usa el repositorio. */
function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, cond]) => {
    if (cond && typeof cond === 'object' && '$in' in cond) {
      return (cond as { $in: unknown[] }).$in.includes(row[key]);
    }
    if (cond && typeof cond === 'object' && '$ne' in cond) {
      return row[key] !== (cond as { $ne: unknown }).$ne;
    }
    return row[key] === cond;
  });
}

/** Un `EntityManager` doble: tablas en memoria filtradas con el WHERE que recibe. */
function fakeEm(tables: Map<unknown, Row[]>) {
  return {
    find: mockFn(async (entity: unknown, where: Row) =>
      (tables.get(entity) ?? []).filter((row) => matches(row, where)),
    ),
    findOne: mockFn(
      async (entity: unknown, where: Row) =>
        (tables.get(entity) ?? []).find((row) => matches(row, where)) ?? null,
    ),
  } as any;
}

const NOW = new Date('2026-10-30T12:00:00Z');
const YESTERDAY = new Date('2026-10-29T12:00:00Z');
const TOMORROW = new Date('2026-10-31T12:00:00Z');

/** Una fila de `clinical.medication_requests` emitida, 2 frascos, encuentro A. */
function requestRow(extra: Row = {}): Row {
  return {
    id: 'rx-1',
    patientProfileId: 'pat-1',
    encounterId: 'enc-a',
    medicationConceptId: 'concept-x',
    statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
    quantityDecimal: '2',
    unitConceptId: CLIN.MEDICATION_UNIT_BOTTLE,
    validTo: undefined,
    ...extra,
  };
}

const X = 'concept-x';
const Y = 'concept-y';

/** Productos de la farmacia: dos de X, uno de Y. */
const PRODUCTS: Row[] = [
  { id: 'prod-x1', medicationConceptId: X },
  { id: 'prod-x2', medicationConceptId: X },
  { id: 'prod-y', medicationConceptId: Y },
];

describe('PrescriptionBalanceRepository', () => {
  const repo = new PrescriptionBalanceRepository();

  describe('toPrescriptionOrderItem', () => {
    it('traduce la fila a un ítem plano del módulo', () => {
      expect(toPrescriptionOrderItem(requestRow() as any, NOW)).toEqual({
        id: 'rx-1',
        patientProfileId: 'pat-1',
        encounterId: 'enc-a',
        medicationConceptId: 'concept-x',
        state: 'ACTIVE',
        quantity: 2,
        unitConceptId: CLIN.MEDICATION_UNIT_BOTTLE,
      });
    });

    it('el estado sale de prescriptionItemState: vigente, vencida, no activa', () => {
      const state = (extra: Row) =>
        toPrescriptionOrderItem(requestRow(extra) as any, NOW).state;

      expect(state({ validTo: TOMORROW })).toBe('ACTIVE');
      expect(state({ validTo: YESTERDAY })).toBe('EXPIRED');
      for (const status of [
        CLIN.MEDICATION_REQUEST_DRAFT,
        CLIN.MEDICATION_REQUEST_INVALIDATED,
        CLIN.MEDICATION_REQUEST_REPLACED,
        CLIN.MEDICATION_REQUEST_COMPLETED,
      ]) {
        expect(state({ statusConceptId: status })).toBe('NOT_ACTIVE');
      }
    });

    it('sin cantidad, sin unidad o sin encuentro quedan en null', () => {
      expect(
        toPrescriptionOrderItem(
          requestRow({
            quantityDecimal: undefined,
            unitConceptId: undefined,
            encounterId: undefined,
          }) as any,
          NOW,
        ),
      ).toEqual(
        expect.objectContaining({
          quantity: null,
          unitConceptId: null,
          encounterId: null,
        }),
      );
    });
  });

  describe('lockRequest', () => {
    const LOCK = {
      lockMode: LockMode.PESSIMISTIC_WRITE,
      orderBy: { id: 'asc' },
      refresh: true,
    };
    const encounterRows = (): Row[] => [
      requestRow({ id: 'rx-1', validTo: YESTERDAY }),
      requestRow({ id: 'rx-2', medicationConceptId: 'concept-y' }),
      // Otro estado: también se bloquea, la receta entera queda serializada.
      requestRow({
        id: 'rx-3',
        statusConceptId: CLIN.MEDICATION_REQUEST_REPLACED,
      }),
      requestRow({ id: 'rx-4', encounterId: 'enc-b' }),
      requestRow({ id: 'rx-5', patientProfileId: 'pat-2' }),
    ];

    it('bloquea todos los ítems del encuentro del paciente, en una consulta y en orden fijo', async () => {
      const em = fakeEm(new Map([[MedicationRequests, encounterRows()]]));

      const item = await repo.lockRequest(em, 'rx-1', 'pat-1', NOW);

      // Primero ubica la receta del paciente, sin lock.
      expect(em.findOne).toHaveBeenCalledWith(MedicationRequests, {
        id: 'rx-1',
        patientProfileId: 'pat-1',
      });
      // Después bloquea el encuentro entero del paciente, ordenado por id.
      expect(em.find).toHaveBeenCalledTimes(1);
      expect(em.find).toHaveBeenCalledWith(
        MedicationRequests,
        { encounterId: 'enc-a', patientProfileId: 'pat-1' },
        LOCK,
      );
      const locked = (await em.find.mock.results[0].value) as Row[];
      expect(locked.map((row) => row.id).sort()).toEqual([
        'rx-1',
        'rx-2',
        'rx-3',
      ]);
      expect(item).toEqual(
        expect.objectContaining({ id: 'rx-1', state: 'EXPIRED' }),
      );
    });

    it('sin encuentro bloquea solo la referida', async () => {
      const em = fakeEm(
        new Map([
          [
            MedicationRequests,
            [
              requestRow({ id: 'rx-9', encounterId: undefined }),
              requestRow({ id: 'rx-2' }),
            ],
          ],
        ]),
      );

      const item = await repo.lockRequest(em, 'rx-9', 'pat-1', NOW);

      expect(em.find).toHaveBeenCalledWith(
        MedicationRequests,
        { id: 'rx-9', patientProfileId: 'pat-1' },
        LOCK,
      );
      expect(item).toEqual(
        expect.objectContaining({ id: 'rx-9', encounterId: null }),
      );
    });

    it('el estado sale de la fila bloqueada, no de la lectura previa', async () => {
      // Mientras esperaba el lock, otro proceso completó la receta.
      const em = {
        findOne: mockFn(async () => requestRow()),
        find: mockFn(async () => [
          requestRow({ statusConceptId: CLIN.MEDICATION_REQUEST_COMPLETED }),
        ]),
      } as any;

      const item = await repo.lockRequest(em, 'rx-1', 'pat-1', NOW);

      expect(item?.state).toBe('NOT_ACTIVE');
    });

    it('receta ajena o inexistente → null, sin bloquear filas', async () => {
      const em = fakeEm(new Map([[MedicationRequests, encounterRows()]]));

      await expect(
        repo.lockRequest(em, 'rx-1', 'pat-2', NOW),
      ).resolves.toBeNull();
      await expect(
        repo.lockRequest(em, 'rx-9', 'pat-1', NOW),
      ).resolves.toBeNull();
      expect(em.find).not.toHaveBeenCalled();
    });
  });

  describe('findActiveSiblings', () => {
    const requests: Row[] = [
      requestRow({ id: 'rx-1' }),
      requestRow({ id: 'rx-2', medicationConceptId: 'concept-y' }),
      requestRow({
        id: 'rx-3',
        statusConceptId: CLIN.MEDICATION_REQUEST_INVALIDATED,
      }),
      requestRow({ id: 'rx-4', encounterId: 'enc-b' }),
      requestRow({ id: 'rx-5', patientProfileId: 'pat-2' }),
      // Emitido, pero vencido: no es parte de la receta vigente.
      requestRow({ id: 'rx-6', validTo: YESTERDAY }),
    ];

    it('devuelve los vigentes del mismo encuentro y paciente, sin la referida', async () => {
      const em = fakeEm(new Map([[MedicationRequests, requests]]));

      const siblings = await repo.findActiveSiblings(
        em,
        { id: 'rx-1', encounterId: 'enc-a', patientProfileId: 'pat-1' },
        NOW,
      );

      expect(siblings.map((row) => row.id)).toEqual(['rx-2']);
      expect(siblings[0]).toEqual(
        expect.objectContaining({
          medicationConceptId: 'concept-y',
          state: 'ACTIVE',
        }),
      );
      expect(em.find).toHaveBeenCalledWith(MedicationRequests, {
        encounterId: 'enc-a',
        patientProfileId: 'pat-1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
        id: { $ne: 'rx-1' },
      });
    });

    it('sin encuentro la receta es solo la referida: no consulta', async () => {
      const em = fakeEm(new Map([[MedicationRequests, requests]]));

      const siblings = await repo.findActiveSiblings(
        em,
        { id: 'rx-9', encounterId: null, patientProfileId: 'pat-1' },
        NOW,
      );

      expect(siblings).toEqual([]);
      expect(em.find).not.toHaveBeenCalled();
    });
  });

  describe('dispensedByConcept', () => {
    const tables = () =>
      new Map<unknown, Row[]>([
        [
          MedicationDispensations,
          [
            {
              id: 'disp-1',
              medicationRequestId: 'rx-1',
              dispensationStatusConceptId: PINV.DISPENSE_DISPENSED,
            },
            {
              id: 'disp-2',
              medicationRequestId: 'rx-1',
              dispensationStatusConceptId: PINV.DISPENSE_REVERSED,
            },
            {
              id: 'disp-3',
              medicationRequestId: 'rx-otra',
              dispensationStatusConceptId: PINV.DISPENSE_DISPENSED,
            },
          ],
        ],
        [
          MedicationDispensationLines,
          [
            {
              medicationDispensationId: 'disp-1',
              pharmacyProductId: 'prod-x1',
              dispensedQuantity: '1',
            },
            {
              medicationDispensationId: 'disp-1',
              pharmacyProductId: 'prod-x2',
              dispensedQuantity: '2',
            },
            {
              medicationDispensationId: 'disp-1',
              pharmacyProductId: 'prod-y',
              dispensedQuantity: '5',
            },
            {
              medicationDispensationId: 'disp-2',
              pharmacyProductId: 'prod-x1',
              dispensedQuantity: '7',
            },
            {
              medicationDispensationId: 'disp-3',
              pharmacyProductId: 'prod-x1',
              dispensedQuantity: '11',
            },
          ],
        ],
        [PharmacyProducts, PRODUCTS],
      ]);

    it('suma solo dispensaciones DISPENSED de la receta y del fármaco pedido', async () => {
      const em = fakeEm(tables());

      const dispensed = await repo.dispensedByConcept(em, ['rx-1'], [X]);

      // disp-2 está revertida, disp-3 es de otra receta y prod-y es otro fármaco.
      expect(dispensed).toEqual(new Map([[X, 3]]));
      expect(em.find).toHaveBeenCalledWith(MedicationDispensations, {
        medicationRequestId: { $in: ['rx-1'] },
        dispensationStatusConceptId: PINV.DISPENSE_DISPENSED,
      });
    });

    it('agrupa por fármaco cuando se piden varios', async () => {
      const em = fakeEm(tables());

      const dispensed = await repo.dispensedByConcept(em, ['rx-1'], [X, Y]);

      expect(dispensed).toEqual(
        new Map([
          [X, 3],
          [Y, 5],
        ]),
      );
    });

    it('sin recetas o sin fármacos no consulta', async () => {
      const em = fakeEm(tables());

      expect(await repo.dispensedByConcept(em, [], [X])).toEqual(new Map());
      expect(await repo.dispensedByConcept(em, ['rx-1'], [])).toEqual(
        new Map(),
      );
      expect(em.find).not.toHaveBeenCalled();
    });
  });

  describe('reservedByConcept', () => {
    const statuses: [string, string][] = [
      ['ord-enviado', PINV.ORDER_ENVIADO],
      ['ord-listo', PINV.ORDER_LISTO_PARA_RETIRO],
      ['ord-retirado', PINV.ORDER_RETIRADO],
      ['ord-rechazado', PINV.ORDER_RECHAZADO],
      ['ord-vencido', PINV.ORDER_VENCIDO],
      ['ord-cancelado', PINV.ORDER_CANCELADO],
    ];
    const tables = () =>
      new Map<unknown, Row[]>([
        [
          InventoryReservations,
          [
            ...statuses.map(([id, status]) => ({
              id,
              medicationRequestId: 'rx-1',
              reservationStatusConceptId: status,
            })),
            {
              id: 'ord-otra',
              medicationRequestId: 'rx-otra',
              reservationStatusConceptId: PINV.ORDER_ENVIADO,
            },
          ],
        ],
        [
          InventoryReservationLines,
          [
            // Vivo: 2 pedidas, nada entregado.
            {
              inventoryReservationId: 'ord-enviado',
              pharmacyProductId: 'prod-x1',
              requestedQuantity: '2',
              fulfilledQuantity: null,
            },
            // Vivo: 3 pedidas, 1 ya entregada (la cuenta su dispensación).
            {
              inventoryReservationId: 'ord-listo',
              pharmacyProductId: 'prod-x2',
              requestedQuantity: '3',
              fulfilledQuantity: '1',
            },
            // Vivo, pero de otro fármaco.
            {
              inventoryReservationId: 'ord-enviado',
              pharmacyProductId: 'prod-y',
              requestedQuantity: '4',
              fulfilledQuantity: null,
            },
            ...statuses.slice(2).map(([id]) => ({
              inventoryReservationId: id,
              pharmacyProductId: 'prod-x1',
              requestedQuantity: '10',
              fulfilledQuantity: null,
            })),
            {
              inventoryReservationId: 'ord-otra',
              pharmacyProductId: 'prod-x1',
              requestedQuantity: '10',
              fulfilledQuantity: null,
            },
          ],
        ],
        [PharmacyProducts, PRODUCTS],
      ]);

    it('cuenta pedidos vivos, descuenta lo entregado y excluye terminales y otros fármacos', async () => {
      const em = fakeEm(tables());

      const reserved = await repo.reservedByConcept(em, ['rx-1'], [X]);

      // 2 (enviado) + (3 − 1) (listo); RETIRADO, RECHAZADO, VENCIDO y
      // CANCELADO no retienen, y prod-y es otro fármaco.
      expect(reserved).toEqual(new Map([[X, 4]]));
      expect(em.find).toHaveBeenCalledWith(InventoryReservations, {
        medicationRequestId: { $in: ['rx-1'] },
        reservationStatusConceptId: { $in: [...RESERVING_ORDER_STATUS_IDS] },
      });
    });

    it('los estados que retienen son los seis vivos del pedido', () => {
      expect([...RESERVING_ORDER_STATUS_IDS].sort()).toEqual(
        [
          PINV.ORDER_ENVIADO,
          PINV.ORDER_EN_REVISION,
          PINV.ORDER_CONFIRMADO,
          PINV.ORDER_ACEPTACION_PENDIENTE,
          PINV.ORDER_ACEPTADO,
          PINV.ORDER_LISTO_PARA_RETIRO,
        ].sort(),
      );
    });

    it('una línea entregada de más no resta del saldo', async () => {
      const em = fakeEm(
        new Map<unknown, Row[]>([
          [
            InventoryReservations,
            [
              {
                id: 'ord-1',
                medicationRequestId: 'rx-1',
                reservationStatusConceptId: PINV.ORDER_ACEPTADO,
              },
            ],
          ],
          [
            InventoryReservationLines,
            [
              {
                inventoryReservationId: 'ord-1',
                pharmacyProductId: 'prod-x1',
                requestedQuantity: '1',
                fulfilledQuantity: '2',
              },
            ],
          ],
          [PharmacyProducts, PRODUCTS],
        ]),
      );

      expect(await repo.reservedByConcept(em, ['rx-1'], [X])).toEqual(
        new Map([[X, 0]]),
      );
    });

    it('sin pedidos vivos no busca líneas', async () => {
      const em = fakeEm(new Map());

      expect(await repo.reservedByConcept(em, ['rx-1'], [X])).toEqual(
        new Map(),
      );
      expect(em.find).toHaveBeenCalledTimes(1);
    });
  });
});
