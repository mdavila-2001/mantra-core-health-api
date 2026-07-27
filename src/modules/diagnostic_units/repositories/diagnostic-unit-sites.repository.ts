import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticUnitSites } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de alta de un sitio operativo de la unidad (UC-23-01/02). */
export interface CreateSiteData {
  diagnosticUnitId: string;
  practiceSiteId: string;
  siteRoleConceptId?: string;
  accessionPrefix?: string;
  sampleCollectionAvailable?: boolean;
  imagingAvailable?: boolean;
  actorUserId?: string;
}

/** Acceso a datos de `diagnostic_units.diagnostic_unit_sites`. */
@Injectable()
export class DiagnosticUnitSitesRepository {
  findById(em: EntityManager, id: string): Promise<DiagnosticUnitSites | null> {
    return em.findOne(DiagnosticUnitSites, { id });
  }

  /** Cuenta sitios ACTIVOS de la unidad (precondición de verify-and-publish). */
  countActiveForUnit(
    em: EntityManager,
    diagnosticUnitId: string,
  ): Promise<number> {
    return em.count(DiagnosticUnitSites, {
      diagnosticUnitId,
      statusConceptId: DUNIT.SITE_ACTIVE,
    });
  }

  create(em: EntityManager, data: CreateSiteData): DiagnosticUnitSites {
    return em.create(
      DiagnosticUnitSites,
      {
        diagnosticUnitId: data.diagnosticUnitId,
        practiceSiteId: data.practiceSiteId,
        siteRoleConceptId: data.siteRoleConceptId ?? DUNIT.SITE_ROLE_PRIMARY,
        accessionPrefix: data.accessionPrefix,
        sampleCollectionAvailable: data.sampleCollectionAvailable,
        imagingAvailable: data.imagingAvailable,
        statusConceptId: DUNIT.SITE_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
