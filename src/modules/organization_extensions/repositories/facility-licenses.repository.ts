import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FacilityLicenses } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar una licencia de instalación (UC-22-05). */
export interface CreateFacilityLicenseData {
  tenantId: string;
  practiceSiteId?: string;
  facilityTypeConceptId: string;
  licenseTypeConceptId: string;
  licenseNumber: string;
  issuingAuthorityTenantId?: string;
  issuingAuthorityName?: string;
  jurisdictionConceptId?: string;
  validFrom?: Date;
  validTo?: Date;
  evidenceFileId?: string;
  verificationStatusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `organization_extensions.facility_licenses`.
 * Stateless: recibe el `EntityManager` activo en cada método.
 */
@Injectable()
export class FacilityLicensesRepository {
  /** Busca una licencia por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<FacilityLicenses | null> {
    return em.findOne(FacilityLicenses, { id });
  }

  /** Detecta un duplicado de número de licencia para (tenant, tipo). */
  findByNumber(
    em: EntityManager,
    tenantId: string,
    licenseTypeConceptId: string,
    licenseNumber: string,
  ): Promise<FacilityLicenses | null> {
    return em.findOne(FacilityLicenses, {
      tenantId,
      licenseTypeConceptId,
      licenseNumber,
    });
  }

  /** Cuenta licencias verificadas de un tenant (guard de activación de hospital). */
  countVerifiedForTenant(
    em: EntityManager,
    tenantId: string,
    verifiedConceptId: string,
  ): Promise<number> {
    return em.count(FacilityLicenses, {
      tenantId,
      verificationStatusConceptId: verifiedConceptId,
    });
  }

  /** Crea la licencia en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateFacilityLicenseData): FacilityLicenses {
    return em.create(
      FacilityLicenses,
      {
        tenantId: data.tenantId,
        practiceSiteId: data.practiceSiteId,
        facilityTypeConceptId: data.facilityTypeConceptId,
        licenseTypeConceptId: data.licenseTypeConceptId,
        licenseNumber: data.licenseNumber,
        issuingAuthorityTenantId: data.issuingAuthorityTenantId,
        issuingAuthorityName: data.issuingAuthorityName,
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
