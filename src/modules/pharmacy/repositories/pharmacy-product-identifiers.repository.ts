import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PharmacyProductIdentifiers } from '../entities';

/** Datos para registrar un identificador de producto (UC-24-04). */
export interface CreateIdentifierData {
  pharmacyProductId: string;
  identifierTypeConceptId: string;
  identifierValue: string;
  assigningAuthorityTenantId?: string;
  jurisdictionConceptId?: string;
  validFrom?: Date;
  validTo?: Date;
  actorUserId?: string;
}

/**
 * Acceso a datos de `pharmacy.pharmacy_product_identifiers`.
 *
 * Esta tabla solo tiene `created_at`/`created_by_user_id` (sin `updated_*` ni
 * `row_version`), por eso se fijan explícitamente en lugar de usar `createdBy()`.
 */
@Injectable()
export class PharmacyProductIdentifiersRepository {
  /** Crea el identificador en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateIdentifierData): PharmacyProductIdentifiers {
    return em.create(
      PharmacyProductIdentifiers,
      {
        pharmacyProductId: data.pharmacyProductId,
        identifierTypeConceptId: data.identifierTypeConceptId,
        identifierValue: data.identifierValue,
        assigningAuthorityTenantId: data.assigningAuthorityTenantId,
        jurisdictionConceptId: data.jurisdictionConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
