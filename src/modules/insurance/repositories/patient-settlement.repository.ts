import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ConflictException } from '../../../common';
import { ServiceRequests } from '../../clinical/entities';
import { DiagnosticStudyOfferings } from '../../diagnostic_units/entities';
import { PharmacyProducts } from '../../pharmacy/entities';
import {
  InventoryReservationLines,
  InventoryReservations,
} from '../../pharmacy_inventory/entities';
import { PINV } from '../../pharmacy_inventory/pharmacy_inventory.concepts';
import { CatalogConcepts } from '../../terminology/entities';
import {
  ClaimAdjudicationVersions,
  ClaimLineAdjudications,
  ClaimReversals,
  InsuranceCarriers,
  InsuranceClaimLines,
  InsuranceClaims,
  InsurancePlans,
  InsuranceProducts,
  PatientCoverages,
  PatientExplanationsOfBenefit,
} from '../entities';
import { INS } from '../insurance.concepts';

export type SettlementOrigin = 'PHARMACY' | 'DIAGNOSTIC';
const unique = (ids: (string | undefined)[]) => [
  ...new Set(ids.filter((id): id is string => !!id)),
];

/** Lotes acotados al titular y al conjunto de pedidos autorizado. */
@Injectable()
export class PatientSettlementRepository {
  async ownedOrders(
    em: EntityManager,
    patientProfileId: string,
    origin: SettlementOrigin,
    ids: readonly string[],
  ) {
    if (!ids.length) return [];
    if (origin === 'PHARMACY') {
      const orders = await em.find(InventoryReservations, {
        id: { $in: [...ids] },
        patientProfileId,
      });
      return orders
        .filter(
          (order) =>
            ![
              PINV.ORDER_CANCELADO,
              PINV.ORDER_RECHAZADO,
              PINV.ORDER_VENCIDO,
            ].includes(order.reservationStatusConceptId),
        )
        .map((order) => order.id);
    }
    const orders = await em.find(ServiceRequests, {
      id: { $in: [...ids] },
      patientProfileId,
    });
    // El estado clínico se resuelve por catálogo, sin asumir IDs de otro módulo.
    const statuses = await em.find(CatalogConcepts, {
      id: { $in: unique(orders.map((order) => order.statusConceptId)) },
    });
    const cancelled = new Set(
      statuses
        .filter((status) =>
          /(?:CANCEL|REVOK|ENTERED_IN_ERROR)/i.test(status.code),
        )
        .map((status) => status.id),
    );
    return orders
      .filter((order) => !cancelled.has(order.statusConceptId))
      .map((order) => order.id);
  }

  async load(
    em: EntityManager,
    patientProfileId: string,
    origin: SettlementOrigin,
    orderIds: string[],
  ) {
    const coverages = await em.find(PatientCoverages, { patientProfileId });
    const claims = coverages.length
      ? await em.find(InsuranceClaims, {
          patientCoverageId: { $in: coverages.map((coverage) => coverage.id) },
          ...(origin === 'PHARMACY'
            ? { inventoryReservationId: { $in: orderIds } }
            : { serviceRequestId: { $in: orderIds } }),
        })
      : [];
    const claimIds = claims.map((claim) => claim.id);
    const [lines, versions, eobs, reversals, plans, carriers] =
      await Promise.all([
        em.find(InsuranceClaimLines, { insuranceClaimId: { $in: claimIds } }),
        em.find(ClaimAdjudicationVersions, {
          insuranceClaimId: { $in: claimIds },
        }),
        em.find(PatientExplanationsOfBenefit, {
          insuranceClaimId: { $in: claimIds },
          patientProfileId,
        }),
        em.find(ClaimReversals, { insuranceClaimId: { $in: claimIds } }),
        em.find(InsurancePlans, {
          id: {
            $in: unique(coverages.map((coverage) => coverage.insurancePlanId)),
          },
        }),
        em.find(InsuranceCarriers, {
          id: { $in: unique(claims.map((claim) => claim.insuranceCarrierId)) },
        }),
      ]);
    const [adjudications, products, concepts, reservationLines, offerings] =
      await Promise.all([
        em.find(ClaimLineAdjudications, {
          claimAdjudicationVersionId: {
            $in: versions.map((version) => version.id),
          },
        }),
        em.find(InsuranceProducts, {
          id: { $in: unique(plans.map((plan) => plan.insuranceProductId)) },
        }),
        em.find(CatalogConcepts, {
          id: {
            $in: unique([
              ...claims.map((claim) => claim.currencyConceptId),
              ...lines.map((line) => line.serviceConceptId),
            ]),
          },
        }),
        em.find(InventoryReservationLines, {
          id: {
            $in: unique(lines.map((line) => line.inventoryReservationLineId)),
          },
        }),
        em.find(DiagnosticStudyOfferings, {
          id: {
            $in: unique(lines.map((line) => line.diagnosticStudyOfferingId)),
          },
        }),
      ]);
    const pharmacyProducts = await em.find(PharmacyProducts, {
      id: {
        $in: unique(reservationLines.map((line) => line.pharmacyProductId)),
      },
    });
    const productNames = new Map(
      pharmacyProducts.map((product) => [
        product.id,
        product.brandName ?? product.genericName,
      ]),
    );
    const itemNames = new Map<string, string>();
    for (const line of reservationLines) {
      const name = productNames.get(line.pharmacyProductId);
      if (name) itemNames.set(line.id, name);
    }
    for (const offering of offerings)
      itemNames.set(offering.id, offering.displayName);
    for (const concept of concepts) itemNames.set(concept.id, concept.display);
    return {
      claims,
      coverages,
      lines,
      versions,
      eobs,
      reversals,
      plans,
      carriers,
      products,
      concepts,
      adjudications,
      itemNames,
    };
  }

  /** El llamador ya bloqueó el pedido; la consulta no accede a pólizas ni EOB. */
  async activeClaimForDispensation(
    em: EntityManager,
    orderId: string,
  ): Promise<string | undefined> {
    const claims = await em.find(InsuranceClaims, {
      inventoryReservationId: orderId,
      statusConceptId: { $ne: INS.CLAIM_REVERSED },
    });
    if (claims.length > 1)
      throw new ConflictException(
        'El pedido tiene reclamos activos contradictorios',
      );
    return claims[0]?.id;
  }
}

export type PatientSettlementBatch = Awaited<
  ReturnType<PatientSettlementRepository['load']>
>;
