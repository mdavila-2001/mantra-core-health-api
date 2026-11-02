import { expect, jest } from '@jest/globals';
import { EntitySchema, TransactionContext } from '@mikro-orm/core';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import {
  runWithTenant,
  getCurrentTenantId,
  type AuthenticatedUser,
} from '../../../../common';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import type {
  InventoryReservations,
  InventoryReservationLines,
} from '../../entities';
import { PharmacyOrdersUseCases } from './pharmacy-orders.use-cases';
import type { PharmacyOrderChatPort } from '../ports/pharmacy-order-chat.port';

type ForkOptions = Parameters<EntityManager['fork']>[0];
/** Real ORM forks and request storage, with simulated repositories only. No SQL/GUC/RLS certification. */
export function fixture(
  orderChatFactory?: (em: EntityManager) => PharmacyOrderChatPort,
) {
  const orm = new MikroORM({
    entities: [
      new EntitySchema({
        name: 'OfflineOwnOrderReadContext',
        properties: { id: { type: 'number', primary: true } },
      }),
    ],
    dbName: 'offline',
    allowGlobalContext: true,
    metadataCache: { enabled: false },
    logger: () => undefined,
  });
  const request = orm.em.fork();
  const marker = { syntheticTransaction: 'same-tenant-http-request' };
  request.setTransactionContext(marker as never);
  const pharmacy = {
    id: 'pharmacy',
    tenantId: 'tenant-a',
    legalName: 'Synthetic pharmacy',
    tradeName: 'Synthetic pharmacy',
  };
  const site = { id: 'site', pharmacyId: pharmacy.id, name: 'Synthetic site' };
  const product = {
    id: 'product',
    pharmacyId: pharmacy.id,
    productCode: 'SYN',
    genericName: 'Synthetic item',
    stockQuantity: 5,
  };
  const order = {
    id: 'order',
    pharmacyId: pharmacy.id,
    pharmacySiteId: site.id,
    patientProfileId: 'patient',
    reservationStatusConceptId: PINV.ORDER_ENVIADO,
    deliveryModeConceptId: PINV.DELIVERY_RETIRO,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 60_000),
  } as InventoryReservations;
  const patient: AuthenticatedUser = {
    id: 'patient-user',
    roles: ['PATIENT'],
    patientProfileId: 'patient',
  };
  const staff: AuthenticatedUser = {
    id: 'staff-user',
    roles: ['PHARMACY_STAFF'],
  };
  const reads: EntityManager[] = [];
  const lines: InventoryReservationLines[] = [];
  let uncommitted = false;
  const scoped = (em: EntityManager) =>
    em.getTransactionContext() === marker &&
    getCurrentTenantId() === pharmacy.tenantId;
  const ordersRepo = {
    findOrderById: jest.fn(async (em: EntityManager) => {
      reads.push(em);
      return !uncommitted || scoped(em) ? order : null;
    }),
    findOrderByIdForUpdate: jest.fn(async () => order),
    findOrderByIdempotencyKey: jest.fn(
      async () => null as InventoryReservations | null,
    ),
    findOrdersByPatient: jest.fn(
      async (em: EntityManager, patientId: string) => {
        reads.push(em);
        return patientId === order.patientProfileId ? [order] : [];
      },
    ),
    findPharmaciesByTenant: jest.fn(
      async (em: EntityManager, tenantId: string) =>
        scoped(em) && tenantId === pharmacy.tenantId ? [pharmacy] : [],
    ),
    findOrdersForPharmacies: jest.fn(
      async (
        em: EntityManager,
        pharmacyIds: readonly string[],
        _statusIds: readonly string[],
        _filters: { siteId?: string; from?: Date; to?: Date; limit: number },
      ) => {
        reads.push(em);
        return pharmacyIds.includes(pharmacy.id) ? [order] : [];
      },
    ),
    findPharmaciesByIdsInTenant: jest.fn(
      async (em: EntityManager, tenantId: string | undefined) =>
        scoped(em) && (tenantId === undefined || tenantId === pharmacy.tenantId)
          ? [pharmacy]
          : [],
    ),
    findLinesByReservationIds: jest.fn(async () => lines),
    findSitesByIds: jest.fn(async () => [site]),
    findProductsByIds: jest.fn(async () => [product]),
    findConceptsByIds: jest.fn(async () => []),
    findPersonNamesByProfileIds: jest.fn(async () => new Map<string, string>()),
    findPrescriberProfileIdsByRequestIds: jest.fn(
      async () => new Map<string, string>(),
    ),
    findPrimarySpecialtyConceptIds: jest.fn(
      async () => new Map<string, string>(),
    ),
    findAddressesByIds: jest.fn(async () => []),
  };
  const persistence = {
    fork: jest.fn((options?: ForkOptions) => orm.em.fork(options)),
    // Simulate only the nested callback boundary. Native ORM forks still carry/drop the real public context.
    transactional: async <T>(
      run: (tx: EntityManager) => Promise<T>,
    ): Promise<T> => {
      const tx = orm.em.fork({ keepTransactionContext: true });
      jest.spyOn(tx, 'flush').mockResolvedValue(undefined);
      return run(tx);
    },
  };
  const reservations = {
    create: jest.fn(() => {
      uncommitted = true;
      return order;
    }),
    createLine: jest.fn((_em: EntityManager, data: object) => {
      const line = { id: 'line', ...data } as InventoryReservationLines;
      lines.push(line);
      return line;
    }),
  };
  const pharmacyDirectory = {
    findActiveSiteById: async () => site,
    findVisibleById: async () => pharmacy,
    findSellableProductsByIds: async () => [product],
    findCurrentPublicPriceLists: async () => [],
    findCurrentPrices: async () => [],
  };
  const inventory = {
    findActiveLocationsBySites: async () => [],
    findStockPositions: async () => [],
  };
  const outbox = { publish: jest.fn(async () => undefined) };
  const notifications = { orderUnderReview: jest.fn(async () => undefined) };
  const administration = { canAdminister: jest.fn(async () => false) };
  const externalStock = { resolve: jest.fn(async () => ({ mode: 'MANUAL' })) };
  const service = new PharmacyOrdersUseCases(
    persistence as never,
    ordersRepo as never,
    reservations as never,
    {} as never,
    {} as never,
    inventory as never,
    {} as never,
    { findByReservationIds: async () => [] } as never,
    pharmacyDirectory as never,
    {} as never,
    outbox as never,
    notifications as never,
    { setContext: () => undefined, info: () => undefined } as never,
    { forOrders: async () => new Map() } as never,
    administration as never,
    (orderChatFactory?.(orm.em) ?? {
      findPharmacyShowcases: async () => new Map(),
    }) as never,
    {} as never,
    { assertOrderRespectsPrescription: async () => undefined } as never,
    {} as never,
    externalStock as never,
  );
  const run = <T>(work: () => Promise<T>, tenant = 'tenant-a') =>
    runWithTenant(tenant, () => TransactionContext.create(request, work));
  const observe = () => {
    expect(reads.length).toBeGreaterThan(0);
    for (const em of reads) {
      expect(em).not.toBe(request);
      expect(em.getTransactionContext()).toBe(marker);
    }
  };
  const lazyExpiry = () => {
    order.expiresAt = new Date(0);
    return jest.spyOn(service, 'expireDue').mockImplementation(async () => {
      order.reservationStatusConceptId = PINV.ORDER_VENCIDO;
      return { expiredCount: 1 };
    });
  };
  return {
    service,
    externalStock,
    patient,
    staff,
    order,
    marker,
    request,
    reads,
    ordersRepo,
    persistence,
    reservations,
    outbox,
    administration,
    run,
    observe,
    lazyExpiry,
  };
}
