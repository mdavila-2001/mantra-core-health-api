import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PharmacyPriceLists } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una lista de precios (UC-24-05). */
export interface CreatePriceListData {
  /**
   * Identificador asociado a pharmacy.
   */
  pharmacyId: string;
  /**
   * Identificador asociado a pharmacy site.
   */
  pharmacySiteId?: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Identificador asociado a price list type concept.
   */
  priceListTypeConceptId: string;
  /**
   * Identificador asociado a insurer tenant.
   */
  insurerTenantId?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Valor de public visibility mantenido por la instancia.
   */
  publicVisibility?: boolean;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy.pharmacy_price_lists`. */
@Injectable()
export class PharmacyPriceListsRepository {
  /** Busca una lista de precios por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<PharmacyPriceLists | null> {
    return em.findOne(PharmacyPriceLists, { id });
  }

  /** Busca una lista por (pharmacy, code) para validar unicidad. */
  findByPharmacyAndCode(
    em: EntityManager,
    pharmacyId: string,
    code: string,
  ): Promise<PharmacyPriceLists | null> {
    return em.findOne(PharmacyPriceLists, { pharmacyId, code });
  }

  /** Crea la lista de precios en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreatePriceListData): PharmacyPriceLists {
    return em.create(
      PharmacyPriceLists,
      {
        pharmacyId: data.pharmacyId,
        pharmacySiteId: data.pharmacySiteId,
        code: data.code,
        priceListTypeConceptId: data.priceListTypeConceptId,
        insurerTenantId: data.insurerTenantId,
        currencyConceptId: data.currencyConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        publicVisibility: data.publicVisibility,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
