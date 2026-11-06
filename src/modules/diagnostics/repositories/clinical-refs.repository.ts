import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Encounters,
  ObservationReferenceRanges,
  Observations,
  ServiceRequests,
} from '../../clinical/entities';
import { Files } from '../../common/entities';
import { CatalogConcepts } from '../../terminology/entities';

/**
 * Lectura de los recursos de otros dominios a los que `diagnostics` apunta por
 * UUID (encuentro, orden, observación y archivo), para poder comprobar que
 * pertenecen al tenant activo antes de enlazarlos.
 *
 * Clase sin estado que recibe el `EntityManager` por parámetro, igual que
 * `DiagnosticOrdersRepository`: no duplica ninguna fuente de verdad.
 */
@Injectable()
export class ClinicalRefsRepository {
  /** Encuentro por id, sin acotar: el llamador compara su tenant. */
  findEncounter(em: EntityManager, id: string): Promise<Encounters | null> {
    return em.findOne(Encounters, { id });
  }

  /** Orden de servicio por id, sin acotar: el llamador compara su tenant. */
  findServiceRequest(
    em: EntityManager,
    id: string,
  ): Promise<ServiceRequests | null> {
    return em.findOne(ServiceRequests, { id });
  }

  /** Observación por id, sin acotar: el llamador compara su tenant. */
  findObservation(em: EntityManager, id: string): Promise<Observations | null> {
    return em.findOne(Observations, { id });
  }

  /** Archivo por id, sin acotar: el llamador compara su tenant. */
  findFile(em: EntityManager, id: string): Promise<Files | null> {
    return em.findOne(Files, { id });
  }

  /**
   * Observaciones por id, en lote. Sin acotar: el llamador ya decidió que
   * cuelgan de un informe que puede leer.
   */
  findObservations(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Observations[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(Observations, { id: { $in: [...new Set(ids)] } });
  }

  /**
   * Rangos de referencia de un conjunto de observaciones, del más viejo al
   * más nuevo.
   */
  findReferenceRanges(
    em: EntityManager,
    observationIds: readonly string[],
  ): Promise<ObservationReferenceRanges[]> {
    if (observationIds.length === 0) return Promise.resolve([]);
    return em.find(
      ObservationReferenceRanges,
      { observationId: { $in: [...new Set(observationIds)] } },
      { orderBy: { createdAt: 'ASC' } },
    );
  }

  /** Archivos por id, en lote, para nombrarlos. */
  findFiles(em: EntityManager, ids: readonly string[]): Promise<Files[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(Files, { id: { $in: [...new Set(ids)] } });
  }

  /** Código y rótulo de cada concepto, en lote. */
  async findConceptLabels(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Map<string, { code: string; display: string }>> {
    if (ids.length === 0) return new Map();
    const rows = await em.find(CatalogConcepts, {
      id: { $in: [...new Set(ids)] },
    });
    return new Map(
      rows.map((row) => [row.id, { code: row.code, display: row.display }]),
    );
  }
}
