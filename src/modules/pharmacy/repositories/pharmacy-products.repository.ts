import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PharmacyProducts } from '../entities';
import { createdBy } from '../../../common';

/** Datos para publicar un producto de catálogo (UC-24-04). */
export interface CreateProductData {
  /**
   * Identificador asociado a pharmacy.
   */
  pharmacyId: string;
  /**
   * Valor de product code mantenido por la instancia.
   */
  productCode: string;
  /**
   * Identificador asociado a medication concept.
   */
  medicationConceptId?: string;
  /**
   * Identificador asociado a inventory item concept.
   */
  inventoryItemConceptId?: string;
  /**
   * Identificador asociado a manufacturer tenant.
   */
  manufacturerTenantId?: string;
  /**
   * Valor de brand name mantenido por la instancia.
   */
  brandName?: string;
  /**
   * Valor de generic name mantenido por la instancia.
   */
  genericName?: string;
  /**
   * Valor de strength text mantenido por la instancia.
   */
  strengthText?: string;
  /**
   * Identificador asociado a dosage form concept.
   */
  dosageFormConceptId?: string;
  /**
   * Valor de package size text mantenido por la instancia.
   */
  packageSizeText?: string;
  /**
   * Valor de requires prescription mantenido por la instancia.
   */
  requiresPrescription?: boolean;
  /**
   * Valor de cold chain required mantenido por la instancia.
   */
  coldChainRequired?: boolean;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy.pharmacy_products`. */
@Injectable()
export class PharmacyProductsRepository {
  /** Busca un producto por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<PharmacyProducts | null> {
    return em.findOne(PharmacyProducts, { id });
  }

  /** Busca un producto por (pharmacy, product_code) para validar unicidad. */
  findByPharmacyAndCode(
    em: EntityManager,
    pharmacyId: string,
    productCode: string,
  ): Promise<PharmacyProducts | null> {
    return em.findOne(PharmacyProducts, { pharmacyId, productCode });
  }

  /** Lista los productos con un estado dado (para proyección de catálogo). */
  findByPharmacyAndStatus(
    em: EntityManager,
    pharmacyId: string,
    statusConceptId: string,
  ): Promise<PharmacyProducts[]> {
    return em.find(PharmacyProducts, { pharmacyId, statusConceptId });
  }

  /** Crea el producto en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateProductData): PharmacyProducts {
    return em.create(
      PharmacyProducts,
      {
        pharmacyId: data.pharmacyId,
        productCode: data.productCode,
        medicationConceptId: data.medicationConceptId,
        inventoryItemConceptId: data.inventoryItemConceptId,
        manufacturerTenantId: data.manufacturerTenantId,
        brandName: data.brandName,
        genericName: data.genericName,
        strengthText: data.strengthText,
        dosageFormConceptId: data.dosageFormConceptId,
        packageSizeText: data.packageSizeText,
        requiresPrescription: data.requiresPrescription,
        coldChainRequired: data.coldChainRequired,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
