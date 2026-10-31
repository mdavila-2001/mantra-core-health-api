import { DIR } from '../../directory/directory.concepts';
import { PharmacyOrdersController } from '../presentation/controllers/pharmacy-orders.controller';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { IS_PUBLIC_KEY } from '../../../common/auth/public.decorator';
import { jest } from '@jest/globals';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import {
  ORDER_TTL_HOURS,
  PharmacyOrdersService,
} from '../application/pharmacy-orders/pharmacy-orders.service';
import { PharmacyOrdersUseCases } from '../application/pharmacy-orders/pharmacy-orders.use-cases';
import { PendingOrderLines } from '../application/pharmacy-orders/pending-order-lines';
import { PrescriptionOrderGuard } from '../application/pharmacy-orders/prescription-order-guard';
import { toPrescriptionOrderItem } from '../infrastructure/repositories/prescription-balance.repository';
import { PINV } from '../domain/pharmacy_inventory.concepts';
import { CLIN } from '../../clinical/clinical.concepts';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const patient = {
  id: 'user-1',
  roles: ['PATIENT'],
  patientProfileId: 'pat-1',
} as any;
const staff = { id: 'user-9', roles: ['SECURITY_ADMIN'] } as any;
const system = { id: 'user-sys', roles: ['SYSTEM'] } as any;

const PHARMACY = {
  id: 'ph-1',
  tenantId: 'tenant-a',
  legalName: 'Farmacia Andina S.R.L.',
  tradeName: 'Farmacia Andina',
} as any;
const SITE = { id: 'site-1', pharmacyId: 'ph-1', name: 'Sede Centro' } as any;
const PRODUCT = {
  id: 'prod-1',
  pharmacyId: 'ph-1',
  productCode: 'COD-1',
  genericName: 'Amoxicilina',
  medicationConceptId: 'concept-amoxi',
} as any;

/** Una posición de stock disponible en la sede. */
function position(extra: Record<string, unknown> = {}) {
  return {
    inventoryLocationId: 'loc-1',
    pharmacyProductId: 'prod-1',
    inventoryLotId: 'lot-1',
    onHandQuantity: '10',
    reservedQuantity: '0',
    quarantineQuantity: '0',
    availableQuantity: '10',
    ...extra,
  } as any;
}

/** Un pedido persistido (reserva con estado `PINV_ORDER_*`). */
function order(extra: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    pharmacyId: 'ph-1',
    pharmacySiteId: 'site-1',
    patientProfileId: 'pat-1',
    medicationRequestId: undefined,
    reservationStatusConceptId: PINV.ORDER_ENVIADO,
    createdAt: new Date('2026-08-26T10:00:00Z'),
    expiresAt: new Date(Date.now() + 60_000),
    ...extra,
  } as any;
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const fork = {};
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => fork),
  };
  const ordersRepo = {
    findOrderById: mockFn(async () => null),
    findOrderByIdForUpdate: mockFn(async () => null),
    findOrdersByPatient: mockFn(async () => []),
    findOrderByIdempotencyKey: mockFn(async () => null),
    findDueOrdersForUpdate: mockFn(async () => []),
    findLinesByReservationIds: mockFn(async () => []),
    findPharmaciesByIdsInTenant: mockFn(async () => [PHARMACY]),
    findPharmaciesByIds: mockFn(async () => [PHARMACY]),
    findSitesByIds: mockFn(async () => [SITE]),
    findProductsByIds: mockFn(async () => [PRODUCT]),
    findConceptsByIds: mockFn(async () => []),
    findOwnMedicationRequest: mockFn(async () => null),
    findPrescriberProfileId: mockFn(async () => null),
    findPersonNamesByProfileIds: mockFn(async () => new Map()),
    findPrescriberProfileIdsByRequestIds: mockFn(async () => new Map()),
    findPrimarySpecialtyConceptIds: mockFn(async () => new Map()),
    findAddressesByIds: mockFn(async () => []),
    findPharmaciesByTenant: mockFn(async () => [PHARMACY]),
    findOrdersForPharmacies: mockFn(async () => []),
  };
  const reservationsRepo = {
    create: mockFn(() => ({
      id: 'order-1',
      pharmacyId: 'ph-1',
      pharmacySiteId: 'site-1',
    })),
    createLine: mockFn(() => ({ id: 'line-1' })),
  };
  const stockRepo = { findByKeyForUpdate: mockFn(async () => null) };
  const ledgerRepo = {
    nextSequence: mockFn(async () => '1'),
    append: mockFn(() => ({ id: 'led-1' })),
  };
  const inventoryReadRepo = {
    findActiveLocationsBySites: mockFn(async () => [
      { id: 'loc-1', pharmacySiteId: 'site-1' },
    ]),
    findStockPositions: mockFn(async () => []),
  };
  const dispensationsRepo = {
    findByIdempotencyKey: mockFn(async () => null),
    create: mockFn(() => ({ id: 'disp-1' })),
    createLine: mockFn(() => ({ id: 'dline-1' })),
  };
  const substitutionsRepo = {
    findByReservationIds: mockFn(async () => []),
    create: mockFn(() => ({ id: 'sub-1' })),
  };
  const pharmacyRepo = {
    findActiveSiteById: mockFn(async () => SITE),
    findVisibleById: mockFn(async () => PHARMACY),
    findSellableProductsByIds: mockFn(async () => [PRODUCT]),
    findCurrentPublicPriceLists: mockFn(async () => []),
    findCurrentPrices: mockFn(async () => []),
  };
  const reservationsService = { releaseConfirmedLines: mockFn(async () => 1) };
  const outbox = { publish: mockFn(async () => ({})) };
  const orderNotifications = {
    orderUnderReview: mockFn(async () => ({ suppressed: false })),
    orderConfirmed: mockFn(async () => ({ suppressed: false })),
    orderReady: mockFn(async () => ({ suppressed: false })),
    orderRejected: mockFn(async () => ({ suppressed: false })),
    substitutionsProposed: mockFn(async () => ({ suppressed: false })),
    orderExpired: mockFn(async () => ({ suppressed: false })),
    expiredToPrescriber: mockFn(async () => ({ suppressed: false })),
    dispensedToPrescriber: mockFn(async () => ({ suppressed: false })),
  };
  const settlements = {
    forOrders: mockFn(async () => new Map()),
    activeClaimForDispensation: mockFn(async () => undefined),
  };
  const tenantAdministration = { canAdminister: mockFn(async () => false) };
  // El chat del pedido (community), doblado: por defecto ninguna farmacia
  // tiene vitrina y abrir el hilo devuelve uno fijo.
  const orderChat = {
    findPharmacyShowcases: mockFn(async () => new Map()),
    openOrderConversation: mockFn(async () => ({
      conversationId: 'conv-1',
      pharmacyProfileId: 'vitrina-1',
    })),
  };
  const accountLinks = {
    findActiveByPerson: mockFn(async () => ({ userId: 'user-1' })),
  };
  // El saldo de la receta (FAR-03), doblado: por defecto ninguna receta
  // existe, y no hay entregas ni reservas.
  const balances = {
    lockRequest: mockFn(async () => null),
    balanceByConcept: mockFn(async () => ({
      dispensed: new Map(),
      reserved: new Map(),
    })),
    orderedCountByConcept: mockFn(async () => new Map()),
  };
  const prescriptionGuard = new PrescriptionOrderGuard(balances as any);
  const logger = { setContext: mockFn(), info: mockFn() };
  // El escritor por sede: por defecto no escribe nada.
  const siteStockWriter = { write: mockFn(async () => []) };
  const useCases = new PharmacyOrdersUseCases(
    em as any,
    ordersRepo as any,
    reservationsRepo as any,
    stockRepo as any,
    ledgerRepo as any,
    inventoryReadRepo as any,
    dispensationsRepo as any,
    substitutionsRepo as any,
    pharmacyRepo as any,
    reservationsService as any,
    outbox as any,
    orderNotifications as any,
    logger as any,
    settlements as any,
    tenantAdministration as any,
    orderChat as any,
    accountLinks as any,
    prescriptionGuard,
    // Las líneas «por confirmar», con el escritor por sede doblado.
    new PendingOrderLines(inventoryReadRepo as any, siteStockWriter as any),
  );
  const service = new PharmacyOrdersService(useCases, logger as any);
  return {
    service,
    balances,
    orderChat,
    accountLinks,
    settlements,
    tenantAdministration,
    tx,
    fork,
    em,
    ordersRepo,
    reservationsRepo,
    stockRepo,
    ledgerRepo,
    inventoryReadRepo,
    dispensationsRepo,
    substitutionsRepo,
    pharmacyRepo,
    reservationsService,
    outbox,
    orderNotifications,
    siteStockWriter,
  };
}

