import { jest } from '@jest/globals';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import {
  PharmacyOrdersService,
  PICKUP_CODE_UNIQUE_INDEX,
} from './pharmacy-orders.service';
import { pharmacyInventoryIndexes } from '../../../orm/catalog/indexes/pharmacy_inventory.idx';
import { PINV } from '../pharmacy_inventory.concepts';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const staff = { id: 'user-mostrador', roles: ['SECURITY_ADMIN'] } as any;
const paciente = {
  id: 'user-paciente',
  roles: ['PATIENT'],
  patientProfileId: 'pat-1',
} as any;

const FARMACIA = {
  id: 'ph-1',
  tenantId: 'tenant-a',
  legalName: 'Farmacia Andina S.R.L.',
  tradeName: 'Farmacia Andina',
} as any;
const SEDE = {
  id: 'site-1',
  pharmacyId: 'ph-1',
  name: 'Sede Centro',
  pickupAvailable: true,
} as any;
const PRODUCTO = {
  id: 'prod-1',
  pharmacyId: 'ph-1',
  productCode: 'COD-1',
  genericName: 'Amoxicilina',
  medicationConceptId: 'concept-amoxi',
} as any;
/** El genérico del MISMO concepto que PRODUCTO: la sustitución legal. */
const GENERICO = {
  id: 'prod-gen',
  pharmacyId: 'ph-1',
  productCode: 'COD-GEN',
  genericName: 'Amoxicilina generica',
  medicationConceptId: 'concept-amoxi',
} as any;
/** Otro medicamento: proponerlo como sustituto es ilegal. */
const OTRO_CONCEPTO = {
  id: 'prod-otro',
  pharmacyId: 'ph-1',
  productCode: 'COD-OTRO',
  genericName: 'Ibuprofeno',
  medicationConceptId: 'concept-ibu',
} as any;

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

/** Una línea persistida del pedido. */
function linea(extra: Record<string, unknown> = {}) {
  return {
    id: 'line-1',
    inventoryReservationId: 'order-1',
    pharmacyProductId: 'prod-1',
    requestedQuantity: '3',
    reservedQuantity: '3',
    statusConceptId: PINV.RES_LINE_CONFIRMED,
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
    findOrderById: mockFn(async () => pedido()),
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
    findPrescriberProfileId: mockFn(async () => null),
    findPersonNamesByProfileIds: mockFn(async () => new Map()),
    findPharmaciesByTenant: mockFn(async () => [FARMACIA]),
    findOrdersForPharmacies: mockFn(async () => []),
  };
  const reservationsRepo = {
    create: mockFn(() => ({ id: 'order-1' })),
    createLine: mockFn(() => ({ id: 'line-x' })),
  };
  const stockRepo = { findByKeyForUpdate: mockFn(async () => null) };
  const ledgerRepo = {
    nextSequence: mockFn(async () => '1'),
    append: mockFn(() => ({ id: 'led-1' })),
  };
  const inventoryReadRepo = {
    findActiveLocationsBySites: mockFn(async () => []),
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
    findActiveSiteById: mockFn(async () => SEDE),
    findVisibleById: mockFn(async () => FARMACIA),
    findActiveProductsByIds: mockFn(async () => [PRODUCTO]),
    findCurrentPublicPriceLists: mockFn(async () => []),
    findCurrentPrices: mockFn(async () => []),
  };
  const reservationsService = { releaseConfirmedLines: mockFn(async () => 1) };
  const outbox = { publishDomainEvent: mockFn(async () => ({})) };
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
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new PharmacyOrdersService(
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
    dispensationsRepo,
    substitutionsRepo,
    pharmacyRepo,
    inventoryReadRepo,
    reservationsService,
    outbox,
    orderNotifications,
  };
}

