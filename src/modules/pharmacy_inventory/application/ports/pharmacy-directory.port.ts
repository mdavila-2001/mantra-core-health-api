import type { UnitOfWork } from './unit-of-work';

export interface PharmacySnapshot {
  readonly id: string;
  readonly tenantId: string;
  readonly legalName: string;
  readonly tradeName?: string;
}

export interface PharmacySiteSnapshot {
  readonly id: string;
  readonly pharmacyId: string;
  readonly practiceSiteId: string;
  readonly name: string;
  readonly pickupAvailable?: boolean;
  readonly homeDeliveryAvailable?: boolean;
}

export interface PharmacyProductSnapshot {
  readonly id: string;
  readonly pharmacyId: string;
  readonly productCode: string;
  readonly brandName?: string;
  readonly genericName?: string;
  readonly strengthText?: string;
  readonly packageSizeText?: string;
  readonly medicationConceptId?: string;
  readonly requiresPrescription?: boolean;
  /** Conteo del catálogo de toda la farmacia; sin él, «hay» sin conteo. */
  readonly stockQuantity?: number | null;
}

export interface PharmacyPriceListSnapshot {
  readonly id: string;
  readonly code: string;
  readonly pharmacySiteId?: string;
  readonly insurerTenantId?: string;
  readonly currencyConceptId?: string;
}

export interface PharmacyProductPriceSnapshot {
  readonly pharmacyProductId: string;
  readonly pharmacyPriceListId: string;
  readonly unitAmount: string;
  readonly patientAmount?: string;
}

export interface PharmacyConceptSnapshot {
  readonly id: string;
  readonly code: string;
  readonly display: string;
}

export interface PracticeSiteSnapshot {
  readonly id: string;
  readonly addressId?: string;
}

export interface PharmacyAddressSnapshot {
  readonly id: string;
  readonly lines?: string;
  readonly city?: string;
  readonly postalCode?: string;
  readonly latitude?: string;
  readonly longitude?: string;
}

/** Lecturas del contexto pharmacy necesarias para inventario y pedidos. */
export interface PharmacyDirectoryPort {
  findVisibleByTenant(
    uow: UnitOfWork,
    tenantId: string | undefined,
  ): Promise<PharmacySnapshot[]>;
  findVisibleById(
    uow: UnitOfWork,
    tenantId: string | undefined,
    id: string,
  ): Promise<PharmacySnapshot | null>;
  findActiveSites(
    uow: UnitOfWork,
    pharmacyIds: readonly string[],
  ): Promise<PharmacySiteSnapshot[]>;
  findActiveSiteById(
    uow: UnitOfWork,
    siteId: string,
  ): Promise<PharmacySiteSnapshot | null>;
  findActiveProductsByIds(
    uow: UnitOfWork,
    ids: readonly string[],
  ): Promise<PharmacyProductSnapshot[]>;
  /** Publicados y vendibles hoy: sin el «no tengo» del catálogo (P47). */
  findSellableProductsByIds(
    uow: UnitOfWork,
    ids: readonly string[],
  ): Promise<PharmacyProductSnapshot[]>;
  findCurrentPublicPriceLists(
    uow: UnitOfWork,
    pharmacyIds: readonly string[],
    now: Date,
  ): Promise<PharmacyPriceListSnapshot[]>;
  findCurrentPrices(
    uow: UnitOfWork,
    priceListIds: readonly string[],
    productIds: readonly string[] | undefined,
    now: Date,
  ): Promise<PharmacyProductPriceSnapshot[]>;
  findPracticeSites(
    uow: UnitOfWork,
    ids: readonly string[],
  ): Promise<PracticeSiteSnapshot[]>;
  findAddresses(
    uow: UnitOfWork,
    ids: readonly string[],
  ): Promise<PharmacyAddressSnapshot[]>;
  findConcepts(
    uow: UnitOfWork,
    ids: readonly string[],
  ): Promise<PharmacyConceptSnapshot[]>;
}

/** Token de inyección de lecturas del directorio de farmacias. */
export const PHARMACY_DIRECTORY_PORT = Symbol('PHARMACY_DIRECTORY_PORT');
