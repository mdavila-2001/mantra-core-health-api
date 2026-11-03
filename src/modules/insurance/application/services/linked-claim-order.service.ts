import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  sumarDecimales,
  mismosDecimales,
  multiplyDecimalsToMoney,
} from '../../../../common';
import { CLIN } from '../../../clinical/clinical.concepts';
import { PINV } from '../../../pharmacy_inventory/domain/pharmacy_inventory.concepts';
import { InsuranceClaimLines, type InsuranceClaims } from '../../entities';
import { INS } from '../../domain/insurance.concepts';
import {
  LinkedOrderDataRepository,
  type LinkedOfferingRow,
  type LinkedPharmacyOrderRow,
  type LinkedProductRow,
  type LinkedProviderRow,
  type LinkedReservationLineRow,
  type LinkedServiceRequestRow,
} from '../../infrastructure/repositories/linked-order-data.repository';
import {
  type LinkedOrderLine,
  type LinkedOrderSnapshot,
  requireNonNegativeAmount,
} from './linked-claim-validation';

export interface LinkedOrderInput {
  inventoryReservationId?: string | null;
  serviceRequestId?: string | null;
  billingProviderEntityId: string;
  currencyConceptId?: string | null;
  lines: readonly LinkedOrderLine[];
}
type OrderInputWithId = LinkedOrderInput & { id: string };

/** Resolución canónica en lotes; los comandos bloquean antes el pedido. */
@Injectable()
export class LinkedClaimOrderService {
  constructor(private readonly repository: LinkedOrderDataRepository) {}

  async lockAndResolve(
    em: EntityManager,
    input: LinkedOrderInput,
  ): Promise<LinkedOrderSnapshot | null> {
    this.assertSingleOrigin(input);
    if (input.inventoryReservationId) {
      await this.repository.lockPharmacyOrder(em, input.inventoryReservationId);
    } else if (input.serviceRequestId) {
      await this.repository.lockServiceRequest(em, input.serviceRequestId);
    }
    return this.loadSnapshot(em, input);
  }

  async loadSnapshot(
    em: EntityManager,
    input: LinkedOrderInput,
  ): Promise<LinkedOrderSnapshot | null> {
    const result = await this.resolveBatch(em, [{ ...input, id: 'single' }]);
    return result.get('single') ?? null;
  }

  async loadSnapshots(
    em: EntityManager,
    claims: readonly InsuranceClaims[],
    existingLines?: readonly InsuranceClaimLines[],
  ): Promise<Map<string, LinkedOrderSnapshot | null>> {
    if (!claims.length) return new Map();
    const lines =
      existingLines ??
      (await em.find(InsuranceClaimLines, {
        insuranceClaimId: { $in: claims.map((claim) => claim.id) },
      }));
    const byClaim = new Map<string, InsuranceClaimLines[]>();
    for (const line of lines) {
      const group = byClaim.get(line.insuranceClaimId) ?? [];
      group.push(line);
      byClaim.set(line.insuranceClaimId, group);
    }
    return this.resolveBatch(
      em,
      claims.map((claim) => ({ ...claim, lines: byClaim.get(claim.id) ?? [] })),
    );
  }

  private assertSingleOrigin(input: LinkedOrderInput): void {
    if (input.inventoryReservationId && input.serviceRequestId) {
      throw new PreconditionFailedException(
        'Un reclamo sólo puede representar un pedido',
      );
    }
  }

