import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticUnitSites } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de alta de un sitio operativo de la unidad (UC-23-01/02). */
export interface CreateSiteData {
  /**
   * Identificador asociado a diagnostic unit.
   */
  diagnosticUnitId: string;
  /**
   * Identificador asociado a practice site.
   */
  practiceSiteId: string;
  /**
   * Identificador asociado a site role concept.
   */
  siteRoleConceptId?: string;
  /**
   * Valor de accession prefix mantenido por la instancia.
   */
  accessionPrefix?: string;
  /**
   * Valor de sample collection available mantenido por la instancia.
   */
  sampleCollectionAvailable?: boolean;
  /**
   * Valor de imaging available mantenido por la instancia.
   */
  imagingAvailable?: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `diagnostic_units.diagnostic_unit_sites`. */
@Injectable()
export class DiagnosticUnitSitesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<DiagnosticUnitSites | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `DiagnosticUnitSites`.
   */
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
