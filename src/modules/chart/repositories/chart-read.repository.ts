import { Injectable } from '@nestjs/common';
import type { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { ClinicalNoteHeaders, ClinicalNoteVersions } from '../entities';

/** Criterios de `GET /charts/patients/{patientProfileId}/notes`. */
export interface ListNotesFilter {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
}

/**
 * Lecturas del expediente.
 *
 * El módulo no tenía ninguna: se podían escribir notas, versionarlas, firmarlas
 * y liberarlas, pero no leerlas. Un expediente que sólo se escribe no es un
 * expediente.
 */
@Injectable()
export class ChartReadRepository {
  /**
   * Cabeceras de nota del paciente, de la más reciente a la más antigua.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filter - Criterios de la consulta.
   * @param limit - Tope de resultados.
   * @param offset - Desplazamiento de la página.
   * @returns Resultado conforme al contrato `Promise<ClinicalNoteHeaders[]>`.
   */
  findNoteHeaders(
    em: EntityManager,
    filter: ListNotesFilter,
    limit: number,
    offset: number,
  ): Promise<ClinicalNoteHeaders[]> {
    const where: FilterQuery<ClinicalNoteHeaders> = {
      patientProfileId: filter.patientProfileId,
    };
    if (filter.encounterId) where.encounterId = filter.encounterId;

    return em.find(ClinicalNoteHeaders, where, {
      orderBy: { createdAt: 'desc' },
      limit: limit + 1,
      offset,
    });
  }

  /**
   * Una cabecera de nota por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param noteId - Identificador de la nota.
   * @returns Resultado conforme al contrato `Promise<ClinicalNoteHeaders | null>`.
   */
  findNoteHeaderById(
    em: EntityManager,
    noteId: string,
  ): Promise<ClinicalNoteHeaders | null> {
    return em.findOne(ClinicalNoteHeaders, { id: noteId });
  }

  /**
   * Versiones de las notas indicadas.
   *
   * Se piden en bloque para el listado: una consulta por nota convertiría una
   * lista de veinte notas en veintiuna consultas.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param versionIds - Identificadores de versión a resolver.
   * @returns Resultado conforme al contrato `Promise<ClinicalNoteVersions[]>`.
   */
  findVersionsByIds(
    em: EntityManager,
    versionIds: string[],
  ): Promise<ClinicalNoteVersions[]> {
    if (versionIds.length === 0) return Promise.resolve([]);
    return em.find(ClinicalNoteVersions, { id: { $in: versionIds } });
  }

  /**
   * Todas las versiones de una nota, de la más reciente a la más antigua.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param clinicalNoteId - Identificador de la nota.
   * @returns Resultado conforme al contrato `Promise<ClinicalNoteVersions[]>`.
   */
  findVersionsByNote(
    em: EntityManager,
    clinicalNoteId: string,
  ): Promise<ClinicalNoteVersions[]> {
    return em.find(
      ClinicalNoteVersions,
      { clinicalNoteId },
      { orderBy: { versionNumber: 'desc' } },
    );
  }
}
