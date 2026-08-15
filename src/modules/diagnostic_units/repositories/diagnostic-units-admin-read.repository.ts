import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PracticeSites,
  PractitionerRoleAssignments,
} from '../../practice/entities';
import { findPractitionerNames } from '../../profiles/read/practitioner-names';
import { CatalogConcepts } from '../../terminology/entities';
import {
  DiagnosticEquipment,
  DiagnosticPriceSchedules,
  DiagnosticStudyOfferings,
  DiagnosticStudyPrices,
  DiagnosticUnitAccreditations,
  DiagnosticUnitPractitionerAssignments,
  DiagnosticUnitSites,
  DiagnosticUnits,
} from '../entities';

/**
 * Consultas de la consola de administración del laboratorio (CARRIL 16).
 *
 * ## En qué se diferencia de `DiagnosticUnitsReadRepository`
 *
 * Aquélla sirve el **directorio público**: filtra a unidades activas y
 * verificadas, ofertas activas y cronogramas marcados como públicos. Es lo
 * correcto para un paciente que elige dónde hacerse un análisis, y es
 * exactamente lo que **no** sirve para administrar: quien administra necesita
 * ver el borrador que todavía no publicó, la oferta que retiró, el cronograma
 * interno de una aseguradora y la acreditación que se le venció — que son
 * justamente las filas que el directorio esconde.
 *
 * Por eso ninguna consulta de aquí filtra por estado, y la unidad se busca sólo
 * por tenant: la verificación es un dato que la consola muestra, no una
 * condición para verla.
 *
 * El personal tampoco aparece en el directorio —no es información de vitrina—
 * y aquí sí: es la mitad del carril.
 */
@Injectable()
export class DiagnosticUnitsAdminReadRepository {
  /** Todas las unidades del tenant, publicadas o no, por nombre. */
  findByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<DiagnosticUnits[]> {
    return em.find(DiagnosticUnits, { tenantId }, { orderBy: { name: 'ASC' } });
  }

  /**
   * Una unidad del tenant, en cualquier estado.
   *
   * Una unidad de otro tenant devuelve `null`, y quien llama la trata como
   * inexistente: el 404 no puede distinguir «no existe» de «no es tuya» sin
   * convertirse en un detector de identificadores ajenos.
   */
  findById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<DiagnosticUnits | null> {
    return em.findOne(DiagnosticUnits, { id, tenantId });
  }

  /** Sedes del lote de unidades, activas y retiradas. */
  findSites(
    em: EntityManager,
    unitIds: readonly string[],
  ): Promise<DiagnosticUnitSites[]> {
    if (unitIds.length === 0) return Promise.resolve([]);
    return em.find(
      DiagnosticUnitSites,
      { diagnosticUnitId: { $in: [...unitIds] } },
      { orderBy: { createdAt: 'ASC' } },
    );
  }

  /** Equipamiento instalado en un lote de sedes. */
  findEquipment(
    em: EntityManager,
    siteIds: readonly string[],
  ): Promise<DiagnosticEquipment[]> {
    if (siteIds.length === 0) return Promise.resolve([]);
    return em.find(
      DiagnosticEquipment,
      { diagnosticUnitSiteId: { $in: [...siteIds] } },
      { orderBy: { manufacturer: 'ASC', model: 'ASC' } },
    );
  }

  /** Catálogo de estudios del lote, incluidos borradores y retirados. */
  findOfferings(
    em: EntityManager,
    unitIds: readonly string[],
  ): Promise<DiagnosticStudyOfferings[]> {
    if (unitIds.length === 0) return Promise.resolve([]);
    return em.find(
      DiagnosticStudyOfferings,
      { diagnosticUnitId: { $in: [...unitIds] } },
      { orderBy: { displayName: 'ASC' } },
    );
  }

  /** Cronogramas de precios de la unidad, públicos e internos. */
  findPriceSchedules(
    em: EntityManager,
    unitId: string,
  ): Promise<DiagnosticPriceSchedules[]> {
    return em.find(
      DiagnosticPriceSchedules,
      { diagnosticUnitId: unitId },
      { orderBy: { code: 'ASC' } },
    );
  }

  /** Precios de un lote de cronogramas, con su historial de versiones. */
  findPrices(
    em: EntityManager,
    scheduleIds: readonly string[],
  ): Promise<DiagnosticStudyPrices[]> {
    if (scheduleIds.length === 0) return Promise.resolve([]);
    return em.find(
      DiagnosticStudyPrices,
      { priceScheduleId: { $in: [...scheduleIds] } },
      { orderBy: { effectiveFrom: 'DESC', versionNumber: 'DESC' } },
    );
  }

  /** Acreditaciones de la unidad, vigentes y vencidas. */
  findAccreditations(
    em: EntityManager,
    unitId: string,
  ): Promise<DiagnosticUnitAccreditations[]> {
    return em.find(
      DiagnosticUnitAccreditations,
      { diagnosticUnitId: unitId },
      { orderBy: { validTo: 'ASC', createdAt: 'ASC' } },
    );
  }

  /** Personal asignado a la unidad: bioquímicos, patólogos, técnicos. */
  findPractitionerAssignments(
    em: EntityManager,
    unitId: string,
  ): Promise<DiagnosticUnitPractitionerAssignments[]> {
    return em.find(
      DiagnosticUnitPractitionerAssignments,
      { diagnosticUnitId: unitId },
      { orderBy: { validFrom: 'DESC', createdAt: 'DESC' } },
    );
  }

  /**
   * Las asignaciones de rol de `practice` que respaldan al personal.
   *
   * `diagnostic_unit_practitioner_assignments` no guarda el perfil del
   * profesional sino la asignación de rol que lo vincula a la práctica; el
   * perfil —y con él el nombre— está un salto más allá.
   */
  findRoleAssignments(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<PractitionerRoleAssignments[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(PractitionerRoleAssignments, { id: { $in: [...ids] } });
  }

  /** Sedes de `practice` que dan nombre y código a las sedes del laboratorio. */
  findPracticeSites(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<PracticeSites[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(PracticeSites, { id: { $in: [...ids] } });
  }

  /** Nombre de cada profesional, por el mismo camino que usa C13. */
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
