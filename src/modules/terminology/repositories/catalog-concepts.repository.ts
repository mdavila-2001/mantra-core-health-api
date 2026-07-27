import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CatalogConcepts } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para materializar un concepto de catálogo. */
export interface CreateCatalogConceptData {
  codeSystemVersionId: string;
  code: string;
  display: string;
  definition?: string;
  stateConceptId?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `terminology.catalog_concepts`.
 *
 * Métodos sin estado que reciben el `EntityManager` activo; la transacción y las
 * reglas de negocio viven en el servicio.
 */
@Injectable()
export class CatalogConceptsRepository {
  /** Busca un concepto por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<CatalogConcepts | null> {
    return em.findOne(CatalogConcepts, { id });
  }

  /**
   * Devuelve los códigos ya presentes en una versión, de entre los indicados. Se
   * consulta en bloque para no emitir una query por código (evita el patrón N+1).
   */
  async findExistingCodes(
    em: EntityManager,
    codeSystemVersionId: string,
    codes: string[],
  ): Promise<Set<string>> {
    if (codes.length === 0) return new Set();
    const rows = await em.find(
      CatalogConcepts,
      { codeSystemVersionId, code: { $in: codes } },
      { fields: ['code'] },
    );
    return new Set(rows.map((row) => row.code));
  }

  /** Crea el concepto en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateCatalogConceptData): CatalogConcepts {
    return em.create(
      CatalogConcepts,
      {
        codeSystemVersionId: data.codeSystemVersionId,
        code: data.code,
        display: data.display,
        definition: data.definition,
        abstract: false,
        selectable: true,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Busca el concepto bloqueando su fila. Retirar un concepto y reemplazarlo
   * compiten por ella, y sin bloqueo dos retiradas simultáneas dejarían un
   * `replaced_by_concept_id` que no corresponde a la que ganó (UC-03-10).
   */
  findByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<CatalogConcepts | null> {
    return em.findOne(
      CatalogConcepts,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Resuelve el concepto por su clave natural `(versión del code system, código)`
   * — la que usa `$lookup` (UC-03-11).
   */
  findByVersionAndCode(
    em: EntityManager,
    codeSystemVersionId: string,
    code: string,
  ): Promise<CatalogConcepts | null> {
    return em.findOne(CatalogConcepts, { codeSystemVersionId, code });
  }

  /**
   * Conceptos de una versión filtrados por estado. Es la base sobre la que la
   * expansión de un value set evalúa sus reglas (UC-03-08).
   */
  findByVersion(
    em: EntityManager,
    codeSystemVersionId: string,
    activeStateConceptId: string,
  ): Promise<CatalogConcepts[]> {
    return em.find(
      CatalogConcepts,
      { codeSystemVersionId, stateConceptId: activeStateConceptId },
      { orderBy: { code: 'ASC' } },
    );
  }
}
