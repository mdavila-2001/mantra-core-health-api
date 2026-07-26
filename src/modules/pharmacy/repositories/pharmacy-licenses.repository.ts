import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PharmacyLicenses } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar una licencia de farmacia (UC-24-01). */
export interface CreateLicenseData {
  pharmacyId: string;
  pharmacySiteId?: string;
  licenseTypeConceptId: string;
  licenseNumber: string;
  issuingAuthorityTenantId?: string;
  jurisdictionConceptId?: string;
  validFrom?: Date;
  validTo?: Date;
  evidenceFileId?: string;
  verificationStatusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy.pharmacy_licenses`. */
@Injectable()
export class PharmacyLicensesRepository {
  /** Busca una licencia por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<PharmacyLicenses | null> {
    return em.findOne(PharmacyLicenses, { id });
  }

  /** Cuenta las licencias de una farmacia que aún no están verificadas. */
  countUnverified(em: EntityManager, pharmacyId: string, verifiedConceptId: string): Promise<number> {
    return em.count(PharmacyLicenses, {
      pharmacyId,
      verificationStatusConceptId: { $ne: verifiedConceptId },
    });
  }

  /** Crea la licencia en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateLicenseData): PharmacyLicenses {
    return em.create(
      PharmacyLicenses,
      {
        pharmacyId: data.pharmacyId,
        pharmacySiteId: data.pharmacySiteId,
        licenseTypeConceptId: data.licenseTypeConceptId,
        licenseNumber: data.licenseNumber,
        issuingAuthorityTenantId: data.issuingAuthorityTenantId,
        jurisdictionConceptId: data.jurisdictionConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        evidenceFileId: data.evidenceFileId,
        verificationStatusConceptId: data.verificationStatusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