  private async resolveBatch(
    em: EntityManager,
    inputs: readonly OrderInputWithId[],
  ): Promise<Map<string, LinkedOrderSnapshot | null>> {
    const pharmacyIds = inputs.flatMap((input) =>
      input.inventoryReservationId ? [input.inventoryReservationId] : [],
    );
    const diagnosticIds = inputs.flatMap((input) =>
      input.serviceRequestId ? [input.serviceRequestId] : [],
    );
    const offeringIds = inputs.flatMap((input) =>
      input.lines.flatMap((line) =>
        line.diagnosticStudyOfferingId ? [line.diagnosticStudyOfferingId] : [],
      ),
    );
    const [orders, portions, proposals, diagnosticOrders, offerings, units] =
      await Promise.all([
        pharmacyIds.length
          ? this.repository.findPharmacyOrders(em, pharmacyIds)
          : [],
        pharmacyIds.length
          ? this.repository.findReservationLines(em, pharmacyIds, [
              PINV.RES_LINE_CONFIRMED,
              PINV.RES_LINE_FULFILLED,
            ])
          : [],
        pharmacyIds.length
          ? this.repository.findProposedSubstitutions(
              em,
              pharmacyIds,
              PINV.SUBSTITUTION_PROPUESTA,
            )
          : [],
        diagnosticIds.length
          ? this.repository.findServiceRequests(em, diagnosticIds)
          : [],
        offeringIds.length
          ? this.repository.findOfferings(em, offeringIds)
          : [],
        diagnosticIds.length
          ? this.repository.findDiagnosticUnits(
              em,
              inputs
                .filter((input) => input.serviceRequestId)
                .map((input) => input.billingProviderEntityId),
            )
          : [],
      ]);
    const [pharmacies, products] = await Promise.all([
      orders.length
        ? this.repository.findPharmacies(
            em,
            orders.map((order) => order.pharmacyId),
          )
        : [],
      portions.length
        ? this.repository.findProducts(
            em,
            portions.map((line) => line.pharmacyProductId),
          )
        : [],
    ]);
    const orderById = new Map(orders.map((row) => [row.id, row]));
    const pharmacyById = new Map(pharmacies.map((row) => [row.id, row]));
    const productById = new Map(products.map((row) => [row.id, row]));
    const diagnosticById = new Map(
      diagnosticOrders.map((row) => [row.id, row]),
    );
    const offeringById = new Map(offerings.map((row) => [row.id, row]));
    const unitById = new Map(units.map((row) => [row.id, row]));
    const pendingOrders = new Set(
      proposals.map((row) => row.inventoryReservationId),
    );
    const portionsByOrder = new Map<string, LinkedReservationLineRow[]>();
    for (const line of portions) {
      const group = portionsByOrder.get(line.inventoryReservationId) ?? [];
      group.push(line);
      portionsByOrder.set(line.inventoryReservationId, group);
    }
    const result = new Map<string, LinkedOrderSnapshot | null>();
    for (const input of inputs) {
      let snapshot: LinkedOrderSnapshot | null = null;
      if (input.inventoryReservationId && !input.serviceRequestId) {
        const order = orderById.get(input.inventoryReservationId);
        const pharmacy = order ? pharmacyById.get(order.pharmacyId) : undefined;
        if (order?.patientProfileId && pharmacy) {
          snapshot = pharmacySnapshot(
            order,
            pharmacy,
            portionsByOrder.get(order.id) ?? [],
            productById,
            pendingOrders.has(order.id),
          );
        }
      } else if (input.serviceRequestId && !input.inventoryReservationId) {
        const order = diagnosticById.get(input.serviceRequestId);
        const unit = unitById.get(input.billingProviderEntityId);
        const offering = offeringById.get(
          input.lines[0]?.diagnosticStudyOfferingId ?? '',
        );
        if (order && unit && offering)
          snapshot = diagnosticSnapshot(input, order, unit, offering);
      }
      result.set(input.id, snapshot);
    }
    return result;
  }
}

