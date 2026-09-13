import { jest } from '@jest/globals';
import { CLIN } from '../../clinical/clinical.concepts';
import { ServiceRequests } from '../../clinical/entities';
import {
  DiagnosticStudyOfferings,
  DiagnosticUnits,
} from '../../diagnostic_units/entities';
import { Pharmacies, PharmacyProducts } from '../../pharmacy/entities';
import {
  InventoryReservations,
  InventoryReservationLines,
  PharmacyOrderSubstitutions,
} from '../../pharmacy_inventory/entities';
import { PINV } from '../../pharmacy_inventory/pharmacy_inventory.concepts';
import { InsuranceClaims, InsuranceClaimLines } from '../entities';
import { INS } from '../insurance.concepts';
import { LinkedClaimOrderService } from './linked-claim-order.service';

const fn = (implementation?: any): any => (jest.fn as any)(implementation);
function fixture() {
  const order = Object.assign(new InventoryReservations(), {
    id: 'order',
    pharmacyId: 'pharmacy',
    patientProfileId: 'patient',
    reservationStatusConceptId: PINV.ORDER_CONFIRMADO,
    confirmedAt: new Date(),
    expiresAt: new Date('2099-01-01'),
    currencyConceptId: 'bob',
    totalAmount: '100.00',
  });
  const portions: InventoryReservationLines[] = [
    Object.assign(new InventoryReservationLines(), {
      id: 'portion-a',
      inventoryReservationId: 'order',
      pharmacyProductId: 'product',
      reservedQuantity: '2',
      unitPriceAmount: '20.00',
      currencyConceptId: 'bob',
      statusConceptId: PINV.RES_LINE_CONFIRMED,
    }),
    Object.assign(new InventoryReservationLines(), {
      id: 'portion-b',
      inventoryReservationId: 'order',
      pharmacyProductId: 'product',
      reservedQuantity: '3',
      unitPriceAmount: '20.00',
      currencyConceptId: 'bob',
      statusConceptId: PINV.RES_LINE_CONFIRMED,
    }),
  ];
  const pharmacy = Object.assign(new Pharmacies(), {
    id: 'pharmacy',
    tenantId: 'provider',
  });
  const product = Object.assign(new PharmacyProducts(), {
    id: 'product',
    medicationConceptId: 'medicine',
  });
  const diagnosticOrder = Object.assign(new ServiceRequests(), {
    id: 'diagnostic',
    patientProfileId: 'patient',
    codeConceptId: 'study',
    performerTenantId: 'lab-tenant',
    statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
  });
  const offering = Object.assign(new DiagnosticStudyOfferings(), {
    id: 'offering',
    studyConceptId: 'study',
    diagnosticUnitId: 'lab',
  });
  const unit = Object.assign(new DiagnosticUnits(), {
    id: 'lab',
    tenantId: 'lab-tenant',
  });
  const claims = [
    Object.assign(new InsuranceClaims(), {
      id: 'claim',
      inventoryReservationId: 'order',
      billingProviderEntityId: 'pharmacy',
      currencyConceptId: 'bob',
    }),
    Object.assign(new InsuranceClaims(), {
      id: 'dx-claim',
      serviceRequestId: 'diagnostic',
      billingProviderEntityId: 'lab',
      currencyConceptId: 'bob',
    }),
  ];
  const claimLines = [
    Object.assign(new InsuranceClaimLines(), {
      id: 'dx-line',
      insuranceClaimId: 'dx-claim',
      diagnosticStudyOfferingId: 'offering',
      billedAmount: '150',
      quantity: '1',
    }),
  ];
  const tables = new Map<unknown, unknown[]>([
    [InventoryReservations, [order]],
    [InventoryReservationLines, portions],
    [PharmacyOrderSubstitutions, []],
    [Pharmacies, [pharmacy]],
    [PharmacyProducts, [product]],
    [ServiceRequests, [diagnosticOrder]],
    [DiagnosticStudyOfferings, [offering]],
    [DiagnosticUnits, [unit]],
    [InsuranceClaimLines, claimLines],
  ]);
  const em = {
    find: fn(async (entity: unknown) => tables.get(entity) ?? []),
    findOne: fn(async (entity: unknown) => tables.get(entity)?.[0] ?? null),
  };
  return {
    em,
    service: new LinkedClaimOrderService(),
    tables,
    order,
    portions,
    diagnosticOrder,
    unit,
    offering,
    claims,
    claimLines,
  };
}

