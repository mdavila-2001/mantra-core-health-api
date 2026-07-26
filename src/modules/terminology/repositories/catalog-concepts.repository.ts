import { Injectable } from '@nestjs/common';
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
    return em.create(CatalogConcepts, {
      codeSystemVersionId: data.codeSystemVersionId,
      code: data.code,
      display: data.display,
      definition: data.definition,
      abstract: false,
      selectable: true,
      stateConceptId: data.stateConceptId,
      ...createdBy(data.actorUserId),
    }, { partial: true });
  }
}
