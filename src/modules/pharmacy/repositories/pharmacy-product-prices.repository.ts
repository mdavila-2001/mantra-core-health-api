import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PharmacyProductPrices } from '../entities';

/** Datos para insertar una nueva versión de precio (UC-24-06). */
export interface CreatePriceData {
  /**
   * Identificador asociado a pharmacy price list.
   */
  pharmacyPriceListId: string;
  /**
   * Identificador asociado a pharmacy product.
   */
  pharmacyProductId: string;
  /**
   * Valor de version number mantenido por la instancia.
   */
  versionNumber: number;
  /**
   * Valor de unit amount mantenido por la instancia.
   */
  unitAmount: string;
  /**
   * Valor de tax amount mantenido por la instancia.
   */
  taxAmount?: string;
  /**
   * Valor de patient amount mantenido por la instancia.
   */
  patientAmount?: string;
  /**
   * Valor de insurer amount mantenido por la instancia.
   */
  insurerAmount?: string;
  /**
   * Valor de minimum quantity mantenido por la instancia.
   */
  minimumQuantity?: string;
  /**
   * Valor de effective from mantenido por la instancia.
   */
  effectiveFrom: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de recorded at mantenido por la instancia.
   */
  recordedAt: Date;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/**
 * Acceso a datos de `pharmacy.pharmacy_product_prices` (entidad VERSIONED).
 *
 * No tiene `created_at`/`updated_at`/`row_version`: el versionado se modela con
 * `version_number`, `effective_from`/`effective_to` y `recorded_at`.
 */
@Injectable()
export class PharmacyProductPricesRepository {
  /** Devuelve el mayor `version_number` para el par (lista, producto); 0 si no hay. */
  async maxVersionNumber(
    em: EntityManager,
    priceListId: string,
    productId: string,
  ): Promise<number> {
    const rows = await em.find(
      PharmacyProductPrices,
      { pharmacyPriceListId: priceListId, pharmacyProductId: productId },
      {
        fields: ['versionNumber'],
        orderBy: { versionNumber: 'desc' },
        limit: 1,
      },
    );
    return rows.length ? rows[0].versionNumber : 0;
  }

  /** Versiones vigentes (ACTIVE) del par (lista, producto). */
  findActiveByListAndProduct(
    em: EntityManager,
    priceListId: string,
    productId: string,
    activeConceptId: string,
  ): Promise<PharmacyProductPrices[]> {
    return em.find(PharmacyProductPrices, {
      pharmacyPriceListId: priceListId,
      pharmacyProductId: productId,
      statusConceptId: activeConceptId,
    });
  }

  /** Versiones vigentes (ACTIVE) de todos los productos de un producto dado. */
  findActiveByProduct(
    em: EntityManager,
    productId: string,
    activeConceptId: string,
  ): Promise<PharmacyProductPrices[]> {
    return em.find(PharmacyProductPrices, {
      pharmacyProductId: productId,
      statusConceptId: activeConceptId,
    });
  }

  /** Versiones vigentes (ACTIVE) de toda una lista de precios. */
  findActiveByList(
    em: EntityManager,
    priceListId: string,
    activeConceptId: string,
  ): Promise<PharmacyProductPrices[]> {
    return em.find(PharmacyProductPrices, {
      pharmacyPriceListId: priceListId,
      statusConceptId: activeConceptId,
    });
  }

  /** Crea la nueva versión de precio en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreatePriceData): PharmacyProductPrices {
    return em.create(
      PharmacyProductPrices,
      {
        pharmacyPriceListId: data.pharmacyPriceListId,
        pharmacyProductId: data.pharmacyProductId,
        versionNumber: data.versionNumber,
        unitAmount: data.unitAmount,
        taxAmount: data.taxAmount,
        patientAmount: data.patientAmount,
        insurerAmount: data.insurerAmount,
        minimumQuantity: data.minimumQuantity,
        effectiveFrom: data.effectiveFrom,
        statusConceptId: data.statusConceptId,
        recordedAt: data.recordedAt,
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }
}
