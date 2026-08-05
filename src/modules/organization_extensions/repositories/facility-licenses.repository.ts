import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FacilityLicenses } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar una licencia de instalación (UC-22-05). */
export interface CreateFacilityLicenseData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a practice site.
   */
  practiceSiteId?: string;
  /**
   * Identificador asociado a facility type concept.
   */
  facilityTypeConceptId: string;
  /**
   * Identificador asociado a license type concept.
   */
  licenseTypeConceptId: string;
  /**
   * Valor de license number mantenido por la instancia.
   */
  licenseNumber: string;
  /**
   * Identificador asociado a issuing authority tenant.
   */
  issuingAuthorityTenantId?: string;
  /**
   * Valor de issuing authority name mantenido por la instancia.
   */
  issuingAuthorityName?: string;
  /**
   * Identificador asociado a jurisdiction concept.
   */
  jurisdictionConceptId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a evidence file.
   */
  evidenceFileId?: string;
  /**
   * Identificador asociado a verification status concept.
   */
  verificationStatusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
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
