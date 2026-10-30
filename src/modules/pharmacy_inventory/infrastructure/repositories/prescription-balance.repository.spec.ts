import { jest } from '@jest/globals';
import { LockMode } from '@mikro-orm/core';
import { MedicationRequests } from '../../../clinical/entities';
import { CLIN } from '../../../clinical/clinical.concepts';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import {
  PrescriptionBalanceRepository,
  RESERVING_ORDER_STATUS_IDS,
  toPrescriptionOrderItem,
} from './prescription-balance.repository';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

type Row = Record<string, unknown>;

/** ¿La fila cumple el filtro? Solo igualdad, como los usa el repositorio. */
function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, value]) => row[key] === value);
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
      requestRow({ id: 'rx-1' }),
      requestRow({ id: 'rx-2', medicationConceptId: 'concept-y' }),
      // Otro estado: también se bloquea, la receta entera queda serializada,
      // pero no es un hermano vigente.
      requestRow({
        id: 'rx-3',
        statusConceptId: CLIN.MEDICATION_REQUEST_REPLACED,
      }),
      // Emitido pero vencido: bloqueado, no vigente.
      requestRow({ id: 'rx-6', validTo: YESTERDAY }),
      requestRow({ id: 'rx-4', encounterId: 'enc-b' }),
      requestRow({ id: 'rx-5', patientProfileId: 'pat-2' }),
    ];

    it('bloquea todos los ítems del encuentro del paciente, en una consulta y en orden fijo', async () => {
      const em = fakeEm(new Map([[MedicationRequests, encounterRows()]]));

      await repo.lockRequest(em, 'rx-1', 'pat-1', NOW);

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
        'rx-6',
      ]);
    });

    it('devuelve la referida y, de las filas bloqueadas, sus hermanos ACTIVE', async () => {
      const em = fakeEm(new Map([[MedicationRequests, encounterRows()]]));

      const locked = await repo.lockRequest(em, 'rx-1', 'pat-1', NOW);

      expect(locked?.item).toEqual(
        expect.objectContaining({ id: 'rx-1', state: 'ACTIVE' }),
      );
      // rx-3 (reemplazado) y rx-6 (vencido) quedan bloqueados pero no son
      // vigentes; rx-4 es otro encuentro y rx-5 otro paciente.
      expect(locked?.siblings.map((row) => row.id)).toEqual(['rx-2']);
      expect(locked?.siblings[0]).toEqual(
        expect.objectContaining({
          medicationConceptId: 'concept-y',
          state: 'ACTIVE',
        }),
      );
    });

    it('los hermanos son solo los bloqueados: un ítem que aparece después del lock no entra', async () => {
      // La primera lectura con lock devuelve rx-1 y rx-2; una lectura posterior
      // ya vería rx-7, emitido después del bloqueo y sin bloquear.
      const em = {
        findOne: mockFn(async () => requestRow({ id: 'rx-1' })),
        find: mockFn()
          .mockResolvedValueOnce([
            requestRow({ id: 'rx-1' }),
            requestRow({ id: 'rx-2' }),
          ])
          .mockResolvedValue([
            requestRow({ id: 'rx-1' }),
            requestRow({ id: 'rx-2' }),
            requestRow({ id: 'rx-7' }),
          ]),
      } as any;

      const locked = await repo.lockRequest(em, 'rx-1', 'pat-1', NOW);

      expect(em.find).toHaveBeenCalledTimes(1);
      expect(locked?.siblings.map((row) => row.id)).toEqual(['rx-2']);
    });

    it('sin encuentro bloquea solo la referida y no tiene hermanos', async () => {
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

      const locked = await repo.lockRequest(em, 'rx-9', 'pat-1', NOW);

      expect(em.find).toHaveBeenCalledWith(
        MedicationRequests,
        { id: 'rx-9', patientProfileId: 'pat-1' },
        LOCK,
      );
      expect(locked?.item).toEqual(
        expect.objectContaining({ id: 'rx-9', encounterId: null }),
      );
      expect(locked?.siblings).toEqual([]);
    });

    it('el estado sale de la fila bloqueada, no de la lectura previa', async () => {
      // Mientras esperaba el lock, otro proceso completó la receta.
      const em = {
        findOne: mockFn(async () => requestRow()),
        find: mockFn(async () => [
          requestRow({ statusConceptId: CLIN.MEDICATION_REQUEST_COMPLETED }),
        ]),
      } as any;

      const locked = await repo.lockRequest(em, 'rx-1', 'pat-1', NOW);

      expect(locked?.item.state).toBe('NOT_ACTIVE');
    });

    it('el estado de la referida y de los hermanos se mide con el mismo instante', async () => {
      const em = fakeEm(
        new Map([
          [
            MedicationRequests,
            [
              requestRow({ id: 'rx-1', validTo: TOMORROW }),
              requestRow({ id: 'rx-2', validTo: TOMORROW }),
            ],
          ],
        ]),
      );
      const later = new Date(TOMORROW.getTime() + 1);

      const locked = await repo.lockRequest(em, 'rx-1', 'pat-1', later);

      expect(locked?.item.state).toBe('EXPIRED');
      expect(locked?.siblings).toEqual([]);
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

  describe('balanceByConcept', () => {
    /** Un `EntityManager` doble cuya conexión devuelve las filas dadas. */
    function sqlEm(rows: Row[] = []) {
      const execute = mockFn(async () => rows);
      return { em: { getConnection: () => ({ execute }) } as any, execute };
    }

    /** El SQL de la llamada, con los espacios normalizados. */
    const sqlOf = (execute: any): string =>
      (execute.mock.calls[0][0] as string).replace(/\s+/g, ' ');

    it('lee entregado y reservado en una sola sentencia (una sola foto)', async () => {
      const { em, execute } = sqlEm([
        { conceptId: X, kind: 'DISPENSED', quantity: '3' },
        { conceptId: X, kind: 'RESERVED', quantity: '4' },
        { conceptId: Y, kind: 'RESERVED', quantity: '1.5' },
      ]);

      const balance = await repo.balanceByConcept(em, ['rx-1', 'rx-2'], [X, Y]);

      expect(execute).toHaveBeenCalledTimes(1);
      const sql = sqlOf(execute);
      expect(sql).toContain(
        'FROM pharmacy_inventory.medication_dispensation_lines line',
      );
      expect(sql).toContain(
        'FROM pharmacy_inventory.inventory_reservation_lines line',
      );
      expect(sql).toContain('UNION ALL');
      expect(sql).toContain('GROUP BY movement.concept_id, movement.kind');
      expect(balance.dispensed).toEqual(new Map([[X, 3]]));
      expect(balance.reserved).toEqual(
        new Map([
          [X, 4],
          [Y, 1.5],
        ]),
      );
    });

    it('entregado: solo dispensaciones DISPENSED de la receta y de los fármacos pedidos', async () => {
      const { em, execute } = sqlEm();

      await repo.balanceByConcept(em, ['rx-1'], [X]);

      const sql = sqlOf(execute);
      expect(sql).toContain(
        'WHERE dispensation.medication_request_id IN (?) AND dispensation.dispensation_status_concept_id = ? AND product.medication_concept_id IN (?)',
      );
      const params = execute.mock.calls[0][1] as string[];
      // Primero la receta, el estado DISPENSED (nunca REVERSED) y los fármacos.
      expect(params.slice(0, 3)).toEqual(['rx-1', PINV.DISPENSE_DISPENSED, X]);
      expect(params).not.toContain(PINV.DISPENSE_REVERSED);
    });

    it('reservado: los seis estados vivos, requested − fulfilled y nunca negativo', async () => {
      const { em, execute } = sqlEm();

      await repo.balanceByConcept(em, ['rx-1'], [X]);

      const sql = sqlOf(execute);
      expect(sql).toContain(
        'GREATEST( 0, line.requested_quantity - COALESCE(line.fulfilled_quantity, 0) )',
      );
      expect(sql).toContain(
        `WHERE reservation.medication_request_id IN (?) AND reservation.reservation_status_concept_id IN (${RESERVING_ORDER_STATUS_IDS.map(() => '?').join(', ')}) AND product.medication_concept_id IN (?)`,
      );
      const params = execute.mock.calls[0][1] as string[];
      expect(params.slice(3)).toEqual([
        'rx-1',
        ...RESERVING_ORDER_STATUS_IDS,
        X,
      ]);
      for (const terminal of [
        PINV.ORDER_RETIRADO,
        PINV.ORDER_RECHAZADO,
        PINV.ORDER_VENCIDO,
        PINV.ORDER_CANCELADO,
      ]) {
        expect(params).not.toContain(terminal);
      }
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

    it('cada fármaco se cruza con el producto de la línea: otro fármaco no suma', async () => {
      const { em, execute } = sqlEm();

      await repo.balanceByConcept(em, ['rx-1'], [X, Y]);

      const sql = sqlOf(execute);
      expect(
        sql.match(
          /JOIN pharmacy\.pharmacy_products product ON product\.id = line\.pharmacy_product_id/g,
        ),
      ).toHaveLength(2);
      expect(
        sql.match(/product\.medication_concept_id IN \(\?, \?\)/g),
      ).toHaveLength(2);
    });

    it('sin recetas, sin fármacos o sin estados no consulta', async () => {
      const { em, execute } = sqlEm();

      for (const balance of [
        await repo.balanceByConcept(em, [], [X]),
        await repo.balanceByConcept(em, ['rx-1'], []),
        await repo.balanceByConcept(em, ['rx-1'], [X], []),
      ]) {
        expect(balance).toEqual({ dispensed: new Map(), reserved: new Map() });
      }
      expect(execute).not.toHaveBeenCalled();
    });

    it('dispensedByConcept y reservedByConcept son envoltorios de la misma consulta', async () => {
      const { em, execute } = sqlEm([
        { conceptId: X, kind: 'DISPENSED', quantity: '2' },
        { conceptId: X, kind: 'RESERVED', quantity: '1' },
      ]);

      expect(await repo.dispensedByConcept(em, ['rx-1'], [X])).toEqual(
        new Map([[X, 2]]),
      );
      expect(await repo.reservedByConcept(em, ['rx-1'], [X])).toEqual(
        new Map([[X, 1]]),
      );
      expect(execute).toHaveBeenCalledTimes(2);
    });
  });
});