describe('PharmacyOrdersService · mostrador (FAR-E2)', () => {
  describe('listForPharmacyTenant', () => {
    it('restricts the inbox to the tenant pharmacies, tenant in the WHERE', async () => {
      const d = build();
      d.ordersRepo.findOrdersForPharmacies.mockResolvedValue([pedido()]);

      const res = await runWithTenant('tenant-a', () =>
        d.service.listForPharmacyTenant({}, staff),
      );

      expect(d.ordersRepo.findPharmaciesByTenant).toHaveBeenCalledWith(
        d.fork,
        'tenant-a',
      );
      expect(d.ordersRepo.findOrdersForPharmacies).toHaveBeenCalledWith(
        d.fork,
        ['ph-1'],
        expect.any(Array),
        expect.objectContaining({ limit: 100 }),
      );
      expect(res.count).toBe(1);
    });

    it('a tenant without pharmacies gets an empty inbox, no order query at all', async () => {
      const d = build();
      d.ordersRepo.findPharmaciesByTenant.mockResolvedValue([]);

      const res = await runWithTenant('tenant-b', () =>
        d.service.listForPharmacyTenant({}, staff),
      );

      expect(res).toEqual({ items: [], count: 0 });
      expect(d.ordersRepo.findOrdersForPharmacies).not.toHaveBeenCalled();
    });

    it('passes the model-backed filters (status, site, window) into the query', async () => {
      const d = build();
      const from = new Date('2026-08-20T00:00:00Z');
      const to = new Date('2026-08-27T00:00:00Z');

      await runWithTenant('tenant-a', () =>
        d.service.listForPharmacyTenant(
          {
            statusCode: 'PINV_ORDER_ENVIADO',
            siteId: 'site-1',
            from,
            to,
            limit: 25,
          },
          staff,
        ),
      );

      expect(d.ordersRepo.findOrdersForPharmacies).toHaveBeenCalledWith(
        d.fork,
        ['ph-1'],
        [PINV.ORDER_ENVIADO],
        { siteId: 'site-1', from, to, limit: 25 },
      );
    });

    it('an unknown status code answers 422 listing the allowed codes', async () => {
      const d = build();
      await expect(
        runWithTenant('tenant-a', () =>
          d.service.listForPharmacyTenant({ statusCode: 'ENVIADO' }, staff),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('resolves patient names in batch — one query, zero paintable uuids', async () => {
      const d = build();
      d.ordersRepo.findOrdersForPharmacies.mockResolvedValue([
        pedido(),
        pedido({ id: 'order-2', patientProfileId: 'pat-2' }),
      ]);
      d.ordersRepo.findPersonNamesByProfileIds.mockResolvedValue(
        new Map([
          ['pat-1', 'Ana Rojas'],
          ['pat-2', 'Bruno Paz'],
        ]),
      );

      const res = await runWithTenant('tenant-a', () =>
        d.service.listForPharmacyTenant({}, staff),
      );

      expect(d.ordersRepo.findPersonNamesByProfileIds).toHaveBeenCalledTimes(1);
      expect(d.ordersRepo.findPersonNamesByProfileIds).toHaveBeenCalledWith(
        d.fork,
        ['pat-1', 'pat-2'],
      );
      expect(res.items.map((item) => item.patientName)).toEqual([
        'Ana Rojas',
        'Bruno Paz',
      ]);
    });

    it('composes the whole inbox without N+1: one query per table', async () => {
      const d = build();
      d.ordersRepo.findOrdersForPharmacies.mockResolvedValue([
        pedido(),
        pedido({ id: 'order-2' }),
      ]);

      await runWithTenant('tenant-a', () =>
        d.service.listForPharmacyTenant({}, staff),
      );

      expect(d.ordersRepo.findLinesByReservationIds).toHaveBeenCalledTimes(1);
      expect(d.ordersRepo.findSitesByIds).toHaveBeenCalledTimes(1);
      expect(d.ordersRepo.findPharmaciesByIdsInTenant).toHaveBeenCalledTimes(1);
      expect(d.ordersRepo.findProductsByIds).toHaveBeenCalledTimes(1);
      expect(d.ordersRepo.findConceptsByIds).toHaveBeenCalledTimes(1);
      expect(d.ordersRepo.findPersonNamesByProfileIds).toHaveBeenCalledTimes(1);
    });

    it('lazily expires overdue orders before serving the inbox', async () => {
      const d = build();
      const vencido = pedido({ expiresAt: new Date(Date.now() - 1_000) });
      d.ordersRepo.findOrdersForPharmacies.mockResolvedValue([vencido]);
      d.ordersRepo.findDueOrdersForUpdate.mockResolvedValue([vencido]);

      await runWithTenant('tenant-a', () =>
        d.service.listForPharmacyTenant({}, staff),
      );

      expect(d.ordersRepo.findDueOrdersForUpdate).toHaveBeenCalledWith(
        d.tx,
        expect.any(Array),
        expect.any(Date),
        ['order-1'],
      );
      // Tras vencer, la bandeja se relee para servir el estado asentado.
      expect(d.ordersRepo.findOrdersForPharmacies).toHaveBeenCalledTimes(2);
    });
  });

  describe('openReview', () => {
    it('ENVIADO → EN_REVISION: lock, event in the tx and bell after commit', async () => {
      const d = build();
      const vivo = pedido();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(vivo);

      await runWithTenant('tenant-a', () =>
        d.service.openReview('order-1', staff),
      );

      expect(vivo.reservationStatusConceptId).toBe(PINV.ORDER_EN_REVISION);
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'PharmacyOrderUnderReview',
          tenantId: 'tenant-a',
        }),
      );
      expect(d.orderNotifications.orderUnderReview).toHaveBeenCalledWith(
        'order-1',
        'pat-1',
        staff.id,
      );
    });

    it('an illegal transition answers 422 without touching event nor ledger', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(
        pedido({ reservationStatusConceptId: PINV.ORDER_CONFIRMADO }),
      );

      await expect(
        runWithTenant('tenant-a', () => d.service.openReview('order-1', staff)),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
      expect(
        d.reservationsService.releaseConfirmedLines,
      ).not.toHaveBeenCalled();
    });

    it('double review (race): the loser sees EN_REVISION and gets 422, no second event', async () => {
      const d = build();
      // El lock serializa: el segundo actor relee el estado que dejó el primero.
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(
        pedido({ reservationStatusConceptId: PINV.ORDER_EN_REVISION }),
      );

      await expect(
        runWithTenant('tenant-a', () => d.service.openReview('order-1', staff)),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
      expect(d.orderNotifications.orderUnderReview).not.toHaveBeenCalled();
    });

    it('a pharmacy from another tenant cannot mutate: same 404 as nonexistent', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(pedido());
      d.ordersRepo.findPharmaciesByIdsInTenant.mockResolvedValue([]);

      await expect(
        runWithTenant('tenant-b', () => d.service.openReview('order-1', staff)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    it.each([
      ['ENVIADO', PINV.ORDER_ENVIADO],
      ['EN_REVISION', PINV.ORDER_EN_REVISION],
    ])('confirms from %s sealing confirmed_at', async (_name, fromId) => {
      const d = build();
      const vivo = pedido({ reservationStatusConceptId: fromId });
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(vivo);

      await runWithTenant('tenant-a', () =>
        d.service.confirm('order-1', {}, staff),
      );

      expect(vivo.reservationStatusConceptId).toBe(PINV.ORDER_CONFIRMADO);
      expect(vivo.confirmedAt).toBeInstanceOf(Date);
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'PharmacyOrderConfirmed' }),
      );
      expect(d.orderNotifications.orderConfirmed).toHaveBeenCalled();
    });

    it('NO_DISPONIBLE releases ONLY that line and leaves it OUT_OF_STOCK with zero reserved', async () => {
      const d = build();
      const vivo = pedido();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(vivo);
      const afectada = linea({ id: 'line-1', pharmacyProductId: 'prod-1' });
      const intacta = linea({ id: 'line-2', pharmacyProductId: 'prod-2' });
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([
        afectada,
        intacta,
      ]);

      await runWithTenant('tenant-a', () =>
        d.service.confirm(
          'order-1',
          { adjustments: [{ productId: 'prod-1', decision: 'NO_DISPONIBLE' }] },
          staff,
        ),
      );

      // La primitiva compartida, acotada a la línea afectada — nada más.
      expect(d.reservationsService.releaseConfirmedLines).toHaveBeenCalledWith(
        d.tx,
        vivo,
        staff,
        { onlyLineIds: ['line-1'] },
      );
      expect(afectada.statusConceptId).toBe(PINV.RES_LINE_OUT_OF_STOCK);
      expect(afectada.reservedQuantity).toBe('0');
      expect(intacta.statusConceptId).toBe(PINV.RES_LINE_CONFIRMED);
      expect(intacta.reservedQuantity).toBe('3');
    });

    it('a line born out of stock is not released twice by the adjustment', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(pedido());
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([
        linea({
          statusConceptId: PINV.RES_LINE_OUT_OF_STOCK,
          reservedQuantity: '0',
        }),
      ]);

      await runWithTenant('tenant-a', () =>
        d.service.confirm(
          'order-1',
          { adjustments: [{ productId: 'prod-1', decision: 'NO_DISPONIBLE' }] },
          staff,
        ),
      );

      expect(
        d.reservationsService.releaseConfirmedLines,
      ).not.toHaveBeenCalled();
    });

    it('PROPONER_GENERICO persists the proposal and parks the order awaiting the patient', async () => {
      const d = build();
      const vivo = pedido();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(vivo);
      const renglon = linea({ unitPriceAmount: '60.00' });
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([renglon]);
      d.ordersRepo.findProductsByIds.mockResolvedValue([PRODUCTO, GENERICO]);
      // La oferta del genérico tiene precio publicado en la sede.
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
          pharmacyProductId: 'prod-gen',
          pharmacyPriceListId: 'list-1',
          unitAmount: '25.00',
          patientAmount: null,
        },
      ]);

      await runWithTenant('tenant-a', () =>
        d.service.confirm(
          'order-1',
          {
            adjustments: [
              {
                productId: 'prod-1',
                decision: 'PROPONER_GENERICO',
                proposedProductId: 'prod-gen',
              },
            ],
          },
          staff,
        ),
      );

      // La bitácora: propuesta EN PIE, anclada al renglón, con la oferta
      // congelada (el original conserva su precio de creación).
      expect(d.substitutionsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          inventoryReservationId: 'order-1',
          inventoryReservationLineId: 'line-1',
          originalPharmacyProductId: 'prod-1',
          proposedPharmacyProductId: 'prod-gen',
          originalUnitPriceAmount: '60.00',
          proposedUnitPriceAmount: '25.00',
          currencyConceptId: 'cur-bob',
          statusConceptId: PINV.SUBSTITUTION_PROPUESTA,
        }),
      );
      // El pedido espera al paciente, confirmado por el mostrador.
      expect(vivo.reservationStatusConceptId).toBe(
        PINV.ORDER_ACEPTACION_PENDIENTE,
      );
      expect(vivo.confirmedAt).toBeInstanceOf(Date);
      // El stock del original NO se libera: si prefiere el original, sigue.
      expect(
        d.reservationsService.releaseConfirmedLines,
      ).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'PharmacyOrderSubstitutionsProposed',
        }),
      );
      expect(d.orderNotifications.substitutionsProposed).toHaveBeenCalledWith(
        'order-1',
        'pat-1',
        1,
        staff.id,
      );
      expect(d.orderNotifications.orderConfirmed).not.toHaveBeenCalled();
    });

    it('a proposal of ANOTHER medication answers 422 with zero writes', async () => {
      const d = build();
      const vivo = pedido();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(vivo);
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([linea()]);
      d.ordersRepo.findProductsByIds.mockResolvedValue([
        PRODUCTO,
        OTRO_CONCEPTO,
      ]);

      const error = await runWithTenant('tenant-a', () =>
        d.service
          .confirm(
            'order-1',
            {
              adjustments: [
                {
                  productId: 'prod-1',
                  decision: 'PROPONER_GENERICO',
                  proposedProductId: 'prod-otro',
                },
              ],
            },
            staff,
          )
          .catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(vivo.reservationStatusConceptId).toBe(PINV.ORDER_ENVIADO);
      expect(d.substitutionsRepo.create).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('PROPONER_GENERICO without a proposed product answers 422', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(pedido());
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([linea()]);

      await expect(
        runWithTenant('tenant-a', () =>
          d.service.confirm(
            'order-1',
            {
              adjustments: [
                { productId: 'prod-1', decision: 'PROPONER_GENERICO' },
              ],
            },
            staff,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.substitutionsRepo.create).not.toHaveBeenCalled();
    });

    it('an adjustment for a product outside the order answers 422', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(pedido());
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([linea()]);

      await expect(
        runWithTenant('tenant-a', () =>
          d.service.confirm(
            'order-1',
            {
              adjustments: [
                { productId: 'prod-ajeno', decision: 'NO_DISPONIBLE' },
              ],
            },
            staff,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('releases the reserved stock through the shared primitive and notifies with the reason', async () => {
      const d = build();
      const vivo = pedido({
        reservationStatusConceptId: PINV.ORDER_EN_REVISION,
      });
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(vivo);

      await runWithTenant('tenant-a', () =>
        d.service.reject('order-1', { reason: 'Receta vencida' }, staff),
      );

      expect(vivo.reservationStatusConceptId).toBe(PINV.ORDER_RECHAZADO);
      expect(vivo.releasedAt).toBeInstanceOf(Date);
      expect(d.reservationsService.releaseConfirmedLines).toHaveBeenCalledWith(
        d.tx,
        vivo,
        staff,
      );
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'PharmacyOrderRejected',
          payloadJson: expect.objectContaining({ reason: 'Receta vencida' }),
        }),
      );
      expect(d.orderNotifications.orderRejected).toHaveBeenCalledWith(
        'order-1',
        'pat-1',
        'Receta vencida',
        staff.id,
      );
    });

    it('the reason IS persisted on the order (v4.2.1): the GET can return it', async () => {
      const d = build();
      const vivo = pedido();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(vivo);

      await runWithTenant('tenant-a', () =>
        d.service.reject('order-1', { reason: 'Sin stock real' }, staff),
      );

      expect(vivo.rejectionReasonText).toBe('Sin stock real');
    });

    it('rejecting from LISTO_PARA_RETIRO is illegal: 422 and no release', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(
        pedido({ reservationStatusConceptId: PINV.ORDER_LISTO_PARA_RETIRO }),
      );

      await expect(
        runWithTenant('tenant-a', () =>
          d.service.reject('order-1', { reason: 'tarde' }, staff),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(
        d.reservationsService.releaseConfirmedLines,
      ).not.toHaveBeenCalled();
    });

    it('double reject (race): terminal state gets 422 without duplicating the ledger', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(
        pedido({ reservationStatusConceptId: PINV.ORDER_RECHAZADO }),
      );

      await expect(
        runWithTenant('tenant-a', () =>
          d.service.reject('order-1', { reason: 'otra vez' }, staff),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(
        d.reservationsService.releaseConfirmedLines,
      ).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });
  });

  describe('ready', () => {
    /** Un pedido confirmado de RETIRO, con la sede de mostrador por defecto. */
    function retiroConfirmado(extra: Record<string, unknown> = {}) {
      return pedido({
        reservationStatusConceptId: PINV.ORDER_CONFIRMADO,
        deliveryModeConceptId: PINV.DELIVERY_RETIRO,
        ...extra,
      });
    }

    it('a confirmed pickup order transitions, seals a code and renews the clock', async () => {
      const d = build();
      const confirmado = retiroConfirmado();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(confirmado);

      const res = await runWithTenant('tenant-a', () =>
        d.service.ready('order-1', staff),
      );

      expect(confirmado.reservationStatusConceptId).toBe(
        PINV.ORDER_LISTO_PARA_RETIRO,
      );
      // El código: 6 símbolos del alfabeto sin ambiguos, ya normalizado.
      expect(confirmado.pickupCode).toMatch(
        /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/,
      );
      // La reserva corre de nuevo ~48 h desde ahora.
      const horas = (confirmado.expiresAt.getTime() - Date.now()) / 3_600_000;
      expect(horas).toBeGreaterThan(47.9);
      expect(horas).toBeLessThanOrEqual(48);
      // El hecho en la transacción; la campana después, CON el código.
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'PharmacyOrderReady' }),
      );
      expect(d.orderNotifications.orderReady).toHaveBeenCalledWith(
        'order-1',
        'pat-1',
        'user-mostrador',
        confirmado.pickupCode,
      );
      // La lectura de staff NO revela el código: es la prueba del titular.
      expect(res.pickupCode).toBeNull();
    });

    it('a re-ready keeps the already sealed code: nobody re-notifies a new one', async () => {
      const d = build();
      const confirmado = retiroConfirmado({ pickupCode: 'ZZZZ99' });
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(confirmado);

      await runWithTenant('tenant-a', () => d.service.ready('order-1', staff));

      expect(confirmado.pickupCode).toBe('ZZZZ99');
      expect(d.orderNotifications.orderReady).toHaveBeenCalledWith(
        'order-1',
        'pat-1',
        'user-mostrador',
        'ZZZZ99',
      );
    });

    it('an order without modality answers a typed 422 with zero effects', async () => {
      const d = build();
      const confirmado = pedido({
        reservationStatusConceptId: PINV.ORDER_CONFIRMADO,
      });
      const venceEl = confirmado.expiresAt;
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(confirmado);

      const error = await runWithTenant('tenant-a', () =>
        d.service.ready('order-1', staff).catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as any).details).toMatchObject({ deliveryMode: null });
      expect(confirmado.reservationStatusConceptId).toBe(PINV.ORDER_CONFIRMADO);
      expect(confirmado.pickupCode).toBeUndefined();
      expect(confirmado.expiresAt).toBe(venceEl);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
      expect(d.orderNotifications.orderReady).not.toHaveBeenCalled();
    });

    it('a shipping order closes through the shipping lane, not the counter', async () => {
      const d = build();
      const confirmado = retiroConfirmado({
        deliveryModeConceptId: PINV.DELIVERY_DOMICILIO,
      });
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(confirmado);

      const error = await runWithTenant('tenant-a', () =>
        d.service.ready('order-1', staff).catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as any).details).toMatchObject({
        deliveryMode: 'PINV_DELIVERY_DOMICILIO',
      });
      expect(confirmado.reservationStatusConceptId).toBe(PINV.ORDER_CONFIRMADO);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('a site without a counter cannot promise a pickup: typed 422', async () => {
      const d = build();
      const confirmado = retiroConfirmado();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(confirmado);
      d.ordersRepo.findSitesByIds.mockResolvedValue([
        { ...SEDE, pickupAvailable: false },
      ]);

      const error = await runWithTenant('tenant-a', () =>
        d.service.ready('order-1', staff).catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as any).details).toMatchObject({ siteId: 'site-1' });
      expect(confirmado.reservationStatusConceptId).toBe(PINV.ORDER_CONFIRMADO);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('a pickup-code collision retries the whole transaction with a fresh code', async () => {
      const d = build();
      const confirmado = retiroConfirmado();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(confirmado);
      const original = d.em.transactional.getMockImplementation();
      let llamadas = 0;
      d.em.transactional.mockImplementation(async (cb: any) => {
        llamadas += 1;
        if (llamadas === 1) {
          throw new UniqueConstraintViolationException(
            new Error(
              `duplicate key value violates unique constraint "${PICKUP_CODE_UNIQUE_INDEX}"`,
            ),
          );
        }
        return original!(cb);
      });

      await runWithTenant('tenant-a', () => d.service.ready('order-1', staff));

      expect(llamadas).toBe(2);
      expect(confirmado.reservationStatusConceptId).toBe(
        PINV.ORDER_LISTO_PARA_RETIRO,
      );
    });

    it('three collisions in a row stop as a conflict, not an infinite loop', async () => {
      const d = build();
      d.em.transactional.mockImplementation(async () => {
        throw new UniqueConstraintViolationException(
          new Error(
            `duplicate key value violates unique constraint "${PICKUP_CODE_UNIQUE_INDEX}"`,
          ),
        );
      });

      const error = await runWithTenant('tenant-a', () =>
        d.service.ready('order-1', staff).catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(ConflictException);
      expect(d.em.transactional).toHaveBeenCalledTimes(3);
    });

    it('the collision detector matches the CURRENT catalog index name — a rename must break here', () => {
      // v4.2.2 renombró el único (global → por sede) y el detector de v4.2.1
      // quedó mirando el nombre viejo: el reintento murió en silencio. Este
      // spec ata la constante al catálogo ORM: si alguien vuelve a renombrar
      // el índice, esto se pone rojo ANTES de que el reintento deje de andar.
      const pickupUniques = pharmacyInventoryIndexes.filter(
        ([table, , columns, unique]) =>
          table === 'inventory_reservations' &&
          unique === true &&
          columns.includes('pickup_code'),
      );
      expect(pickupUniques).toHaveLength(1);
      expect(pickupUniques[0][1]).toBe(PICKUP_CODE_UNIQUE_INDEX);
    });

    it('any other unique violation is a real error and does NOT retry', async () => {
      const d = build();
      d.em.transactional.mockImplementation(async () => {
        throw new UniqueConstraintViolationException(
          new Error(
            'duplicate key value violates unique constraint "uq_inventory_reservations_idempotency"',
          ),
        );
      });

      const error = await runWithTenant('tenant-a', () =>
        d.service.ready('order-1', staff).catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(UniqueConstraintViolationException);
      expect(d.em.transactional).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispense (FAR-E3)', () => {
    /** Un pedido listo, con su código sellado. */
    function listo(extra: Record<string, unknown> = {}) {
      return pedido({
        reservationStatusConceptId: PINV.ORDER_LISTO_PARA_RETIRO,
        deliveryModeConceptId: PINV.DELIVERY_RETIRO,
        pickupCode: 'ABC234',
        ...extra,
      });
    }

    /** Una línea reservada y aún sin entregar, con ubicación y lote. */
    function lineaViva(extra: Record<string, unknown> = {}) {
      return linea({
        inventoryLocationId: 'loc-1',
        inventoryLotId: 'lot-1',
        ...extra,
      });
    }

    /** La posición de stock que respalda la línea viva. */
    function posicion() {
      return {
        inventoryLocationId: 'loc-1',
        pharmacyProductId: 'prod-1',
        inventoryLotId: 'lot-1',
        onHandQuantity: '5',
        reservedQuantity: '3',
        quarantineQuantity: '0',
        availableQuantity: '2',
      } as any;
    }

    it('the right code delivers the full balance and the order becomes RETIRADO', async () => {
      const d = build();
      const orden = listo();
      const lin = lineaViva();
      const pos = posicion();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(orden);
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([lin]);
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(pos);

      // Minúsculas y espacios: la comparación es insensible a la forma.
      await runWithTenant('tenant-a', () =>
        d.service.dispense('order-1', { pickupCode: ' abc234 ' }, staff),
      );

      // La entrega quedó asentada: dispensación, línea y ledger.
      expect(d.dispensationsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          inventoryReservationId: 'order-1',
          dispensationStatusConceptId: PINV.DISPENSE_DISPENSED,
        }),
      );
      expect(d.dispensationsRepo.createLine).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ dispensedQuantity: '3' }),
      );
      expect(d.ledgerRepo.append).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          movementTypeConceptId: PINV.MV_DISPENSE,
          quantityDelta: '-3',
          reservationDelta: '-3',
        }),
      );
      // El stock estaba reservado por ESTE pedido: bajan on_hand y reserved.
      expect(pos.onHandQuantity).toBe('2');
      expect(pos.reservedQuantity).toBe('0');
      expect(pos.availableQuantity).toBe('2');
      // La línea acumula y el pedido cierra.
      expect(lin.fulfilledQuantity).toBe('3');
      expect(lin.statusConceptId).toBe(PINV.RES_LINE_FULFILLED);
      expect(orden.reservationStatusConceptId).toBe(PINV.ORDER_RETIRADO);
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'PharmacyOrderDispensed',
          payloadJson: expect.objectContaining({
            statusCode: 'PINV_ORDER_RETIRADO',
            complete: true,
          }),
        }),
      );
    });

    it('a code mismatch is a typed 422 with ZERO writes', async () => {
      const d = build();
      const orden = listo();
      const lin = lineaViva();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(orden);
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([lin]);

      const error = await runWithTenant('tenant-a', () =>
        d.service
          .dispense('order-1', { pickupCode: 'XXXXXX' }, staff)
          .catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as any).details).toMatchObject({
        reason: 'PICKUP_CODE_MISMATCH',
      });
      // Cero efectos: ni dispensación, ni ledger, ni estado, ni evento.
      expect(d.dispensationsRepo.create).not.toHaveBeenCalled();
      expect(d.ledgerRepo.append).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
      expect(orden.reservationStatusConceptId).toBe(
        PINV.ORDER_LISTO_PARA_RETIRO,
      );
      expect(lin.fulfilledQuantity).toBeUndefined();
    });

    it('a partial delivery keeps LISTO with the SAME code; the second one closes', async () => {
      const d = build();
      const orden = listo();
      const linea1 = lineaViva();
      const linea2 = lineaViva({
        id: 'line-2',
        pharmacyProductId: 'prod-2',
        inventoryLocationId: 'loc-2',
        inventoryLotId: undefined,
      });
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(orden);
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([
        linea1,
        linea2,
      ]);
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(posicion());

      // Primera entrega: solo prod-1. El pedido sigue LISTO, mismo código.
      await runWithTenant('tenant-a', () =>
        d.service.dispense(
          'order-1',
          { pickupCode: 'ABC234', productIds: ['prod-1'] },
          staff,
        ),
      );
      expect(linea1.fulfilledQuantity).toBe('3');
      expect(linea2.fulfilledQuantity).toBeUndefined();
      expect(orden.reservationStatusConceptId).toBe(
        PINV.ORDER_LISTO_PARA_RETIRO,
      );
      expect(orden.pickupCode).toBe('ABC234');
      expect(d.outbox.publishDomainEvent).toHaveBeenLastCalledWith(
        d.tx,
        expect.objectContaining({
          payloadJson: expect.objectContaining({
            complete: false,
            remainingLineCount: 1,
          }),
        }),
      );

      // Segunda entrega, mismo código: cubre el saldo y cierra RETIRADO.
      await runWithTenant('tenant-a', () =>
        d.service.dispense(
          'order-1',
          { pickupCode: 'ABC234', productIds: ['prod-2'] },
          staff,
        ),
      );
      expect(linea2.fulfilledQuantity).toBe('3');
      expect(orden.reservationStatusConceptId).toBe(PINV.ORDER_RETIRADO);
    });

    it('a product without standing balance answers 422 without a ghost delivery', async () => {
      const d = build();
      const orden = listo();
      const entregada = lineaViva({
        statusConceptId: PINV.RES_LINE_FULFILLED,
        fulfilledQuantity: '3',
      });
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(orden);
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([entregada]);

      const error = await runWithTenant('tenant-a', () =>
        d.service
          .dispense(
            'order-1',
            { pickupCode: 'ABC234', productIds: ['prod-1'] },
            staff,
          )
          .catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as any).details).toMatchObject({
        productIds: ['prod-1'],
      });
      expect(d.dispensationsRepo.create).not.toHaveBeenCalled();
      expect(d.ledgerRepo.append).not.toHaveBeenCalled();
    });

    it('replaying the idempotency key returns the order without re-dispensing', async () => {
      const d = build();
      const orden = listo({ reservationStatusConceptId: PINV.ORDER_RETIRADO });
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(orden);
      d.dispensationsRepo.findByIdempotencyKey.mockResolvedValue({
        id: 'disp-0',
        inventoryReservationId: 'order-1',
      });

      const res = await runWithTenant('tenant-a', () =>
        d.service.dispense(
          'order-1',
          { pickupCode: 'ABC234', idempotencyKey: 'clave-1' },
          staff,
        ),
      );

      expect(res.id).toBe('order-1');
      expect(d.dispensationsRepo.create).not.toHaveBeenCalled();
      expect(d.ledgerRepo.append).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('an idempotency key from another delivery is a conflict, not a silent no-op', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(listo());
      d.dispensationsRepo.findByIdempotencyKey.mockResolvedValue({
        id: 'disp-9',
        inventoryReservationId: 'otro-pedido',
      });

      const error = await runWithTenant('tenant-a', () =>
        d.service
          .dispense(
            'order-1',
            { pickupCode: 'ABC234', idempotencyKey: 'clave-ajena' },
            staff,
          )
          .catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(ConflictException);
      expect(d.dispensationsRepo.create).not.toHaveBeenCalled();
    });

    it('an order that is not ready answers 422 with the current state in words', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(
        pedido({ reservationStatusConceptId: PINV.ORDER_CONFIRMADO }),
      );

      const error = await runWithTenant('tenant-a', () =>
        d.service
          .dispense('order-1', { pickupCode: 'ABC234' }, staff)
          .catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as any).details).toMatchObject({
        from: 'PINV_ORDER_CONFIRMADO',
      });
      expect(d.dispensationsRepo.create).not.toHaveBeenCalled();
    });

    it('another tenant gets the same 404 as a nonexistent order', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(listo());
      d.ordersRepo.findPharmaciesByIdsInTenant.mockResolvedValue([]);

      const error = await runWithTenant('tenant-b', () =>
        d.service
          .dispense('order-1', { pickupCode: 'ABC234' }, staff)
          .catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(d.dispensationsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('acceptSubstitutions / preferOriginal (paciente)', () => {
    /** Un pedido esperando la decisión, con su propuesta en pie. */
    function esperandoDecision() {
      return pedido({
        reservationStatusConceptId: PINV.ORDER_ACEPTACION_PENDIENTE,
      });
    }

    function propuesta(extra: Record<string, unknown> = {}) {
      return {
        id: 'sub-1',
        inventoryReservationId: 'order-1',
        inventoryReservationLineId: 'line-1',
        originalPharmacyProductId: 'prod-1',
        proposedPharmacyProductId: 'prod-gen',
        originalUnitPriceAmount: '60.00',
        proposedUnitPriceAmount: '25.00',
        currencyConceptId: 'cur-bob',
        statusConceptId: PINV.SUBSTITUTION_PROPUESTA,
        decidedAt: undefined,
        ...extra,
      } as any;
    }

    it('accepting swaps the stock: releases the original, reserves the proposed with its frozen price, ACEPTADO', async () => {
      const d = build();
      const orden = esperandoDecision();
      const original = linea();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(orden);
      const sub = propuesta();
      d.substitutionsRepo.findByReservationIds.mockResolvedValue([sub]);
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([original]);
      d.inventoryReadRepo.findActiveLocationsBySites.mockResolvedValue([
        { id: 'loc-1', pharmacySiteId: 'site-1' },
      ]);
      const posicion = {
        inventoryLocationId: 'loc-1',
        pharmacyProductId: 'prod-gen',
        inventoryLotId: 'lot-9',
        onHandQuantity: '10',
        reservedQuantity: '0',
        quarantineQuantity: '0',
        availableQuantity: '10',
      } as any;
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([posicion]);
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(posicion);

      await runWithTenant('tenant-a', () =>
        d.service.acceptSubstitutions('order-1', paciente),
      );

      // El stock del original vuelve con la primitiva compartida.
      expect(d.reservationsService.releaseConfirmedLines).toHaveBeenCalledWith(
        d.tx,
        orden,
        paciente,
        { onlyLineIds: ['line-1'] },
      );
      // El propuesto se reserva con la MISMA contabilidad y el precio de la
      // oferta que el paciente aceptó — no el de la lista de mañana.
      expect(d.reservationsRepo.createLine).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          pharmacyProductId: 'prod-gen',
          reservedQuantity: '3',
          statusConceptId: PINV.RES_LINE_CONFIRMED,
          unitPriceAmount: '25.00',
          currencyConceptId: 'cur-bob',
        }),
      );
      expect(d.ledgerRepo.append).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          movementTypeConceptId: PINV.MV_RESERVE,
          reservationDelta: '3',
        }),
      );
      // La propuesta sobrevive como historia decidida.
      expect(sub.statusConceptId).toBe(PINV.SUBSTITUTION_ACEPTADA);
      expect(sub.decidedAt).toBeInstanceOf(Date);
      expect(orden.reservationStatusConceptId).toBe(PINV.ORDER_ACEPTADO);
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'PharmacyOrderSubstitutionsAccepted',
        }),
      );
    });

    it('a product split across several portions is swapped WHOLE: all portions released, full quantity re-reserved', async () => {
      const d = build();
      const orden = esperandoDecision();
      // El renglón lógico prod-1 vive repartido en DOS porciones físicas
      // (dos posiciones/lotes): la identidad del contrato es el producto.
      const porcionA = linea({
        id: 'line-1',
        requestedQuantity: '2',
        reservedQuantity: '2',
      });
      const porcionB = linea({
        id: 'line-1b',
        requestedQuantity: '1',
        reservedQuantity: '1',
      });
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(orden);
      d.substitutionsRepo.findByReservationIds.mockResolvedValue([propuesta()]);
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([
        porcionA,
        porcionB,
      ]);
      d.inventoryReadRepo.findActiveLocationsBySites.mockResolvedValue([
        { id: 'loc-1', pharmacySiteId: 'site-1' },
      ]);
      const posicion = {
        inventoryLocationId: 'loc-1',
        pharmacyProductId: 'prod-gen',
        inventoryLotId: 'lot-9',
        onHandQuantity: '10',
        reservedQuantity: '0',
        quarantineQuantity: '0',
        availableQuantity: '10',
      } as any;
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([posicion]);
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(posicion);

      await runWithTenant('tenant-a', () =>
        d.service.acceptSubstitutions('order-1', paciente),
      );

      // La liberación abarca TODAS las porciones físicas del producto — la
      // propuesta ancla en la primera solo como FK; ninguna reserva original
      // queda huérfana.
      expect(d.reservationsService.releaseConfirmedLines).toHaveBeenCalledWith(
        d.tx,
        orden,
        paciente,
        { onlyLineIds: ['line-1', 'line-1b'] },
      );
      // Y el propuesto se reserva por la cantidad TOTAL pedida (2 + 1).
      expect(d.reservationsRepo.createLine).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          pharmacyProductId: 'prod-gen',
          reservedQuantity: '3',
        }),
      );
    });

    it('accepting re-freezes the header total from the standing lines', async () => {
      const d = build();
      const orden = esperandoDecision();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(orden);
      d.substitutionsRepo.findByReservationIds.mockResolvedValue([propuesta()]);
      // Primera lectura: el renglón original; segunda (post-swap): el nuevo.
      d.ordersRepo.findLinesByReservationIds
        .mockResolvedValueOnce([linea()])
        .mockResolvedValue([
          linea({
            id: 'line-2',
            pharmacyProductId: 'prod-gen',
            reservedQuantity: '3',
            unitPriceAmount: '25.00',
            currencyConceptId: 'cur-bob',
          }),
        ]);
      d.inventoryReadRepo.findActiveLocationsBySites.mockResolvedValue([
        { id: 'loc-1', pharmacySiteId: 'site-1' },
      ]);
      const posicion = {
        inventoryLocationId: 'loc-1',
        pharmacyProductId: 'prod-gen',
        inventoryLotId: null,
        onHandQuantity: '10',
        reservedQuantity: '0',
        quarantineQuantity: '0',
        availableQuantity: '10',
      } as any;
      d.inventoryReadRepo.findStockPositions.mockResolvedValue([posicion]);
      d.stockRepo.findByKeyForUpdate.mockResolvedValue(posicion);

      await runWithTenant('tenant-a', () =>
        d.service.acceptSubstitutions('order-1', paciente),
      );

      // 3 × 25.00, exacto y a 2 decimales.
      expect(orden.totalAmount).toBe('75.00');
      expect(orden.currencyConceptId).toBe('cur-bob');
    });

    it('preferring the original keeps the lines and returns the order to CONFIRMADO', async () => {
      const d = build();
      const orden = esperandoDecision();
      const original = linea();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(orden);
      const sub = propuesta();
      d.substitutionsRepo.findByReservationIds.mockResolvedValue([sub]);
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([original]);

      await runWithTenant('tenant-a', () =>
        d.service.preferOriginal('order-1', paciente),
      );

      // Las líneas NO se tocan: el stock del original siguió reservado.
      expect(
        d.reservationsService.releaseConfirmedLines,
      ).not.toHaveBeenCalled();
      expect(d.reservationsRepo.createLine).not.toHaveBeenCalled();
      expect(original.statusConceptId).toBe(PINV.RES_LINE_CONFIRMED);
      // La propuesta queda como historia rechazada.
      expect(sub.statusConceptId).toBe(PINV.SUBSTITUTION_RECHAZADA);
      expect(sub.decidedAt).toBeInstanceOf(Date);
      expect(orden.reservationStatusConceptId).toBe(PINV.ORDER_CONFIRMADO);
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'PharmacyOrderOriginalPreferred',
        }),
      );
    });

    it('deciding is only legal on ACEPTACION_PENDIENTE: 422 with zero effects', async () => {
      const d = build();
      const orden = pedido({
        reservationStatusConceptId: PINV.ORDER_CONFIRMADO,
      });
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(orden);

      const error = await runWithTenant('tenant-a', () =>
        d.service
          .acceptSubstitutions('order-1', paciente)
          .catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(orden.reservationStatusConceptId).toBe(PINV.ORDER_CONFIRMADO);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('a non-owner gets the same 404 as a nonexistent order', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(
        esperandoDecision(),
      );
      const ajeno = {
        id: 'user-x',
        roles: ['PATIENT'],
        patientProfileId: 'pat-999',
      } as any;

      await expect(
        runWithTenant('tenant-a', () =>
          d.service.acceptSubstitutions('order-1', ajeno),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.substitutionsRepo.findByReservationIds).not.toHaveBeenCalled();
    });

    it('without standing proposals there is nothing to decide: 422', async () => {
      const d = build();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(
        esperandoDecision(),
      );
      d.substitutionsRepo.findByReservationIds.mockResolvedValue([
        propuesta({ statusConceptId: PINV.SUBSTITUTION_RECHAZADA }),
      ]);

      await expect(
        runWithTenant('tenant-a', () =>
          d.service.preferOriginal('order-1', paciente),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('avisos de cierre (FAR-E3)', () => {
    it('a COMPLETE dispense notifies the prescriber, navigating to the prescription', async () => {
      const d = build();
      const orden = pedido({
        reservationStatusConceptId: PINV.ORDER_LISTO_PARA_RETIRO,
        deliveryModeConceptId: PINV.DELIVERY_RETIRO,
        pickupCode: 'ABC234',
        medicationRequestId: 'req-1',
      });
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(orden);
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([
        linea({ inventoryLocationId: 'loc-1' }),
      ]);
      d.ordersRepo.findPrescriberProfileId.mockResolvedValue('presc-1');

      await runWithTenant('tenant-a', () =>
        d.service.dispense('order-1', { pickupCode: 'ABC234' }, staff),
      );

      expect(d.ordersRepo.findPrescriberProfileId).toHaveBeenCalledWith(
        d.fork,
        'req-1',
      );
      expect(d.orderNotifications.dispensedToPrescriber).toHaveBeenCalledWith(
        'order-1',
        'req-1',
        'presc-1',
        staff.id,
      );
    });

    it('a PARTIAL dispense does not notify the prescriber yet', async () => {
      const d = build();
      const orden = pedido({
        reservationStatusConceptId: PINV.ORDER_LISTO_PARA_RETIRO,
        deliveryModeConceptId: PINV.DELIVERY_RETIRO,
        pickupCode: 'ABC234',
        medicationRequestId: 'req-1',
      });
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(orden);
      d.ordersRepo.findLinesByReservationIds.mockResolvedValue([
        linea({ inventoryLocationId: 'loc-1' }),
        linea({
          id: 'line-2',
          pharmacyProductId: 'prod-2',
          inventoryLocationId: 'loc-1',
        }),
      ]);

      await runWithTenant('tenant-a', () =>
        d.service.dispense(
          'order-1',
          { pickupCode: 'ABC234', productIds: ['prod-1'] },
          staff,
        ),
      );

      expect(d.orderNotifications.dispensedToPrescriber).not.toHaveBeenCalled();
    });

    it('an expired order rings the patient bell after the commit', async () => {
      const d = build();
      const vencido = pedido({ expiresAt: new Date(Date.now() - 1) });
      d.ordersRepo.findDueOrdersForUpdate.mockResolvedValue([vencido]);

      const res = await d.service.expireDue(staff);

      expect(res).toEqual({ expiredCount: 1 });
      expect(vencido.reservationStatusConceptId).toBe(PINV.ORDER_VENCIDO);
      expect(d.orderNotifications.orderExpired).toHaveBeenCalledWith(
        'order-1',
        'pat-1',
        staff.id,
      );
      // Sin receta no hay bucle clínico que cerrar: el prescriptor no existe.
      expect(d.orderNotifications.expiredToPrescriber).not.toHaveBeenCalled();
    });

    it('an expired order WITH a prescription also warns the prescriber: the open-loop rule', async () => {
      const d = build();
      const vencido = pedido({
        expiresAt: new Date(Date.now() - 1),
        medicationRequestId: 'req-1',
      });
      d.ordersRepo.findDueOrdersForUpdate.mockResolvedValue([vencido]);
      d.ordersRepo.findPrescriberProfileId.mockResolvedValue('presc-1');

      await d.service.expireDue(staff);

      expect(d.ordersRepo.findPrescriberProfileId).toHaveBeenCalledWith(
        d.fork,
        'req-1',
      );
      expect(d.orderNotifications.expiredToPrescriber).toHaveBeenCalledWith(
        'order-1',
        'req-1',
        'presc-1',
        staff.id,
      );
    });
  });
});
