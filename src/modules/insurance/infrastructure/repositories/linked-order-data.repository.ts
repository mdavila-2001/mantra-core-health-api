import { Injectable } from '@nestjs/common';
import { LockMode, type EntityManager } from '@mikro-orm/postgresql';
import { ServiceRequests } from '../../../clinical/entities';
import {
  DiagnosticStudyOfferings,
  DiagnosticUnits,
} from '../../../diagnostic_units/entities';
import { Pharmacies, PharmacyProducts } from '../../../pharmacy/entities';
import {
  InventoryReservations,
  InventoryReservationLines,
  PharmacyOrderSubstitutions,
} from '../../../pharmacy_inventory/entities';

export interface LinkedPharmacyOrderRow {
  readonly id: string;
  readonly pharmacyId: string;
  readonly patientProfileId?: string | null;
  readonly medicationRequestId?: string | null;
  readonly reservationStatusConceptId: string;
  readonly confirmedAt?: Date | null;
  readonly expiresAt: Date;
  readonly totalAmount?: string;
  readonly currencyConceptId?: string;
}

export interface LinkedReservationLineRow {
  readonly id: string;
  readonly inventoryReservationId: string;
  readonly statusConceptId: string;
  readonly unitPriceAmount?: string;
  readonly reservedQuantity?: string;
  readonly currencyConceptId?: string | null;
  readonly pharmacyProductId: string;
  readonly fulfilledQuantity?: string | null;
}

export interface LinkedServiceRequestRow {
  readonly id: string;
  readonly patientProfileId: string;
  readonly performerTenantId?: string;
  readonly codeConceptId: string;
  readonly statusConceptId: string;
}

export interface LinkedOfferingRow {
  readonly id: string;
  readonly diagnosticUnitId: string;
  readonly studyConceptId: string;
}

export interface LinkedProviderRow {
  readonly id: string;
  readonly tenantId: string;
}

export interface LinkedProductRow {
  readonly id: string;
  readonly medicationConceptId?: string | null;
}

@Injectable()
export class LinkedOrderDataRepository {
  lockPharmacyOrder(em: EntityManager, id: string): Promise<unknown> {
    return em.findOne(
      InventoryReservations,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
    );
  }

  lockServiceRequest(em: EntityManager, id: string): Promise<unknown> {
    return em.findOne(
      ServiceRequests,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
    );
  }

  findPharmacyOrders(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<LinkedPharmacyOrderRow[]> {
    return em.find(
      InventoryReservations,
      { id: { $in: [...ids] } },
      { refresh: true },
    );
  }

  findReservationLines(
    em: EntityManager,
    ids: readonly string[],
    statusConceptIds: readonly string[],
  ): Promise<LinkedReservationLineRow[]> {
    return em.find(
      InventoryReservationLines,
      {
        inventoryReservationId: { $in: [...ids] },
        statusConceptId: { $in: [...statusConceptIds] },
      },
      { refresh: true },
    );
  }

  findProposedSubstitutions(
    em: EntityManager,
    ids: readonly string[],
    statusConceptId: string,
  ): Promise<{ inventoryReservationId: string }[]> {
    return em.find(PharmacyOrderSubstitutions, {
      inventoryReservationId: { $in: [...ids] },
      statusConceptId,
    });
  }

  findServiceRequests(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<LinkedServiceRequestRow[]> {
    return em.find(
      ServiceRequests,
      { id: { $in: [...ids] } },
      { refresh: true },
    );
  }

  findOfferings(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<LinkedOfferingRow[]> {
    return em.find(DiagnosticStudyOfferings, { id: { $in: [...ids] } });
  }

  findDiagnosticUnits(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<LinkedProviderRow[]> {
    return em.find(DiagnosticUnits, { id: { $in: [...ids] } });
  }

  findPharmacies(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<LinkedProviderRow[]> {
    return em.find(Pharmacies, { id: { $in: [...ids] } });
  }

  findProducts(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<LinkedProductRow[]> {
    return em.find(PharmacyProducts, { id: { $in: [...ids] } });
  }
}
