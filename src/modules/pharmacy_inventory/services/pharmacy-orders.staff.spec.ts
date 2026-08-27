import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { PharmacyOrdersService } from './pharmacy-orders.service';
import { PINV } from '../pharmacy_inventory.concepts';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const staff = { id: 'user-mostrador', roles: ['SECURITY_ADMIN'] } as any;

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

    it('PROPONER_GENERICO answers a typed 422 with ZERO writes: blocked by model', async () => {
      const d = build();
      const vivo = pedido();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(vivo);

      const error = await runWithTenant('tenant-a', () =>
        d.service
          .confirm(
            'order-1',
            {
              adjustments: [
                { productId: 'prod-1', decision: 'PROPONER_GENERICO' },
              ],
            },
            staff,
          )
          .catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as any).details).toMatchObject({
        blockedByModel: 'substitutions',
      });
      // Cero writes: ni estado, ni liberación, ni evento, ni campana.
      expect(vivo.reservationStatusConceptId).toBe(PINV.ORDER_ENVIADO);
      expect(vivo.confirmedAt).toBeUndefined();
      expect(
        d.reservationsService.releaseConfirmedLines,
      ).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
      expect(d.orderNotifications.orderConfirmed).not.toHaveBeenCalled();
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

    it('the reason is NOT persisted on the order: it only travels in event and bell', async () => {
      const d = build();
      const vivo = pedido();
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(vivo);

      await runWithTenant('tenant-a', () =>
        d.service.reject('order-1', { reason: 'Sin stock real' }, staff),
      );

      // La entidad no tiene columna de motivo y el servicio no inventa una.
      const campos = Object.keys(vivo as Record<string, unknown>);
      expect(campos.some((campo) => /reason|motivo/i.test(campo))).toBe(false);
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
    // «Listo para retiro» exige demostrar que el pedido ES un retiro, y la
    // modalidad no se persiste (bloqueador de modelo): la capacidad entera
    // responde 422 tipificado sin efectos. Estos specs fijan el bloqueo a
    // propósito — si alguien lo «arregla» adivinando la modalidad, delatan.
    it('answers a typed 422: blocked by model while modality is not persisted', async () => {
      const d = build();
      const confirmado = pedido({
        reservationStatusConceptId: PINV.ORDER_CONFIRMADO,
      });
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(confirmado);

      const error = await runWithTenant('tenant-a', () =>
        d.service.ready('order-1', staff).catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as any).details).toMatchObject({
        blockedByModel: 'deliveryMode',
      });
    });

    it('zero effects: state, expiry, ledger, outbox and bell all untouched', async () => {
      const d = build();
      const venceEl = new Date(Date.now() + 60_000);
      const confirmado = pedido({
        reservationStatusConceptId: PINV.ORDER_CONFIRMADO,
        expiresAt: venceEl,
      });
      d.ordersRepo.findOrderByIdForUpdate.mockResolvedValue(confirmado);

      await runWithTenant('tenant-a', () =>
        d.service.ready('order-1', staff).catch(() => undefined),
      );

      // El pedido sigue CONFIRMADO con su ventana original de 48 h intacta.
      expect(confirmado.reservationStatusConceptId).toBe(PINV.ORDER_CONFIRMADO);
      expect(confirmado.expiresAt).toBe(venceEl);
      // Y no hubo ni contabilidad, ni evento, ni campana — ni siquiera lock.
      expect(
        d.reservationsService.releaseConfirmedLines,
      ).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
      expect(d.orderNotifications.orderReady).not.toHaveBeenCalled();
      expect(d.ordersRepo.findOrderByIdForUpdate).not.toHaveBeenCalled();
    });
  });
});