function pharmacySnapshot(
  order: LinkedPharmacyOrderRow,
  pharmacy: LinkedProviderRow,
  portions: readonly LinkedReservationLineRow[],
  products: ReadonlyMap<string, LinkedProductRow>,
  pending: boolean,
): LinkedOrderSnapshot {
  const validStatus = [
    PINV.ORDER_CONFIRMADO,
    PINV.ORDER_ACEPTADO,
    PINV.ORDER_LISTO_PARA_RETIRO,
    PINV.ORDER_RETIRADO,
  ].includes(order.reservationStatusConceptId);
  const withinPickupPeriod =
    order.reservationStatusConceptId === PINV.ORDER_RETIRADO ||
    order.expiresAt > new Date();
  let valid =
    validStatus &&
    Boolean(order.confirmedAt) &&
    withinPickupPeriod &&
    !pending &&
    portions.length > 0;
  const lines = portions.map((line): LinkedOrderLine => {
    try {
      requireNonNegativeAmount(line.unitPriceAmount);
      requireNonNegativeAmount(line.reservedQuantity);
      if (mismosDecimales(line.reservedQuantity, '0')) valid = false;
    } catch (error) {
      if (!(error instanceof PreconditionFailedException)) throw error;
      valid = false;
    }
    if (
      !line.currencyConceptId ||
      line.currencyConceptId !== order.currencyConceptId ||
      !products.has(line.pharmacyProductId)
    )
      valid = false;
    return {
      inventoryReservationLineId: line.id,
      serviceConceptId: products.get(line.pharmacyProductId)
        ?.medicationConceptId,
      quantity: line.reservedQuantity,
      billedAmount:
        line.unitPriceAmount && line.reservedQuantity
          ? multiplyDecimalsToMoney(line.unitPriceAmount, line.reservedQuantity)
          : undefined,
    };
  });
  if (
    !mismosDecimales(
      order.totalAmount,
      sumarDecimales(lines.map((line) => line.billedAmount)),
    )
  )
    valid = false;
  return {
    origin: 'PHARMACY',
    orderId: order.id,
    medicationRequestId: order.medicationRequestId,
    patientProfileId: order.patientProfileId!,
    providerTenantId: pharmacy.tenantId,
    billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PHARMACY,
    billingProviderEntityId: pharmacy.id,
    currencyConceptId: order.currencyConceptId,
    totalAmount: order.totalAmount,
    validForSettlement: valid,
    canSubmit:
      valid &&
      order.reservationStatusConceptId !== PINV.ORDER_RETIRADO &&
      portions.every((line) =>
        mismosDecimales(line.fulfilledQuantity ?? '0', '0'),
      ),
    lines,
  };
}

function diagnosticSnapshot(
  input: LinkedOrderInput,
  order: LinkedServiceRequestRow,
  unit: LinkedProviderRow,
  offering: LinkedOfferingRow,
): LinkedOrderSnapshot {
  const line = input.lines[0];
  // Antiduplicación de estudios (subtarea 3.2, T-26): una orden que nació
  // `SR_SATISFIED_BY_PRIOR` (reutilizó un informe previo, sin justificación
  // del médico) NO está en esta lista y por lo tanto nunca es `valid` — no
  // hace falta excluirla a mano, sólo dejar constancia de por qué.
  const valid =
    input.lines.length === 1 &&
    !line.inventoryReservationLineId &&
    unit.tenantId === order.performerTenantId &&
    offering.diagnosticUnitId === unit.id &&
    offering.studyConceptId === order.codeConceptId &&
    [CLIN.SERVICE_REQUEST_ACTIVE, CLIN.SERVICE_REQUEST_COMPLETED].includes(
      order.statusConceptId,
    );
  return {
    origin: 'DIAGNOSTIC',
    orderId: order.id,
    patientProfileId: order.patientProfileId,
    providerTenantId: unit.tenantId,
    billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_DIAGNOSTIC_UNIT,
    billingProviderEntityId: unit.id,
    currencyConceptId: input.currencyConceptId,
    totalAmount: line.billedAmount,
    validForSettlement: valid,
    canSubmit: valid && order.statusConceptId === CLIN.SERVICE_REQUEST_ACTIVE,
    lines: [
      {
        diagnosticStudyOfferingId: offering.id,
        serviceConceptId: order.codeConceptId,
        quantity: '1',
        billedAmount: line.billedAmount,
      },
    ],
  };
}
