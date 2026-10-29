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
import { PINV } from '../domain/pharmacy_inventory.concepts';

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
  const logger = { setContext: mockFn(), info: mockFn() };
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
  );
  const service = new PharmacyOrdersService(useCases, logger as any);
  return {
    service,
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
      const products = [PRODUCT, { ...PRODUCT, id: 'prod-2' }];
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
      d.ordersRepo.findOwnMedicationRequest.mockResolvedValue(null);

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
