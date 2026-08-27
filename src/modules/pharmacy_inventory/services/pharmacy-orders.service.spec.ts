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
} from './pharmacy-orders.service';
import { PINV } from '../pharmacy_inventory.concepts';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const paciente = {
  id: 'user-1',
  roles: ['PATIENT'],
  patientProfileId: 'pat-1',
} as any;
const staff = { id: 'user-9', roles: ['SECURITY_ADMIN'] } as any;
const sistema = { id: 'user-sys', roles: ['SYSTEM'] } as any;

const FARMACIA = {
  id: 'ph-1',
  tenantId: 'tenant-a',
  legalName: 'Farmacia Andina S.R.L.',
  tradeName: 'Farmacia Andina',
} as any;
const SEDE = { id: 'site-1', pharmacyId: 'ph-1', name: 'Sede Centro' } as any;
const PRODUCTO = {
  id: 'prod-1',
  pharmacyId: 'ph-1',
  productCode: 'COD-1',
  genericName: 'Amoxicilina',
  medicationConceptId: 'concept-amoxi',
} as any;

/** Una posición de stock disponible en la sede. */
function posicion(extra: Record<string, unknown> = {}) {
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
function pedido(extra: Record<string, unknown> = {}) {
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
    findPharmaciesByIdsInTenant: mockFn(async () => [FARMACIA]),
    findPharmaciesByIds: mockFn(async () => [FARMACIA]),
    findSitesByIds: mockFn(async () => [SEDE]),
    findProductsByIds: mockFn(async () => [PRODUCTO]),
    findConceptsByIds: mockFn(async () => []),
    findOwnMedicationRequest: mockFn(async () => null),
    findPersonNamesByProfileIds: mockFn(async () => new Map()),
    findPharmaciesByTenant: mockFn(async () => [FARMACIA]),
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
  const pharmacyRepo = {
    findActiveSiteById: mockFn(async () => SEDE),
    findVisibleById: mockFn(async () => FARMACIA),
    findActiveProductsByIds: mockFn(async () => [PRODUCTO]),
  };
  const reservationsService = { releaseConfirmedLines: mockFn(async () => 1) };
  const outbox = { publishDomainEvent: mockFn(async () => ({})) };
  const orderNotifications = {
    orderUnderReview: mockFn(async () => ({ suppressed: false })),
    orderConfirmed: mockFn(async () => ({ suppressed: false })),
    orderReady: mockFn(async () => ({ suppressed: false })),
    orderRejected: mockFn(async () => ({ suppressed: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new PharmacyOrdersService(
    em as any,
    ordersRepo as any,
    reservationsRepo as any,
    stockRepo as any,
    ledgerRepo as any,
    inventoryReadRepo as any,
    dispensationsRepo as any,
    pharmacyRepo as any,
    reservationsService as any,
    outbox as any,
    orderNotifications as any,
    logger as any,
  );
  return {
    service,
    tx,
    fork,
    em,
    ordersRepo,
    reservationsRepo,
    stockRepo,
    ledgerRepo,
    inventoryReadRepo,
    dispensationsRepo,
    pharmacyRepo,
    reservationsService,
    outbox,
    orderNotifications,
  };
}

/** Mocks de lectura para que `readOwnOrder`/`getOrder` compongan el pedido dado. */
function conLectura(d: ReturnType<typeof build>, order: any, lines: any[]) {
  d.ordersRepo.findOrderById.mockResolvedValue(order);
  d.ordersRepo.findLinesByReservationIds.mockResolvedValue(lines);
}

describe('PharmacyOrdersService', () => {
  describe('create', () => {
    it('creates the order ENVIADO reserving stock with UC-25-04 accounting', async () => {
      const d = build();
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([posicion()]);
      const bloqueada = posicion();
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(bloqueada);
      conLectura(d, pedido(), [
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
          paciente,
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
      expect(bloqueada.reservedQuantity).toBe('3');
      expect(bloqueada.availableQuantity).toBe('7');
      // El hecho se publica en la misma transacción.
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'PharmacyOrderSubmitted' }),
      );
      // Y la respuesta va en palabras.
      expect(res.status.code).toBe('PINV_ORDER_ENVIADO');
      expect(res.lines[0].reservedQuantity).toBe(3);
    });

    it('a line without stock stays SIN_STOCK and does NOT sink the order', async () => {
      const d = build();
      const productos = [PRODUCTO, { ...PRODUCTO, id: 'prod-2' }];
      d.pharmacyRepo.findActiveProductsByIds.mockResolvedValue(productos);
      // Solo prod-1 tiene posición; prod-2 no existe en el estante.
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([posicion()]);
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(posicion());
      conLectura(d, pedido(), []);

      await runWithTenant('tenant-a', () =>
        d.service.create(
          {
            siteId: 'site-1',
            lines: [
              { productId: 'prod-1', quantity: 3 },
              { productId: 'prod-2', quantity: 2 },
            ],
          },
          paciente,
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
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          payloadJson: expect.objectContaining({ outOfStockLineCount: 1 }),
        }),
      );
    });

    it('sets the 48 hour expiry window', async () => {
      const d = build();
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([posicion()]);
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(posicion());
      conLectura(d, pedido(), []);

      const antes = Date.now();
      await runWithTenant('tenant-a', () =>
        d.service.create(
          { siteId: 'site-1', lines: [{ productId: 'prod-1', quantity: 1 }] },
          paciente,
        ),
      );

      const data = d.reservationsRepo.create.mock.calls[0][1];
      const ttlMs = data.expiresAt.getTime() - antes;
      expect(ttlMs).toBeGreaterThanOrEqual(ORDER_TTL_HOURS * 3_600_000 - 5_000);
      expect(ttlMs).toBeLessThanOrEqual(ORDER_TTL_HOURS * 3_600_000 + 5_000);
    });

    it('idempotency: repeating the key returns the existing order without reserving again', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdempotencyKey.mockResolvedValue(
        pedido({ id: 'order-9' }),
      );
      conLectura(d, pedido({ id: 'order-9' }), []);

      const res = await runWithTenant('tenant-a', () =>
        d.service.create(
          {
            siteId: 'site-1',
            idempotencyKey: 'k-1',
            lines: [{ productId: 'prod-1', quantity: 3 }],
          },
          paciente,
        ),
      );

      expect(res.id).toBe('order-9');
      expect(d.reservationsRepo.create).not.toHaveBeenCalled();
      expect(d.ledgerRepo.append).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
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
            paciente,
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

  describe('create · modalidad de entrega (v4.2.1)', () => {
    it('persists the RETIRO concept when the order declares pickup', async () => {
      const d = build();
      conLectura(d, pedido(), []);

      await runWithTenant('tenant-a', () =>
        d.service.create(
          {
            siteId: 'site-1',
            deliveryMode: 'RETIRO',
            lines: [{ productId: 'prod-1', quantity: 3 }],
          },
          paciente,
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
            paciente,
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
    it('another patient gets the exact same 404 as a missing order', async () => {
      const d = build();
      // Pedido de otro titular.
      d.ordersRepo.findOrderById.mockResolvedValue(
        pedido({ patientProfileId: 'pat-2' }),
      );
      const ajeno = await runWithTenant('tenant-a', () =>
        d.service.getOrder('order-1', paciente).catch((e: unknown) => e),
      );

      // Pedido inexistente.
      d.ordersRepo.findOrderById.mockResolvedValue(null);
      const inexistente = await runWithTenant('tenant-a', () =>
        d.service.getOrder('order-1', paciente).catch((e: unknown) => e),
      );

      expect(ajeno).toBeInstanceOf(ResourceNotFoundException);
      expect(inexistente).toBeInstanceOf(ResourceNotFoundException);
      // Mismos bytes: ni el mensaje ni el detalle distinguen los casos.
      expect((ajeno as any).getResponse()).toEqual(
        (inexistente as any).getResponse(),
      );
    });

    it('a pharmacy from another tenant hides the order behind the same 404', async () => {
      const d = build();
      d.ordersRepo.findOrderById.mockResolvedValue(pedido());
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
      const vencido = pedido({ expiresAt: new Date(Date.now() - 1_000) });
      d.ordersRepo.findOrderById
        .mockResolvedValueOnce(vencido)
        .mockResolvedValue(
          pedido({
            reservationStatusConceptId: PINV.ORDER_VENCIDO,
            expiresAt: vencido.expiresAt,
          }),
        );
      d.ordersRepo.findDueOrdersForUpdate.mockResolvedValue([vencido]);

      const res = await runWithTenant('tenant-a', () =>
        d.service.getOrder('order-1', paciente),
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
        pedido(),
        pedido({ id: 'order-2' }),
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
        d.service.listMine(paciente),
      );

      expect(res.count).toBe(2);
      expect(d.ordersRepo.findLinesByReservationIds).toHaveBeenCalledTimes(1);
      expect(d.ordersRepo.findSitesByIds).toHaveBeenCalledTimes(1);
      expect(d.ordersRepo.findPharmaciesByIdsInTenant).toHaveBeenCalledTimes(1);
      expect(d.ordersRepo.findProductsByIds).toHaveBeenCalledTimes(1);
      expect(d.ordersRepo.findConceptsByIds).toHaveBeenCalledTimes(1);
      // Cero UUIDs pintables: la línea sale con nombre y estado en palabras.
      expect(res.items[0].lines[0].genericName).toBe('Amoxicilina');
      expect(res.items[0].pharmacyName).toBe('Farmacia Andina');
    });

    it('an order from a pharmacy outside the tenant simply does not appear', async () => {
      const d = build();
      d.ordersRepo.findOrdersByPatient.mockResolvedValue([
        pedido({ pharmacyId: 'ph-ajena' }),
      ]);
      d.ordersRepo.findPharmaciesByIdsInTenant.mockResolvedValue([]);

      const res = await runWithTenant('tenant-a', () =>
        d.service.listMine(paciente),
      );
      expect(res.items).toEqual([]);
      expect(res.count).toBe(0);
    });

    it('runs lazy expiry over the overdue ones before answering', async () => {
      const d = build();
      const vencido = pedido({ expiresAt: new Date(Date.now() - 1_000) });
      d.ordersRepo.findOrdersByPatient.mockResolvedValue([vencido]);
      d.ordersRepo.findDueOrdersForUpdate.mockResolvedValue([vencido]);

      await runWithTenant('tenant-a', () => d.service.listMine(paciente));

      expect(d.ordersRepo.findDueOrdersForUpdate).toHaveBeenCalledWith(
        d.tx,
        expect.any(Array),
        expect.any(Date),
        ['order-1'],
      );
      // Tras vencer, la lista se relee para servir el estado ya asentado.
      expect(d.ordersRepo.findOrdersByPatient).toHaveBeenCalledTimes(2);
    });

    it('requires the tenant in the request', async () => {
      const d = build();
      await expect(d.service.listMine(paciente)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });
  });

  describe('cancel', () => {
    it('cancels a live order releasing stock through the shared primitive', async () => {
      const d = build();
      const vivo = pedido();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(vivo);
      conLectura(
        d,
        pedido({ reservationStatusConceptId: PINV.ORDER_CANCELADO }),
        [],
      );

      const res = await runWithTenant('tenant-a', () =>
        d.service.cancel('order-1', paciente),
      );

      expect(vivo.reservationStatusConceptId).toBe(PINV.ORDER_CANCELADO);
      expect(vivo.releasedAt).toBeInstanceOf(Date);
      expect(d.reservationsService.releaseConfirmedLines).toHaveBeenCalledWith(
        d.tx,
        vivo,
        paciente,
      );
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'PharmacyOrderCancelled' }),
      );
      expect(res.status.code).toBe('PINV_ORDER_CANCELADO');
    });

    it('double cancel: a terminal order answers 409 without touching the ledger', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(
        pedido({ reservationStatusConceptId: PINV.ORDER_CANCELADO }),
      );

      await expect(
        runWithTenant('tenant-a', () => d.service.cancel('order-1', paciente)),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(
        d.reservationsService.releaseConfirmedLines,
      ).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('a non-owner cancelling gets the indistinguishable 404', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(
        pedido({ patientProfileId: 'pat-2' }),
      );

      await expect(
        runWithTenant('tenant-a', () => d.service.cancel('order-1', paciente)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(
        d.reservationsService.releaseConfirmedLines,
      ).not.toHaveBeenCalled();
    });
  });

  describe('expireDue', () => {
    it('expires overdue orders releasing stock, race-safe by construction', async () => {
      const d = build();
      const vencible = pedido({ expiresAt: new Date(Date.now() - 1_000) });
      d.ordersRepo.findDueOrdersForUpdate.mockResolvedValue([vencible]);

      const res = await d.service.expireDue(sistema);

      expect(res.expiredCount).toBe(1);
      expect(vencible.reservationStatusConceptId).toBe(PINV.ORDER_VENCIDO);
      expect(vencible.releasedAt).toBeInstanceOf(Date);
      expect(d.reservationsService.releaseConfirmedLines).toHaveBeenCalledWith(
        d.tx,
        vencible,
        sistema,
      );
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'PharmacyOrderExpired',
          tenantId: 'tenant-a',
        }),
      );
    });

    it('with nothing overdue it does nothing and reports zero', async () => {
      const d = build();
      const res = await d.service.expireDue(sistema);
      expect(res.expiredCount).toBe(0);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });
  });
});
