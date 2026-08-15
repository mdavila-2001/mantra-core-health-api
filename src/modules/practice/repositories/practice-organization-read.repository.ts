import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { findPractitionerNames } from '../../profiles/read/practitioner-names';
import { CatalogConcepts } from '../../terminology/entities';
import {
  CareSpaces,
  ClinicalUnits,
  HealthcareServices,
  InventoryItems,
  PracticeAccreditations,
  PracticeSites,
  PractitionerRoleAssignments,
} from '../entities';

/**
 * Consultas que componen la consola de organización médica (CARRIL 13).
 *
 * Va en un repositorio aparte —y no repartido entre los seis repositorios de
 * escritura del módulo— por el mismo motivo que `DiagnosticUnitsReadRepository`
 * en M23: la consola pide **todo el árbol de una práctica de una vez**, y esas
 * consultas son por lote (`$in` sobre las sedes) mientras que las de escritura
 * son de a una fila. Mezclarlas obligaría a cada repositorio de comando a
 * cargar con una firma que su caso de uso no necesita.
 *
 * Ninguna consulta filtra por estado: la consola administra también lo
 * retirado, lo suspendido y lo vencido. Ocultarlo dejaría al administrador sin
 * ver por qué una sede dejó de aparecer en las pantallas de atención.
 */
@Injectable()
export class PracticeOrganizationReadRepository {
  /** Sedes de la práctica, activas y retiradas, por código. */
  findSites(em: EntityManager, practiceId: string): Promise<PracticeSites[]> {
    return em.find(PracticeSites, { practiceId }, { orderBy: { code: 'ASC' } });
  }

  /** Unidades clínicas (áreas y sub-áreas) de un lote de sedes. */
  findClinicalUnits(
    em: EntityManager,
    siteIds: readonly string[],
  ): Promise<ClinicalUnits[]> {
    if (siteIds.length === 0) return Promise.resolve([]);
    return em.find(
      ClinicalUnits,
      { practiceSiteId: { $in: [...siteIds] } },
      { orderBy: { code: 'ASC' } },
    );
  }

  /** Espacios de atención (quirófanos, consultorios, boxes) de un lote de sedes. */
  findCareSpaces(
    em: EntityManager,
    siteIds: readonly string[],
  ): Promise<CareSpaces[]> {
    if (siteIds.length === 0) return Promise.resolve([]);
    return em.find(
      CareSpaces,
      { practiceSiteId: { $in: [...siteIds] } },
      { orderBy: { code: 'ASC' } },
    );
  }

  /**
   * Servicios de salud de la práctica.
   *
   * Se pide por `practice_id` y no por sede: la tabla admite servicios sin sede
   * —los que la organización ofrece de forma transversal— y filtrar por el lote
   * de sedes los perdería en silencio.
   */
  findHealthcareServices(
    em: EntityManager,
    practiceId: string,
  ): Promise<HealthcareServices[]> {
    return em.find(
      HealthcareServices,
      { practiceId },
      { orderBy: { createdAt: 'ASC' } },
    );
  }

  /** Asignaciones de rol: la plantilla profesional de la práctica. */
  findRoleAssignments(
    em: EntityManager,
    practiceId: string,
  ): Promise<PractitionerRoleAssignments[]> {
    return em.find(
      PractitionerRoleAssignments,
      { practiceId },
      { orderBy: { validFrom: 'DESC', createdAt: 'DESC' } },
    );
  }

  /** Acreditaciones y documentación legal, la que vence primero adelante. */
  findAccreditations(
    em: EntityManager,
    practiceId: string,
  ): Promise<PracticeAccreditations[]> {
    return em.find(
      PracticeAccreditations,
      { practiceId },
      { orderBy: { validTo: 'ASC', createdAt: 'ASC' } },
    );
  }

  /** Insumos y equipamiento registrados en la práctica. */
  findInventoryItems(
    em: EntityManager,
    practiceId: string,
  ): Promise<InventoryItems[]> {
    return em.find(
      InventoryItems,
      { practiceId },
      { orderBy: { name: 'ASC' } },
    );
  }

  /**
   * Nombre legible de cada profesional de la plantilla.
   *
   * `practitioner_role_assignments` sólo guarda el uuid del perfil, y una
   * plantilla que muestra uuids no se puede administrar. Los dos saltos hasta
   * la persona los resuelve `profiles/read/practitioner-names`, compartido con
   * el personal del laboratorio (C16) para no tener dos versiones del mismo
   * recorrido.
   *
   * @returns `profileId` → nombre para mostrar, sin las filas que no lo tienen.
   */
  findPractitionerNames(
    em: EntityManager,
    profileIds: readonly string[],
  ): Promise<Map<string, string>> {
    return findPractitionerNames(em, profileIds);
  }

  /** Conceptos de terminología del lote, para traducir los `*_concept_id`. */
  findConcepts(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<CatalogConcepts[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(CatalogConcepts, { id: { $in: [...ids] } });
  }
}
