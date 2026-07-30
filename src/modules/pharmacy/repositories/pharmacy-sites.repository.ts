import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PharmacySites } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar una sede dispensadora (UC-24-02). */
export interface CreateSiteData {
  /**
   * Identificador asociado a pharmacy.
   */
  pharmacyId: string;
  /**
   * Identificador asociado a practice site.
   */
  practiceSiteId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a pharmacy site type concept.
   */
  pharmacySiteTypeConceptId?: string;
  /**
   * Identificador asociado a dispensing mode concept.
   */
  dispensingModeConceptId?: string;
  /**
   * Identificador asociado a controlled substance capability concept.
   */
  controlledSubstanceCapabilityConceptId?: string;
  /**
   * Valor de home delivery available mantenido por la instancia.
   */
  homeDeliveryAvailable?: boolean;
  /**
   * Valor de pickup available mantenido por la instancia.
   */
  pickupAvailable?: boolean;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy.pharmacy_sites`. */
@Injectable()
export class PharmacySitesRepository {
  /** Busca una sede por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<PharmacySites | null> {
    return em.findOne(PharmacySites, { id });
  }

  /** Busca una sede por (pharmacy, code) para validar unicidad. */
  findByPharmacyAndCode(
    em: EntityManager,
    pharmacyId: string,
    code: string,
  ): Promise<PharmacySites | null> {
    return em.findOne(PharmacySites, { pharmacyId, code });
  }

  /** Crea la sede en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateSiteData): PharmacySites {
    return em.create(
      PharmacySites,
      {
        pharmacyId: data.pharmacyId,
        practiceSiteId: data.practiceSiteId,
        code: data.code,
        name: data.name,
        pharmacySiteTypeConceptId: data.pharmacySiteTypeConceptId,
        dispensingModeConceptId: data.dispensingModeConceptId,
        controlledSubstanceCapabilityConceptId:
          data.controlledSubstanceCapabilityConceptId,
        homeDeliveryAvailable: data.homeDeliveryAvailable,
        pickupAvailable: data.pickupAvailable,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