describe('LinkedClaimOrderService', () => {
  it('resuelve todos los lotes físicos de un producto con cantidades e importes congelados', async () => {
    const f = fixture();
    const snapshots = await f.service.loadSnapshots(
      f.em as never,
      f.claims,
      f.claimLines,
    );
    expect(snapshots.get('claim')).toEqual(
      expect.objectContaining({
        billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PHARMACY,
        totalAmount: '100.00',
        canSubmit: true,
        validForSettlement: true,
        lines: [
          expect.objectContaining({
            inventoryReservationLineId: 'portion-a',
            quantity: '2',
            billedAmount: '40.00',
          }),
          expect.objectContaining({
            inventoryReservationLineId: 'portion-b',
            quantity: '3',
            billedAmount: '60.00',
          }),
        ],
      }),
    );
    expect(snapshots.get('dx-claim')).toEqual(
      expect.objectContaining({
        billingProviderEntityId: 'lab',
        totalAmount: '150',
        validForSettlement: true,
      }),
    );
  });
  it('consulta por lotes con número constante de lecturas incluso con varios reclamos', async () => {
    const f = fixture();
    await f.service.loadSnapshots(
      f.em as never,
      [...f.claims, ...f.claims],
      f.claimLines,
    );
    expect(f.em.find).toHaveBeenCalledTimes(8);
    expect(f.em.findOne).not.toHaveBeenCalled();
  });
  it('no consulta una página vacía', async () => {
    const f = fixture();
    expect((await f.service.loadSnapshots(f.em as never, [])).size).toBe(0);
    expect(f.em.find).not.toHaveBeenCalled();
  });
  it.each([
    PINV.ORDER_CANCELADO,
    PINV.ORDER_RECHAZADO,
    PINV.ORDER_VENCIDO,
    PINV.ORDER_ACEPTACION_PENDIENTE,
  ])('retira vigencia en estado %s', async (status) => {
    const f = fixture();
    f.order.reservationStatusConceptId = status;
    expect(
      (
        await f.service.loadSnapshots(f.em as never, f.claims, f.claimLines)
      ).get('claim')?.validForSettlement,
    ).toBe(false);
  });
  it('una sustitución pendiente impide publicar aunque la cabecera sea confirmada', async () => {
    const f = fixture();
    f.tables.set(PharmacyOrderSubstitutions, [
      { inventoryReservationId: 'order' },
    ]);
    expect(
      (
        await f.service.loadSnapshots(f.em as never, f.claims, f.claimLines)
      ).get('claim')?.validForSettlement,
    ).toBe(false);
  });
  it('una entrega parcial mantiene la liquidación y bloquea un alta tardía', async () => {
    const f = fixture();
    f.portions[0].fulfilledQuantity = '1';
    expect(
      (
        await f.service.loadSnapshots(f.em as never, f.claims, f.claimLines)
      ).get('claim'),
    ).toEqual(
      expect.objectContaining({
        validForSettlement: true,
        canSubmit: false,
        totalAmount: '100.00',
      }),
    );
  });
  it.each(['price', 'currency', 'quantity', 'total'])(
    'rechaza snapshot económico inválido %s',
    async (field) => {
      const f = fixture();
      if (field === 'price') f.portions[0].unitPriceAmount = undefined;
      if (field === 'currency') f.portions[0].currencyConceptId = 'usd';
      if (field === 'quantity') f.portions[0].reservedQuantity = '-2';
      if (field === 'total') f.order.totalAmount = '101';
      expect(
        (
          await f.service.loadSnapshots(f.em as never, f.claims, f.claimLines)
        ).get('claim')?.validForSettlement,
      ).toBe(false);
    },
  );
  it.each(['performer', 'offering', 'study', 'revoked'])(
    'rechaza orden diagnóstica incoherente %s',
    async (field) => {
      const f = fixture();
      if (field === 'performer') f.diagnosticOrder.performerTenantId = 'other';
      if (field === 'offering') f.offering.diagnosticUnitId = 'other';
      if (field === 'study') f.offering.studyConceptId = 'other';
      if (field === 'revoked')
        f.diagnosticOrder.statusConceptId = CLIN.SERVICE_REQUEST_REVOKED;
      expect(
        (
          await f.service.loadSnapshots(f.em as never, f.claims, f.claimLines)
        ).get('dx-claim')?.validForSettlement,
      ).toBe(false);
    },
  );
  it('bloquea el pedido antes de consultar las líneas para una escritura', async () => {
    const f = fixture();
    await f.service.lockAndResolve(f.em as never, {
      inventoryReservationId: 'order',
      billingProviderEntityId: 'pharmacy',
      lines: [],
    });
    expect(f.em.findOne.mock.invocationCallOrder[0]).toBeLessThan(
      f.em.find.mock.invocationCallOrder[0],
    );
    expect(f.em.findOne).toHaveBeenCalledWith(
      InventoryReservations,
      { id: 'order' },
      expect.objectContaining({ refresh: true, lockMode: expect.anything() }),
    );
  });
});