/** Mocks de lectura para que `readOwnOrder`/`getOrder` compongan el pedido dado. */
function withReading(d: ReturnType<typeof build>, order: any, lines: any[]) {
  d.ordersRepo.findOrderById.mockResolvedValue(order);
  d.ordersRepo.findLinesByReservationIds.mockResolvedValue(lines);
}

describe('PharmacyOrdersService', () => {
  describe('create', () => {
    it('creates the order ENVIADO reserving stock with UC-25-04 accounting', async () => {
      const d = build();
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([position()]);
      const blocked = position();
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(blocked);
      withReading(d, order(), [
        {
          inventoryReservationId: 'order-1',
          pharmacyProductId: 'prod-1',
          requestedQuantity: '3',
          reservedQuantity: '3',
          statusConceptId: PINV.RES_LINE_CONFIRMED,
        },
      ]);

      const res = await runWithTenant('tenant-a', () =>
        d.service.create(
          { siteId: 'site-1', lines: [{ productId: 'prod-1', quantity: 3 }] },
          patient,
        ),
      );

      // Cabecera: nace ENVIADO, del paciente del token, sin confirmed_at.
      expect(d.reservationsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          patientProfileId: 'pat-1',
          reservationStatusConceptId: PINV.ORDER_ENVIADO,
        }),
      );
      // Contabilidad de reserva: lock, línea, asiento y posición recalculada.
      expect(d.stockRepo.findByKeyForUpdate).toHaveBeenCalledWith(d.tx, {
        inventoryLocationId: 'loc-1',
        pharmacyProductId: 'prod-1',
        inventoryLotId: 'lot-1',
      });
      expect(d.reservationsRepo.createLine).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          reservedQuantity: '3',
          statusConceptId: PINV.RES_LINE_CONFIRMED,
        }),
      );
      expect(d.ledgerRepo.append).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          movementTypeConceptId: PINV.MV_RESERVE,
          reservationDelta: '3',
        }),
      );
      expect(blocked.reservedQuantity).toBe('3');
      expect(blocked.availableQuantity).toBe('7');
      // El hecho se publica en la misma transacción.
      expect(d.outbox.publish).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'PharmacyOrderSubmitted' }),
      );
      // Y la respuesta va en palabras.
      expect(res.status.code).toBe('PINV_ORDER_ENVIADO');
      expect(res.lines[0].reservedQuantity).toBe(3);
    });

    it('a line without stock stays SIN_STOCK and does NOT sink the order', async () => {
      const d = build();
      // prod-2 no tiene posición en la sede y el catálogo dice 0: no hay.
      const products = [
        PRODUCT,
        { ...PRODUCT, id: 'prod-2', stockQuantity: 0 },
      ];
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue(products);
      // Solo prod-1 tiene posición; prod-2 no existe en el estante.
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([position()]);
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(position());
      withReading(d, order(), []);

      await runWithTenant('tenant-a', () =>
        d.service.create(
          {
            siteId: 'site-1',
            lines: [
              { productId: 'prod-1', quantity: 3 },
              { productId: 'prod-2', quantity: 2 },
            ],
          },
          patient,
        ),
      );

      // La línea sin stock queda dicha, con cantidad reservada 0 y sin asiento.
      expect(d.reservationsRepo.createLine).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          pharmacyProductId: 'prod-2',
          reservedQuantity: '0',
          statusConceptId: PINV.RES_LINE_OUT_OF_STOCK,
        }),
      );
      expect(d.ledgerRepo.append).toHaveBeenCalledTimes(1);
      expect(d.outbox.publish).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          payloadJson: expect.objectContaining({ outOfStockLineCount: 1 }),
        }),
      );
    });

    it('sets the 48 hour expiry window', async () => {
      const d = build();
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([position()]);
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(position());
      withReading(d, order(), []);

      const before = Date.now();
      await runWithTenant('tenant-a', () =>
        d.service.create(
          { siteId: 'site-1', lines: [{ productId: 'prod-1', quantity: 1 }] },
          patient,
        ),
      );

      const data = d.reservationsRepo.create.mock.calls[0][1];
      const ttlMs = data.expiresAt.getTime() - before;
      expect(ttlMs).toBeGreaterThanOrEqual(ORDER_TTL_HOURS * 3_600_000 - 5_000);
      expect(ttlMs).toBeLessThanOrEqual(ORDER_TTL_HOURS * 3_600_000 + 5_000);
    });

    it('idempotency: repeating the key returns the existing order without reserving again', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdempotencyKey.mockResolvedValue(
        order({ id: 'order-9' }),
      );
      withReading(d, order({ id: 'order-9' }), []);

      const res = await runWithTenant('tenant-a', () =>
        d.service.create(
          {
            siteId: 'site-1',
            idempotencyKey: 'k-1',
            lines: [{ productId: 'prod-1', quantity: 3 }],
          },
          patient,
        ),
      );

      expect(res.id).toBe('order-9');
      expect(d.reservationsRepo.create).not.toHaveBeenCalled();
      expect(d.ledgerRepo.append).not.toHaveBeenCalled();
      expect(d.outbox.publish).not.toHaveBeenCalled();
    });

    it('a foreign prescription and a missing one are the same 404', async () => {
      const d = build();
      // La lectura de la receta (con lock) está acotada al paciente del token.
      d.balances.lockRequest.mockResolvedValue(null);

      await expect(
        runWithTenant('tenant-a', () =>
          d.service.create(
            {
              siteId: 'site-1',
              medicationRequestId: 'req-ajena',
              lines: [{ productId: 'prod-1', quantity: 1 }],
            },
            patient,
          ),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.balances.lockRequest).toHaveBeenCalledWith(
        d.tx,
        'req-ajena',
        'pat-1',
        expect.any(Date),
      );
      expect(d.reservationsRepo.create).not.toHaveBeenCalled();
    });

    it('an account without patient profile cannot order', async () => {
      const d = build();
      await expect(
        runWithTenant('tenant-a', () =>
          d.service.create(
            { siteId: 'site-1', lines: [{ productId: 'prod-1', quantity: 1 }] },
            staff,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('create · lo ofrecido se puede reservar (D-5)', () => {
    /** El error de la promesa. */
    async function failure(promise: Promise<unknown>): Promise<any> {
      try {
        await promise;
      } catch (error) {
        return error;
      }
      throw new Error('se esperaba un rechazo');
    }

    function createWith(
      d: ReturnType<typeof build>,
      lines: { productId: string; quantity: number }[],
    ) {
      return runWithTenant('tenant-a', () =>
        d.service.create({ siteId: 'site-1', lines }, patient),
      );
    }

    it('a product offered by its catalogue without a position enters «por confirmar», without touching stock', async () => {
      const d = build();
      // «Como en el catálogo»: sin posición en la sede, catálogo sin conteo.
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([
        { ...PRODUCT, stockQuantity: null },
      ]);
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([]);
      withReading(d, order(), [
        {
          inventoryReservationId: 'order-1',
          pharmacyProductId: 'prod-1',
          requestedQuantity: '2',
          reservedQuantity: '0',
          statusConceptId: PINV.RES_LINE_PENDING_CONFIRMATION,
        },
      ]);

      const res = await createWith(d, [{ productId: 'prod-1', quantity: 2 }]);

      expect(d.reservationsRepo.createLine).toHaveBeenCalledTimes(1);
      expect(d.reservationsRepo.createLine).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          pharmacyProductId: 'prod-1',
          requestedQuantity: '2',
          reservedQuantity: '0',
          statusConceptId: PINV.RES_LINE_PENDING_CONFIRMATION,
        }),
      );
      // Ni candado de posición, ni asiento, ni stock escrito.
      expect(d.stockRepo.findByKeyForUpdate).not.toHaveBeenCalled();
      expect(d.ledgerRepo.append).not.toHaveBeenCalled();
      expect(d.ledgerRepo.nextSequence).not.toHaveBeenCalled();
      // El paciente lo ve «por confirmar», no sin stock.
      expect(res.status.code).toBe('PINV_ORDER_ENVIADO');
      expect(res.lines[0].status.code).toBe(
        'PINV_RES_LINE_PENDING_CONFIRMATION',
      );
      expect(res.lines[0].reservedQuantity).toBe(0);
    });

    it('a catalogue with a positive count and no position also enters «por confirmar»', async () => {
      const d = build();
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([
        { ...PRODUCT, stockQuantity: 7 },
      ]);
      withReading(d, order(), []);

      await createWith(d, [{ productId: 'prod-1', quantity: 2 }]);

      expect(d.reservationsRepo.createLine).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          statusConceptId: PINV.RES_LINE_PENDING_CONFIRMATION,
        }),
      );
      expect(d.ledgerRepo.append).not.toHaveBeenCalled();
    });

    it('catalogue 0 and «Lo tengo» in the site: the ledger reserves it', async () => {
      const d = build();
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([
        { ...PRODUCT, stockQuantity: 0 },
      ]);
      const site = position({
        inventoryLotId: undefined,
        onHandQuantity: '1',
        availableQuantity: '1',
      });
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([site]);
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(site);
      withReading(d, order(), []);

      await createWith(d, [{ productId: 'prod-1', quantity: 1 }]);

      expect(d.reservationsRepo.createLine).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          reservedQuantity: '1',
          statusConceptId: PINV.RES_LINE_CONFIRMED,
        }),
      );
      expect(site.availableQuantity).toBe('0');
    });

    it('an order with only «No lo tengo» lines answers 422 PRODUCT_OUT_OF_STOCK and writes nothing that survives', async () => {
      const d = build();
      const products = [
        { ...PRODUCT, stockQuantity: 9 },
        { ...PRODUCT, id: 'prod-2', stockQuantity: 0 },
      ];
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue(products);
      // prod-1: la sede dijo «No lo tengo» (posición en 0). prod-2: sin
      // posición y el catálogo en 0.
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([
        position({ onHandQuantity: '0', availableQuantity: '0' }),
      ]);

      const error = await failure(
        createWith(d, [
          { productId: 'prod-1', quantity: 1 },
          { productId: 'prod-2', quantity: 1 },
        ]),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.getStatus()).toBe(422);
      expect(error.getResponse()).toEqual(
        expect.objectContaining({
          code: 'PRECONDITION_FAILED',
          reason: 'PRODUCT_OUT_OF_STOCK',
          details: expect.objectContaining({
            reason: 'PRODUCT_OUT_OF_STOCK',
            siteId: 'site-1',
          }),
        }),
      );
      // El rechazo sale de adentro de la transacción (la deshace entera) y
      // antes del evento: nada se reservó ni se publicó.
      expect(d.em.transactional).toHaveBeenCalledTimes(1);
      expect(d.ledgerRepo.append).not.toHaveBeenCalled();
      expect(d.outbox.publish).not.toHaveBeenCalled();
      expect(d.ordersRepo.findOrderById).not.toHaveBeenCalled();
    });

    it('one line «por confirmar» is enough for the order to enter', async () => {
      const d = build();
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([
        { ...PRODUCT, stockQuantity: 9 },
        { ...PRODUCT, id: 'prod-2', stockQuantity: null },
      ]);
      // prod-1 «No lo tengo» en la sede; prod-2 sin posición.
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([
        position({ onHandQuantity: '0', availableQuantity: '0' }),
      ]);
      withReading(d, order(), []);

      await createWith(d, [
        { productId: 'prod-1', quantity: 1 },
        { productId: 'prod-2', quantity: 1 },
      ]);

      expect(d.outbox.publish).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'PharmacyOrderSubmitted' }),
      );
      expect(d.reservationsRepo.createLine).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          pharmacyProductId: 'prod-1',
          statusConceptId: PINV.RES_LINE_OUT_OF_STOCK,
        }),
      );
      expect(d.reservationsRepo.createLine).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          pharmacyProductId: 'prod-2',
          statusConceptId: PINV.RES_LINE_PENDING_CONFIRMATION,
        }),
      );
    });

    it('two orders for the last unit: only one takes the reservation', async () => {
      const d = build();
      // La última unidad, compartida por los dos pedidos. La lectura previa
      // (sin candado) dice 1 a los dos; la que manda es la que se relee con
      // FOR UPDATE.
      const last = position({
        inventoryLotId: undefined,
        onHandQuantity: '1',
        availableQuantity: '1',
      });
      d.inventoryReadRepo.findStockPositions.mockImplementation(async () => [
        { ...last, availableQuantity: '1' },
      ]);
      // El candado de fila, como en la base: el segundo FOR UPDATE espera a
      // que la transacción del primero termine.
      let tail: Promise<void> = Promise.resolve();
      d.stockRepo.findByKeyForUpdate.mockImplementation(async (tx: any) => {
        const previous = tail;
        tail = new Promise<void>((release) => {
          tx.release = release;
        });
        await previous;
        return last;
      });
      d.em.transactional.mockImplementation(async (cb: any) => {
        const tx: any = { flush: mockFn() };
        try {
          return await cb(tx);
        } finally {
          tx.release?.();
        }
      });
      withReading(d, order(), []);

      const results = await Promise.allSettled([
        createWith(d, [{ productId: 'prod-1', quantity: 1 }]),
        createWith(d, [{ productId: 'prod-1', quantity: 1 }]),
      ]);

      expect(results.map((result) => result.status).sort()).toEqual([
        'fulfilled',
        'rejected',
      ]);
      const rejected = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected',
      );
      expect(rejected?.reason.getResponse().reason).toBe(
        'PRODUCT_OUT_OF_STOCK',
      );
      // Una sola reserva en el libro, y la posición no queda en negativo.
      const reserves = d.ledgerRepo.append.mock.calls.filter(
        ([, entry]: any) => entry.movementTypeConceptId === PINV.MV_RESERVE,
      );
      expect(reserves).toHaveLength(1);
      expect(last.reservedQuantity).toBe('1');
      expect(last.availableQuantity).toBe('0');
    });
  });

  describe('create · el pedido respeta la receta (FAR-03)', () => {
    const RX_PRODUCT = { ...PRODUCT, requiresPrescription: true } as any;

    /**
     * Un ítem emitido del paciente (2 frascos de amoxicilina, encuentro A),
     * tal como lo entrega el repositorio: la fila clínica traducida con la
     * regla única de receta vigente.
     */
    function rxItem(extra: Record<string, unknown> = {}) {
      return toPrescriptionOrderItem(
        {
          id: 'rx-1',
          patientProfileId: 'pat-1',
          encounterId: 'enc-a',
          medicationConceptId: 'concept-amoxi',
          statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
          quantityDecimal: '2',
          unitConceptId: CLIN.MEDICATION_UNIT_BOTTLE,
          validTo: undefined,
          ...extra,
        } as any,
        new Date(),
      );
    }

    /** La receta bloqueada: la referida y sus hermanos (ya bloqueados). */
    function rxLocked(
      extra: Record<string, unknown> = {},
      siblings: Record<string, unknown>[] = [],
    ) {
      return { item: rxItem(extra), siblings: siblings.map(rxItem) };
    }

    /** Pide `quantity` unidades de `prod-1`; `null` = sin receta. */
    function createOrder(
      d: ReturnType<typeof build>,
      quantity = 1,
      medicationRequestId: string | null = 'rx-1',
    ) {
      return runWithTenant('tenant-a', () =>
        d.service.create(
          {
            siteId: 'site-1',
            medicationRequestId: medicationRequestId ?? undefined,
            lines: [{ productId: 'prod-1', quantity }],
          },
          patient,
        ),
      );
    }

    /** El error de la promesa, para mirar su cuerpo HTTP. */
    async function failureOf(promise: Promise<unknown>): Promise<any> {
      try {
        await promise;
      } catch (error) {
        return error;
      }
      throw new Error('se esperaba un rechazo');
    }

    /** 422 con el motivo en `reason` y en `details.reason`, y el mensaje para el paciente. */
    function expect422(
      error: any,
      reason: string,
      message: string,
      details: Record<string, unknown>,
    ) {
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.getStatus()).toBe(422);
      expect(error.getResponse()).toEqual({
        code: 'PRECONDITION_FAILED',
        message,
        reason,
        details: { reason, ...details },
      });
    }

    /** Un 422 no deja reserva, líneas, asientos ni eventos. */
    function expectNoEffects(d: ReturnType<typeof build>) {
      expect(d.reservationsRepo.create).not.toHaveBeenCalled();
      expect(d.reservationsRepo.createLine).not.toHaveBeenCalled();
      expect(d.stockRepo.findByKeyForUpdate).not.toHaveBeenCalled();
      expect(d.ledgerRepo.append).not.toHaveBeenCalled();
      expect(d.outbox.publish).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    }

    /** Stock y lectura listos para que el alta llegue hasta el final. */
    function readyToCreate(d: ReturnType<typeof build>) {
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([position()]);
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(position());
      withReading(d, order({ medicationRequestId: 'rx-1' }), []);
    }

    it('una receta invalidada → 422 PRESCRIPTION_NOT_ACTIVE', async () => {
      const d = build();
      d.balances.lockRequest.mockResolvedValue(
        rxLocked({ statusConceptId: CLIN.MEDICATION_REQUEST_INVALIDATED }),
      );
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([RX_PRODUCT]);

      expect422(
        await failureOf(createOrder(d)),
        'PRESCRIPTION_NOT_ACTIVE',
        'Esta receta ya no se puede usar: fue anulada, reemplazada o ya se entregó.',
        { medicationRequestId: 'rx-1' },
      );
      expectNoEffects(d);
    });

    it('una receta vencida → 422 PRESCRIPTION_EXPIRED', async () => {
      const d = build();
      d.balances.lockRequest.mockResolvedValue(
        rxLocked({ validTo: new Date(Date.now() - 86_400_000) }),
      );
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([RX_PRODUCT]);

      expect422(
        await failureOf(createOrder(d)),
        'PRESCRIPTION_EXPIRED',
        'Esta receta venció. Pida a su médico una nueva.',
        { medicationRequestId: 'rx-1' },
      );
      expectNoEffects(d);
    });

    it('un producto con receta obligatoria de otro fármaco → 422 PRODUCT_NOT_PRESCRIBED', async () => {
      const d = build();
      d.balances.lockRequest.mockResolvedValue(rxLocked());
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([
        { ...RX_PRODUCT, medicationConceptId: 'concept-otro' },
      ]);

      expect422(
        await failureOf(createOrder(d)),
        'PRODUCT_NOT_PRESCRIBED',
        'Uno de los productos no es el medicamento de su receta. Quítelo del pedido para continuar.',
        { medicationRequestId: 'rx-1', productIds: ['prod-1'] },
      );
      expectNoEffects(d);
    });

    it('lo pedido por encima del saldo → 422 QUANTITY_EXCEEDS_PRESCRIPTION', async () => {
      const d = build();
      d.balances.lockRequest.mockResolvedValue(rxLocked());
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([RX_PRODUCT]);
      // Recetados 2 frascos, 1 ya reservado en otro pedido vivo: quedan 1.
      d.balances.balanceByConcept.mockResolvedValue({
        dispensed: new Map(),
        reserved: new Map([['concept-amoxi', 1]]),
      });

      expect422(
        await failureOf(createOrder(d, 2)),
        'QUANTITY_EXCEEDS_PRESCRIPTION',
        'Está pidiendo más de lo que le queda en su receta.',
        { medicationRequestId: 'rx-1', productIds: ['prod-1'] },
      );
      // Entregado y reservado en una sola lectura (la misma foto).
      expect(d.balances.balanceByConcept).toHaveBeenCalledTimes(1);
      expect(d.balances.balanceByConcept).toHaveBeenCalledWith(
        d.tx,
        ['rx-1'],
        ['concept-amoxi'],
      );
      expectNoEffects(d);
    });

    it('una receta en comprimidos ya pedida → 422 PRESCRIPTION_ITEM_ALREADY_ORDERED, sin efectos', async () => {
      const d = build();
      // 21 comprimidos: sin saldo comparable. Ya tiene un pedido vivo.
      d.balances.lockRequest.mockResolvedValue(
        rxLocked({ quantityDecimal: '21', unitConceptId: 'unit-tablet' }),
      );
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([RX_PRODUCT]);
      d.balances.orderedCountByConcept.mockResolvedValue(
        new Map([['concept-amoxi', 1]]),
      );

      expect422(
        await failureOf(createOrder(d, 1)),
        'PRESCRIPTION_ITEM_ALREADY_ORDERED',
        'Este medicamento de su receta ya tiene un pedido en curso o ya se entregó. Si necesita más, pida a su médico una receta nueva.',
        { medicationRequestId: 'rx-1', productIds: ['prod-1'] },
      );
      expectNoEffects(d);
    });

    it('sin receta, un producto de receta obligatoria → 422 PRESCRIPTION_REQUIRED', async () => {
      const d = build();
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([RX_PRODUCT]);

      expect422(
        await failureOf(createOrder(d, 1, null)),
        'PRESCRIPTION_REQUIRED',
        'Uno de los productos se vende solo con receta. Elíjalo desde «Mis recetas».',
        { medicationRequestId: null, productIds: ['prod-1'] },
      );
      expect(d.balances.lockRequest).not.toHaveBeenCalled();
      expectNoEffects(d);
    });

    it('dentro del saldo crea el pedido con la receta y pide el lock sobre ella', async () => {
      const d = build();
      d.balances.lockRequest.mockResolvedValue(rxLocked());
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([RX_PRODUCT]);
      readyToCreate(d);

      await createOrder(d, 2);

      expect(d.balances.lockRequest).toHaveBeenCalledWith(
        d.tx,
        'rx-1',
        'pat-1',
        expect.any(Date),
      );
      // Un solo instante por pedido, y solo se mide en el lock: la referida
      // y sus hermanos salen de esa lectura; después solo se lee el saldo.
      expect(d.balances.lockRequest).toHaveBeenCalledTimes(1);
      expect(d.balances.balanceByConcept).toHaveBeenCalledTimes(1);
      expect(d.reservationsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ medicationRequestId: 'rx-1' }),
      );
      // El lock va antes de leer los productos y de reservar.
      expect(d.balances.lockRequest.mock.invocationCallOrder[0]).toBeLessThan(
        d.pharmacyRepo.findSellableProductsByIds.mock.invocationCallOrder[0],
      );
    });

    it('un fármaco hermano del mismo encuentro también es de la receta', async () => {
      const d = build();
      d.balances.lockRequest.mockResolvedValue(
        rxLocked({}, [
          {
            id: 'rx-2',
            medicationConceptId: 'concept-ibu',
            unitConceptId: CLIN.MEDICATION_UNIT_TABLET,
            quantityDecimal: '30',
          },
        ]),
      );
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([
        { ...RX_PRODUCT, medicationConceptId: 'concept-ibu' },
      ]);
      readyToCreate(d);
      // La sede tiene los 50: lo que se mide acá es la receta, no el stock.
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([
        position({ availableQuantity: '50', onHandQuantity: '50' }),
      ]);
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(
        position({ availableQuantity: '50', onHandQuantity: '50' }),
      );

      // Comprimidos no se comparan con envases: 50 pasa (D-5).
      await createOrder(d, 50);

      expect(d.reservationsRepo.create).toHaveBeenCalled();
      // Solo se consulta el saldo de lo comparable: la amoxicilina en frascos,
      // no el ibuprofeno en comprimidos.
      expect(d.balances.balanceByConcept).toHaveBeenCalledWith(
        d.tx,
        ['rx-1', 'rx-2'],
        ['concept-amoxi'],
      );
    });

    it('un fármaco que no está entre las filas bloqueadas no autoriza nada (otro emitido después del lock)', async () => {
      const d = build();
      // El lock devolvió la receta sin hermanos; el doble no ofrece otra
      // lectura de la receta, así que el guard no puede ir a buscarlos.
      d.balances.lockRequest.mockResolvedValue(rxLocked());
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([
        { ...RX_PRODUCT, medicationConceptId: 'concept-ibu' },
      ]);

      expect422(
        await failureOf(createOrder(d)),
        'PRODUCT_NOT_PRESCRIBED',
        'Uno de los productos no es el medicamento de su receta. Quítelo del pedido para continuar.',
        { medicationRequestId: 'rx-1', productIds: ['prod-1'] },
      );
      expectNoEffects(d);
    });

    it('una línea de venta libre con receta pasa sin validarse contra ella (D-4)', async () => {
      const d = build();
      d.balances.lockRequest.mockResolvedValue(rxLocked());
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([
        { ...PRODUCT, medicationConceptId: 'concept-otro' },
      ]);
      readyToCreate(d);

      await createOrder(d, 9);

      expect(d.reservationsRepo.create).toHaveBeenCalled();
    });

    it('receta ajena sigue siendo 404, no 422', async () => {
      const d = build();
      d.balances.lockRequest.mockResolvedValue(null);
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([RX_PRODUCT]);

      await expect(createOrder(d)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      expectNoEffects(d);
    });

    it('producto ajeno sigue siendo 404 antes que la receta', async () => {
      const d = build();
      d.balances.lockRequest.mockResolvedValue(
        rxLocked({ statusConceptId: CLIN.MEDICATION_REQUEST_INVALIDATED }),
      );
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([
        { ...RX_PRODUCT, pharmacyId: 'ph-otra' },
      ]);

      await expect(createOrder(d)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      expectNoEffects(d);
    });

    it('la idempotencia responde antes que cualquier validación de receta', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdempotencyKey.mockResolvedValue(
        order({ id: 'order-9', medicationRequestId: 'rx-1' }),
      );
      withReading(d, order({ id: 'order-9' }), []);
      // Aunque hoy la receta ya no sirva, repetir la clave devuelve el pedido.
      d.balances.lockRequest.mockResolvedValue(
        rxLocked({ statusConceptId: CLIN.MEDICATION_REQUEST_COMPLETED }),
      );
      d.pharmacyRepo.findSellableProductsByIds.mockResolvedValue([RX_PRODUCT]);

      const res = await runWithTenant('tenant-a', () =>
        d.service.create(
          {
            siteId: 'site-1',
            idempotencyKey: 'k-1',
            medicationRequestId: 'rx-1',
            lines: [{ productId: 'prod-1', quantity: 5 }],
          },
          patient,
        ),
      );

      expect(res.id).toBe('order-9');
      expect(d.balances.lockRequest).not.toHaveBeenCalled();
      expect(d.reservationsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('create · precios congelados (v4.2.1)', () => {
    it('freezes the line price and the header total at creation time', async () => {
      const d = build();
      d.pharmacyRepo.findCurrentPublicPriceLists.mockResolvedValue([
        {
          id: 'list-1',
          pharmacyId: 'ph-1',
          pharmacySiteId: null,
          currencyConceptId: 'cur-bob',
          code: 'PUBLICA',
        },
      ]);
      d.pharmacyRepo.findCurrentPrices.mockResolvedValue([
        {
          pharmacyProductId: 'prod-1',
          pharmacyPriceListId: 'list-1',
          unitAmount: '68.00',
          patientAmount: null,
        },
      ]);
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([position()]);
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(position());
      withReading(d, order(), [
        {
          inventoryReservationId: 'order-1',
          pharmacyProductId: 'prod-1',
          requestedQuantity: '3',
          reservedQuantity: '3',
          statusConceptId: PINV.RES_LINE_CONFIRMED,
          unitPriceAmount: '68.00',
          currencyConceptId: 'cur-bob',
        },
      ]);

      await runWithTenant('tenant-a', () =>
        d.service.create(
          { siteId: 'site-1', lines: [{ productId: 'prod-1', quantity: 3 }] },
          patient,
        ),
      );

      // Cada porción nace con el precio de HOY sellado.
      expect(d.reservationsRepo.createLine).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          unitPriceAmount: '68.00',
          currencyConceptId: 'cur-bob',
        }),
      );
      // Y la cabecera con el total exacto: 3 × 68.00.
      const header = d.reservationsRepo.create.mock.results[0].value;
      expect(header.totalAmount).toBe('204.00');
      expect(header.currencyConceptId).toBe('cur-bob');
    });

    it('a product without a published price leaves the line and the total honestly null', async () => {
      const d = build();
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([position()]);
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(position());
      withReading(d, order(), [
        {
          inventoryReservationId: 'order-1',
          pharmacyProductId: 'prod-1',
          requestedQuantity: '3',
          reservedQuantity: '3',
          statusConceptId: PINV.RES_LINE_CONFIRMED,
        },
      ]);

      await runWithTenant('tenant-a', () =>
        d.service.create(
          { siteId: 'site-1', lines: [{ productId: 'prod-1', quantity: 3 }] },
          patient,
        ),
      );

      expect(d.reservationsRepo.createLine).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ unitPriceAmount: undefined }),
      );
      const header = d.reservationsRepo.create.mock.results[0].value;
      expect(header.totalAmount).toBeUndefined();
    });
  });

  describe('create · modalidad de entrega (v4.2.1)', () => {
    it('persists the RETIRO concept when the order declares pickup', async () => {
      const d = build();
      withReading(d, order(), []);

      await runWithTenant('tenant-a', () =>
        d.service.create(
          {
            siteId: 'site-1',
            deliveryMode: 'RETIRO',
            lines: [{ productId: 'prod-1', quantity: 3 }],
          },
          patient,
        ),
      );

      expect(d.reservationsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          deliveryModeConceptId: PINV.DELIVERY_RETIRO,
        }),
      );
    });

    it('shipping modes answer a typed 422 before touching anything (FAR-E4 lane)', async () => {
      const d = build();

      const error = await runWithTenant('tenant-a', () =>
        d.service
          .create(
            {
              siteId: 'site-1',
              deliveryMode: 'DOMICILIO',
              lines: [{ productId: 'prod-1', quantity: 3 }],
            },
            patient,
          )
          .catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as any).details).toMatchObject({
        deliveryMode: 'DOMICILIO',
      });
      // Ni transacción ni cabecera: el 422 corta antes de escribir.
      expect(d.em.transactional).not.toHaveBeenCalled();
      expect(d.reservationsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('getOrder', () => {
    it('delegates detail authorization without exposing a public route or changing mutation roles', () => {
      const controller = PharmacyOrdersController.prototype;
      expect(
        Reflect.getMetadata(ROLES_KEY, Reflect.get(controller, 'getOrder')),
      ).toBeUndefined();
      expect(
        Reflect.getMetadata(IS_PUBLIC_KEY, Reflect.get(controller, 'getOrder')),
      ).not.toBe(true);
      expect(
        Reflect.getMetadata(IS_PUBLIC_KEY, PharmacyOrdersController),
      ).not.toBe(true);
      for (const handler of [
        'listForTenant',
        'openReview',
        'confirm',
        'reject',
        'ready',
        'dispense',
      ]) {
        expect(
          Reflect.getMetadata(ROLES_KEY, Reflect.get(controller, handler)),
        ).toEqual(['SECURITY_ADMIN', 'PHARMACY_STAFF']);
      }
      for (const handler of [
        'create',
        'listMine',
        'cancel',
        'acceptSubstitutions',
        'preferOriginal',
      ]) {
        expect(
          Reflect.getMetadata(ROLES_KEY, Reflect.get(controller, handler)),
        ).toEqual(['PATIENT']);
      }
    });

    it.each([
      { label: 'OWNER', role: DIR.ROLE_OWNER },
      { label: 'ADMIN', role: DIR.ROLE_ADMIN },
    ])(
      'lets an active $label read frozen reservation lines without private settlement',
      async ({ role }) => {
        const d = build();
        const provider = { id: 'user-provider', roles: ['USER'] };
        d.tenantAdministration.canAdminister.mockResolvedValue(true);
        withReading(d, order(), [
          {
            id: 'line-1',
            inventoryReservationId: 'order-1',
            pharmacyProductId: 'prod-1',
            requestedQuantity: '1',
            reservedQuantity: '1',
            unitPriceAmount: '10.00',
            currencyConceptId: 'currency-bob',
            statusConceptId: PINV.RES_LINE_CONFIRMED,
          },
        ]);

        const result = await runWithTenant('tenant-a', () =>
          d.service.getOrder('order-1', provider),
        );

        expect(d.tenantAdministration.canAdminister).toHaveBeenCalledWith(
          d.fork,
          'tenant-a',
          provider,
        );
        expect(result.reservationLines).toEqual([
          expect.objectContaining({
            id: 'line-1',
            quantity: '1',
            billedAmount: '10.00',
          }),
        ]);
        expect(result.insuranceSettlement).toBeNull();
        expect(result.insuranceSettlementAvailability).toBe('NOT_AVAILABLE');
        expect(d.settlements.forOrders).not.toHaveBeenCalled();
      },
    );

    it.each([
      { label: 'non-admin STAFF membership' },
      { label: 'inactive membership' },
    ])('returns the same 404 for $label and a missing order', async () => {
      const d = build();
      const provider = { id: 'user-provider', roles: ['USER'] };
      withReading(d, order({ expiresAt: new Date(Date.now() - 1_000) }), []);
      const denied = await runWithTenant('tenant-a', () =>
        d.service
          .getOrder('order-1', provider)
          .catch((error: unknown) => error),
      );
      d.ordersRepo.findOrderById.mockResolvedValue(null);
      const missing = await runWithTenant('tenant-a', () =>
        d.service
          .getOrder('order-1', provider)
          .catch((error: unknown) => error),
      );

      expect(denied).toBeInstanceOf(ResourceNotFoundException);
      expect((denied as any).getResponse()).toEqual(
        (missing as any).getResponse(),
      );
      expect(d.tenantAdministration.canAdminister).toHaveBeenCalledWith(
        d.fork,
        'tenant-a',
        provider,
      );
      expect(d.em.transactional).not.toHaveBeenCalled();
      expect(d.ordersRepo.findLinesByReservationIds).not.toHaveBeenCalled();
      expect(d.settlements.forOrders).not.toHaveBeenCalled();
    });

    it('hides another tenant order before expiry, membership checks or private enrichment', async () => {
      const d = build();
      const provider = { id: 'user-provider', roles: ['USER'] };
      withReading(d, order({ expiresAt: new Date(Date.now() - 1_000) }), []);
      d.ordersRepo.findPharmaciesByIdsInTenant.mockResolvedValue([]);
      const denied = await runWithTenant('tenant-b', () =>
        d.service
          .getOrder('order-1', provider)
          .catch((error: unknown) => error),
      );
      d.ordersRepo.findOrderById.mockResolvedValue(null);
      const missing = await runWithTenant('tenant-b', () =>
        d.service
          .getOrder('order-1', provider)
          .catch((error: unknown) => error),
      );

      expect(denied).toBeInstanceOf(ResourceNotFoundException);
      expect((denied as any).getResponse()).toEqual(
        (missing as any).getResponse(),
      );
      expect(d.ordersRepo.findPharmaciesByIdsInTenant).toHaveBeenCalledWith(
        d.fork,
        'tenant-b',
        ['ph-1'],
      );
      expect(d.tenantAdministration.canAdminister).not.toHaveBeenCalled();
      expect(d.em.transactional).not.toHaveBeenCalled();
      expect(d.ordersRepo.findLinesByReservationIds).not.toHaveBeenCalled();
      expect(d.settlements.forOrders).not.toHaveBeenCalled();
    });

    it.each(['SECURITY_ADMIN', 'SUPERADMIN'])(
      'keeps %s detail access without consulting patient settlements',
      async (role) => {
        const d = build();
        d.tenantAdministration.canAdminister.mockResolvedValue(true);
        withReading(d, order(), []);
        const result = await runWithTenant('tenant-a', () =>
          d.service.getOrder('order-1', { id: 'platform', roles: [role] }),
        );
        expect(result.id).toBe('order-1');
        if (role === 'SECURITY_ADMIN') {
          expect(d.tenantAdministration.canAdminister).not.toHaveBeenCalled();
        } else {
          expect(d.tenantAdministration.canAdminister).toHaveBeenCalledWith(
            d.fork,
            'tenant-a',
            { id: 'platform', roles: [role] },
          );
        }
        expect(d.settlements.forOrders).not.toHaveBeenCalled();
      },
    );

    it('keeps private enrichment exclusive to the patient owner', async () => {
      const d = build();
      withReading(d, order(), []);
      await runWithTenant('tenant-a', () =>
        d.service.getOrder('order-1', patient),
      );
      expect(d.settlements.forOrders).toHaveBeenCalledWith(d.fork, patient.id, [
        'order-1',
      ]);
      expect(d.tenantAdministration.canAdminister).not.toHaveBeenCalled();
    });

    it('exposes stable physical portions with exact frozen amounts after order authorization', async () => {
      const d = build();
      const portion = {
        inventoryReservationId: 'order-1',
        pharmacyProductId: 'prod-1',
        requestedQuantity: '0.5',
        reservedQuantity: '0.5',
        statusConceptId: PINV.RES_LINE_CONFIRMED,
        currencyConceptId: 'currency-bob',
      };
      withReading(d, order(), [
        {
          ...portion,
          id: 'line-b',
          unitPriceAmount: '20.001',
          statusConceptId: PINV.RES_LINE_FULFILLED,
        },
        {
          ...portion,
          id: 'released',
          unitPriceAmount: '20.001',
          statusConceptId: PINV.RES_LINE_RELEASED,
        },
        {
          ...portion,
          id: 'out-of-stock',
          unitPriceAmount: '20.001',
          statusConceptId: PINV.RES_LINE_OUT_OF_STOCK,
        },
        { ...portion, id: 'line-a', unitPriceAmount: '20.001' },
        {
          ...portion,
          id: 'line-c',
          unitPriceAmount: null,
          currencyConceptId: null,
        },
      ]);
      const result = await runWithTenant('tenant-a', () =>
        d.service.getOrder('order-1', staff),
      );
      expect(result.reservationLines).toEqual([
        {
          id: 'line-a',
          productId: 'prod-1',
          quantity: '0.5',
          unitPriceAmount: '20.001',
          billedAmount: '10.00',
          currencyConceptId: 'currency-bob',
        },
        {
          id: 'line-b',
          productId: 'prod-1',
          quantity: '0.5',
          unitPriceAmount: '20.001',
          billedAmount: '10.00',
          currencyConceptId: 'currency-bob',
        },
        {
          id: 'line-c',
          productId: 'prod-1',
          quantity: '0.5',
          unitPriceAmount: null,
          billedAmount: null,
          currencyConceptId: null,
        },
      ]);
      expect(result.insuranceSettlement).toBeNull();
      expect(result.insuranceSettlementAvailability).toBe('NOT_AVAILABLE');
    });

    it('another patient gets the exact same 404 as a missing order', async () => {
      const d = build();
      // Pedido de otro titular.
      d.ordersRepo.findOrderById.mockResolvedValue(
        order({ patientProfileId: 'pat-2' }),
      );
      const foreign = await runWithTenant('tenant-a', () =>
        d.service.getOrder('order-1', patient).catch((e: unknown) => e),
      );

      // Pedido inexistente.
      d.ordersRepo.findOrderById.mockResolvedValue(null);
      const nonexistent = await runWithTenant('tenant-a', () =>
        d.service.getOrder('order-1', patient).catch((e: unknown) => e),
      );

      expect(foreign).toBeInstanceOf(ResourceNotFoundException);
      expect(nonexistent).toBeInstanceOf(ResourceNotFoundException);
      // Mismos bytes: ni el mensaje ni el detalle distinguen los casos.
      expect((foreign as any).getResponse()).toEqual(
        (nonexistent as any).getResponse(),
      );
    });

    it('a pharmacy from another tenant hides the order behind the same 404', async () => {
      const d = build();
      d.ordersRepo.findOrderById.mockResolvedValue(order());
      d.ordersRepo.findPharmaciesByIdsInTenant.mockResolvedValue([]);

      await expect(
        runWithTenant('tenant-b', () => d.service.getOrder('order-1', staff)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      // El tenant fue parte de la consulta, no un filtro a posteriori.
      expect(d.ordersRepo.findPharmaciesByIdsInTenant).toHaveBeenCalledWith(
        d.fork,
        'tenant-b',
        ['ph-1'],
      );
    });

    describe('cross-tenant pharmacy (H3-02)', () => {
      /** Farmacia del tenant `tenant-a`; el filtro de tenant se aplica de verdad. */
      function withTenantScopedPharmacies(d: ReturnType<typeof build>) {
        d.ordersRepo.findPharmaciesByIdsInTenant.mockImplementation(
          async (_em: unknown, tenantId: string | undefined) =>
            tenantId === undefined || tenantId === PHARMACY.tenantId
              ? [PHARMACY]
              : [],
        );
      }

      it('the owner patient reads the order although the pharmacy belongs to another tenant', async () => {
        const d = build();
        withReading(d, order(), []);
        withTenantScopedPharmacies(d);

        const res = await runWithTenant('tenant-patient', () =>
          d.service.getOrder('order-1', patient),
        );

        expect(res.id).toBe('order-1');
        // La vista del titular no acota la farmacia por el tenant del request.
        expect(
          d.ordersRepo.findPharmaciesByIdsInTenant,
        ).toHaveBeenNthCalledWith(1, d.fork, undefined, ['ph-1']);
        expect(d.settlements.forOrders).toHaveBeenCalledWith(
          d.fork,
          patient.id,
          ['order-1'],
        );
        expect(d.tenantAdministration.canAdminister).not.toHaveBeenCalled();
      });

      it('the owner patient reads the order even without an active tenant', async () => {
        const d = build();
        withReading(d, order(), []);
        withTenantScopedPharmacies(d);

        const res = await d.service.getOrder('order-1', patient);

        expect(res.id).toBe('order-1');
      });

      it('the pharmacy staff of the owning tenant still reads it', async () => {
        const d = build();
        withReading(d, order(), []);
        withTenantScopedPharmacies(d);
        const pharmacyStaff = {
          id: 'user-ph',
          roles: ['PHARMACY_STAFF'],
        } as any;

        const res = await runWithTenant('tenant-a', () =>
          d.service.getOrder('order-1', pharmacyStaff),
        );

        expect(res.id).toBe('order-1');
        expect(
          d.ordersRepo.findPharmaciesByIdsInTenant,
        ).toHaveBeenNthCalledWith(1, d.fork, 'tenant-a', ['ph-1']);
        expect(d.settlements.forOrders).not.toHaveBeenCalled();
      });

      it('another patient gets 404 even with the pharmacy in the same tenant', async () => {
        const d = build();
        withReading(d, order({ patientProfileId: 'pat-2' }), []);
        withTenantScopedPharmacies(d);
        d.tenantAdministration.canAdminister.mockResolvedValue(false);

        await expect(
          runWithTenant('tenant-a', () =>
            d.service.getOrder('order-1', patient),
          ),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        await expect(
          runWithTenant('tenant-b', () =>
            d.service.getOrder('order-1', patient),
          ),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        // El tercero sí queda acotado al tenant del request.
        expect(d.ordersRepo.findPharmaciesByIdsInTenant).toHaveBeenCalledWith(
          d.fork,
          'tenant-b',
          ['ph-1'],
        );
        expect(d.settlements.forOrders).not.toHaveBeenCalled();
      });

      it('a third party without the owner claim gets 404 from another tenant', async () => {
        const d = build();
        withReading(d, order(), []);
        withTenantScopedPharmacies(d);
        const thirdParty = { id: 'user-x', roles: ['PHARMACY_STAFF'] } as any;

        await expect(
          runWithTenant('tenant-b', () =>
            d.service.getOrder('order-1', thirdParty),
          ),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        expect(d.settlements.forOrders).not.toHaveBeenCalled();
      });

      it('without an active tenant a non-owner gets the same 404 as a missing order', async () => {
        const d = build();
        withTenantScopedPharmacies(d);
        const thirdParty = { id: 'user-x', roles: ['PHARMACY_STAFF'] } as any;

        d.ordersRepo.findOrderById.mockResolvedValue(order());
        const existing = await d.service
          .getOrder('order-1', thirdParty)
          .catch((e: unknown) => e);
        const otherPatient = await d.service
          .getOrder('order-1', { ...patient, patientProfileId: 'pat-2' })
          .catch((e: unknown) => e);

        d.ordersRepo.findOrderById.mockResolvedValue(null);
        const missing = await d.service
          .getOrder('order-1', thirdParty)
          .catch((e: unknown) => e);

        expect(existing).toBeInstanceOf(ResourceNotFoundException);
        expect(otherPatient).toBeInstanceOf(ResourceNotFoundException);
        // Ni 422 de tenant ni otro detalle: la existencia no se filtra.
        expect((existing as any).getResponse()).toEqual(
          (missing as any).getResponse(),
        );
        expect((otherPatient as any).getResponse()).toEqual(
          (missing as any).getResponse(),
        );
        expect(d.ordersRepo.findPharmaciesByIdsInTenant).not.toHaveBeenCalled();
        expect(d.tenantAdministration.canAdminister).not.toHaveBeenCalled();
      });
    });

    it('lazily expires an overdue order before serving it', async () => {
      const d = build();
      const overdue = order({ expiresAt: new Date(Date.now() - 1_000) });
      d.ordersRepo.findOrderById
        .mockResolvedValueOnce(overdue)
        .mockResolvedValue(
          order({
            reservationStatusConceptId: PINV.ORDER_VENCIDO,
            expiresAt: overdue.expiresAt,
          }),
        );
      d.ordersRepo.findDueOrdersForUpdate.mockResolvedValue([overdue]);

      const res = await runWithTenant('tenant-a', () =>
        d.service.getOrder('order-1', patient),
      );

      expect(d.ordersRepo.findDueOrdersForUpdate).toHaveBeenCalledWith(
        d.tx,
        expect.any(Array),
        expect.any(Date),
        ['order-1'],
      );
      expect(d.reservationsService.releaseConfirmedLines).toHaveBeenCalled();
      expect(res.status.code).toBe('PINV_ORDER_VENCIDO');
    });
  });

  describe('listMine', () => {
    it('resolves names in batch: one query per table, no N+1', async () => {
      const d = build();
      d.ordersRepo.findOrdersByPatient.mockResolvedValue([
        order(),
        order({ id: 'order-2' }),
      ]);
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([
        {
          inventoryReservationId: 'order-1',
          pharmacyProductId: 'prod-1',
          requestedQuantity: '3',
          reservedQuantity: '3',
          statusConceptId: PINV.RES_LINE_CONFIRMED,
        },
        {
          inventoryReservationId: 'order-2',
          pharmacyProductId: 'prod-1',
          requestedQuantity: '2',
          reservedQuantity: '0',
          statusConceptId: PINV.RES_LINE_OUT_OF_STOCK,
        },
      ]);

      const res = await runWithTenant('tenant-a', () =>
        d.service.listMine(patient),
      );

      expect(res.count).toBe(2);
      expect(d.ordersRepo.findLinesByReservationIds).toHaveBeenCalledTimes(1);
      expect(d.ordersRepo.findSitesByIds).toHaveBeenCalledTimes(1);
      expect(d.ordersRepo.findPharmaciesByIdsInTenant).toHaveBeenCalledTimes(1);
      expect(d.ordersRepo.findProductsByIds).toHaveBeenCalledTimes(1);
      expect(d.ordersRepo.findConceptsByIds).toHaveBeenCalledTimes(1);
      // El UUID técnico se publica para buscar sustitutos; la UI sigue pintando palabras.
      expect(res.items[0].lines[0].medicationConceptId).toBe('concept-amoxi');
      expect(res.items[0].lines[0].genericName).toBe('Amoxicilina');
      expect(res.items[0].pharmacyName).toBe('Farmacia Andina');
    });

    it('preserves a null medication concept on an order line', async () => {
      const d = build();
      d.ordersRepo.findOrdersByPatient.mockResolvedValue([order()]);
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([
        {
          inventoryReservationId: 'order-1',
          pharmacyProductId: 'prod-1',
          requestedQuantity: '1',
          reservedQuantity: '1',
          statusConceptId: PINV.RES_LINE_CONFIRMED,
        },
      ]);
      d.ordersRepo.findProductsByIds.mockResolvedValue([
        { ...PRODUCT, medicationConceptId: null },
      ]);

      const res = await runWithTenant('tenant-a', () =>
        d.service.listMine(patient),
      );

      expect(res.items[0].lines[0].medicationConceptId).toBeNull();
      expect(res.items[0].lines[0].genericName).toBe('Amoxicilina');
    });

    it('an order from a pharmacy outside the tenant simply does not appear', async () => {
      const d = build();
      d.ordersRepo.findOrdersByPatient.mockResolvedValue([
        order({ pharmacyId: 'ph-ajena' }),
      ]);
      d.ordersRepo.findPharmaciesByIdsInTenant.mockResolvedValue([]);

      const res = await runWithTenant('tenant-a', () =>
        d.service.listMine(patient),
      );
      expect(res.items).toEqual([]);
      expect(res.count).toBe(0);
    });

    it('runs lazy expiry over the overdue ones before answering', async () => {
      const d = build();
      const overdue = order({ expiresAt: new Date(Date.now() - 1_000) });
      d.ordersRepo.findOrdersByPatient.mockResolvedValue([overdue]);
      d.ordersRepo.findDueOrdersForUpdate.mockResolvedValue([overdue]);

      await runWithTenant('tenant-a', () => d.service.listMine(patient));

      expect(d.ordersRepo.findDueOrdersForUpdate).toHaveBeenCalledWith(
        d.tx,
        expect.any(Array),
        expect.any(Date),
        ['order-1'],
      );
      // Tras vencer, la lista se relee para servir el estado ya asentado.
      expect(d.ordersRepo.findOrdersByPatient).toHaveBeenCalledTimes(2);
    });

    it('does not require a tenant: the patient orders travel across organizations', async () => {
      const d = build();
      await expect(d.service.listMine(patient)).resolves.toEqual(
        expect.objectContaining({ count: 0 }),
      );
    });
  });

  describe('cancel', () => {
    it('cancels a live order releasing stock through the shared primitive', async () => {
      const d = build();
      const live = order();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(live);
      withReading(
        d,
        order({ reservationStatusConceptId: PINV.ORDER_CANCELADO }),
        [],
      );

      const res = await runWithTenant('tenant-a', () =>
        d.service.cancel('order-1', patient),
      );

      expect(live.reservationStatusConceptId).toBe(PINV.ORDER_CANCELADO);
      expect(live.releasedAt).toBeInstanceOf(Date);
      expect(d.reservationsService.releaseConfirmedLines).toHaveBeenCalledWith(
        d.tx,
        live,
        patient,
      );
      expect(d.outbox.publish).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'PharmacyOrderCancelled' }),
      );
      expect(res.status.code).toBe('PINV_ORDER_CANCELADO');
    });

    it('double cancel: a terminal order answers 409 without touching the ledger', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(
        order({ reservationStatusConceptId: PINV.ORDER_CANCELADO }),
      );

      await expect(
        runWithTenant('tenant-a', () => d.service.cancel('order-1', patient)),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(
        d.reservationsService.releaseConfirmedLines,
      ).not.toHaveBeenCalled();
      expect(d.outbox.publish).not.toHaveBeenCalled();
    });

    it('a non-owner cancelling gets the indistinguishable 404', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(
        order({ patientProfileId: 'pat-2' }),
      );

      await expect(
        runWithTenant('tenant-a', () => d.service.cancel('order-1', patient)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(
        d.reservationsService.releaseConfirmedLines,
      ).not.toHaveBeenCalled();
    });
  });

  describe('chat del pedido', () => {
    const pharmacyStaff = {
      id: 'user-staff',
      roles: ['USER', 'PHARMACY_STAFF'],
    } as any;
    const linkedPharmacy = { ...PHARMACY, publicProfileId: 'vitrina-1' };

    it('el titular ve la vitrina de la farmacia en su lista (null si no hay)', async () => {
      const d = build();
      const other = { ...PHARMACY, id: 'ph-2', tenantId: 'tenant-b' };
      d.ordersRepo.findPharmaciesByIdsInTenant.mockResolvedValue([
        linkedPharmacy,
        other,
      ]);
      d.ordersRepo.findOrdersByPatient.mockResolvedValue([
        order(),
        order({ id: 'order-2', pharmacyId: 'ph-2' }),
      ]);
      d.orderChat.findPharmacyShowcases.mockResolvedValue(
        new Map([['ph-1', { profileId: 'vitrina-1', slug: 'organization-a' }]]),
      );

      const res = await runWithTenant('tenant-a', () =>
        d.service.listMine(patient),
      );

      // En lote: una sola consulta para todas las farmacias de la página.
      expect(d.orderChat.findPharmacyShowcases).toHaveBeenCalledTimes(1);
      expect(d.orderChat.findPharmacyShowcases).toHaveBeenCalledWith(d.fork, [
        {
          pharmacyId: 'ph-1',
          tenantId: 'tenant-a',
          publicProfileId: 'vitrina-1',
        },
        { pharmacyId: 'ph-2', tenantId: 'tenant-b', publicProfileId: null },
      ]);
      const byId = new Map(res.items.map((item) => [item.id, item]));
      expect(byId.get('order-1')).toEqual(
        expect.objectContaining({
          pharmacyPublicProfileId: 'vitrina-1',
          pharmacyPublicSlug: 'organization-a',
        }),
      );
      expect(byId.get('order-2')).toEqual(
        expect.objectContaining({
          pharmacyPublicProfileId: null,
          pharmacyPublicSlug: null,
        }),
      );
    });

    it('el titular la ve en el detalle; el mostrador no la recibe', async () => {
      const d = build();
      withReading(d, order(), []);
      d.orderChat.findPharmacyShowcases.mockResolvedValue(
        new Map([['ph-1', { profileId: 'vitrina-1', slug: 'organization-a' }]]),
      );

      const own = await runWithTenant('tenant-a', () =>
        d.service.getOrder('order-1', patient),
      );
      expect(own.pharmacyPublicProfileId).toBe('vitrina-1');
      expect(own.pharmacyPublicSlug).toBe('organization-a');

      d.orderChat.findPharmacyShowcases.mockClear();
      const counter = await runWithTenant('tenant-a', () =>
        d.service.getOrder('order-1', pharmacyStaff),
      );
      expect(counter).not.toHaveProperty('pharmacyPublicProfileId');
      expect(counter).not.toHaveProperty('pharmacyPublicSlug');
      expect(d.orderChat.findPharmacyShowcases).not.toHaveBeenCalled();
    });

    it('la ruta exige sesión, no es pública y autoriza por recurso en el servicio', () => {
      const handler = Reflect.get(
        PharmacyOrdersController.prototype,
        'openConversation',
      );
      expect(Reflect.getMetadata(ROLES_KEY, handler)).toBeUndefined();
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).not.toBe(true);
    });

    it('el titular abre el hilo con la vitrina de la farmacia de su pedido', async () => {
      const d = build();
      d.ordersRepo.findOrderById.mockResolvedValue(order());
      d.ordersRepo.findPharmaciesByIdsInTenant.mockResolvedValue([
        linkedPharmacy,
      ]);

      const res = await runWithTenant('tenant-z', () =>
        d.service.openConversation('order-1', patient),
      );

      expect(res).toEqual({
        conversationId: 'conv-1',
        pharmacyProfileId: 'vitrina-1',
      });
      // El titular ve su pedido desde cualquier organización.
      expect(d.ordersRepo.findPharmaciesByIdsInTenant).toHaveBeenCalledWith(
        d.fork,
        undefined,
        ['ph-1'],
      );
      expect(d.orderChat.openOrderConversation).toHaveBeenCalledWith(
        {
          pharmacy: { tenantId: 'tenant-a', publicProfileId: 'vitrina-1' },
          patientUserId: 'user-1',
          openedBy: 'PATIENT',
        },
        patient,
      );
      // La cuenta del titular es la de la sesión: no hace falta resolverla.
      expect(d.accountLinks.findActiveByPerson).not.toHaveBeenCalled();
    });

    it('el personal de la farmacia del pedido abre el mismo hilo como la farmacia', async () => {
      const d = build();
      d.ordersRepo.findOrderById.mockResolvedValue(order());
      d.accountLinks.findActiveByPerson.mockResolvedValue({
        userId: 'user-1',
      });

      const res = await runWithTenant('tenant-a', () =>
        d.service.openConversation('order-1', pharmacyStaff),
      );

      expect(res.conversationId).toBe('conv-1');
      // La farmacia tiene que ser del tenant activo del request.
      expect(d.ordersRepo.findPharmaciesByIdsInTenant).toHaveBeenCalledWith(
        d.fork,
        'tenant-a',
        ['ph-1'],
      );
      expect(d.accountLinks.findActiveByPerson).toHaveBeenCalledWith(
        d.fork,
        'pat-1',
      );
      expect(d.orderChat.openOrderConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          patientUserId: 'user-1',
          openedBy: 'PHARMACY_STAFF',
        }),
        pharmacyStaff,
      );
    });

    it.each([
      [
        'personal de otra farmacia',
        { id: 'user-otro', roles: ['PHARMACY_STAFF'] },
        [],
      ],
      [
        'otro paciente',
        { id: 'user-2', roles: ['PATIENT'], patientProfileId: 'pat-2' },
        [PHARMACY],
      ],
      [
        'la plataforma sin rol de farmacia',
        { id: 'admin', roles: ['SECURITY_ADMIN'] },
        [PHARMACY],
      ],
      [
        'personal con el rol concedido en otra organización',
        {
          id: 'user-otro',
          roles: ['PHARMACY_STAFF'],
          scopedRoles: { 'tenant-a': ['PHARMACY_STAFF'] },
        },
        [PHARMACY],
      ],
    ])('%s recibe el mismo 404', async (_case, actor, pharmacies) => {
      const d = build();
      d.ordersRepo.findOrderById.mockResolvedValue(order());
      d.ordersRepo.findPharmaciesByIdsInTenant.mockResolvedValue(pharmacies);

      await expect(
        runWithTenant('tenant-b', () =>
          d.service.openConversation('order-1', actor as any),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.orderChat.openOrderConversation).not.toHaveBeenCalled();
    });

    it('un tercero sin tenant recibe 404 y no un 412 que confirme el pedido', async () => {
      const d = build();
      d.ordersRepo.findOrderById.mockResolvedValue(order());

      await expect(
        d.service.openConversation('order-1', {
          id: 'user-2',
          roles: ['PATIENT'],
          patientProfileId: 'pat-2',
        } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.ordersRepo.findPharmaciesByIdsInTenant).not.toHaveBeenCalled();
    });

    it('un pedido inexistente responde 404', async () => {
      const d = build();

      await expect(
        runWithTenant('tenant-a', () =>
          d.service.openConversation('order-x', patient),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('sin cuenta del paciente, 422 tipificado y no se abre nada', async () => {
      const d = build();
      d.ordersRepo.findOrderById.mockResolvedValue(order());
      d.accountLinks.findActiveByPerson.mockResolvedValue(null);

      const error = await runWithTenant('tenant-a', () =>
        d.service
          .openConversation('order-1', pharmacyStaff)
          .catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as PreconditionFailedException).getResponse()).toEqual(
        expect.objectContaining({ reason: 'PATIENT_CHAT_PROFILE_MISSING' }),
      );
      expect(d.orderChat.openOrderConversation).not.toHaveBeenCalled();
    });
  });

  describe('expireDue', () => {
    it('expires overdue orders releasing stock, race-safe by construction', async () => {
      const d = build();
      const expirable = order({ expiresAt: new Date(Date.now() - 1_000) });
      d.ordersRepo.findDueOrdersForUpdate.mockResolvedValue([expirable]);

      const res = await d.service.expireDue(system);

      expect(res.expiredCount).toBe(1);
      expect(expirable.reservationStatusConceptId).toBe(PINV.ORDER_VENCIDO);
      expect(expirable.releasedAt).toBeInstanceOf(Date);
      expect(d.reservationsService.releaseConfirmedLines).toHaveBeenCalledWith(
        d.tx,
        expirable,
        system,
      );
      expect(d.outbox.publish).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'PharmacyOrderExpired',
          tenantId: 'tenant-a',
        }),
      );
    });

    it('with nothing overdue it does nothing and reports zero', async () => {
      const d = build();
      const res = await d.service.expireDue(system);
      expect(res.expiredCount).toBe(0);
      expect(d.outbox.publish).not.toHaveBeenCalled();
    });
  });
});
