import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CodeSystemVersions } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para materializar una versión de sistema de códigos. */
export interface CreateCodeSystemVersionData {
  /**
   * Identificador asociado a code system.
   */
  codeSystemId: string;
  /**
   * Valor de version mantenido por la instancia.
   */
  version: string;
  /**
   * Valor de is default mantenido por la instancia.
   */
  isDefault?: boolean;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `terminology.code_system_versions`.
 *
 * Métodos sin estado que reciben el `EntityManager` activo; la transacción y las
 * reglas de negocio viven en el servicio.
 */
@Injectable()
export class CodeSystemVersionsRepository {
  /** Busca una versión por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<CodeSystemVersions | null> {
    return em.findOne(CodeSystemVersions, { id });
  }

  /** Busca una versión concreta dentro de un sistema de códigos; `null` si no existe. */
  findByCodeSystemAndVersion(
    em: EntityManager,
    codeSystemId: string,
    version: string,
  ): Promise<CodeSystemVersions | null> {
    return em.findOne(CodeSystemVersions, { codeSystemId, version });
  }

  /**
   * Versión vigente de un sistema de códigos: la marcada por defecto y activa.
   *
   * Tanto `$lookup` (UC-03-11) como la expansión de un value set (UC-03-08)
   * resuelven códigos contra "la versión del sistema", y esa es por definición la
   * `is_default` publicada. Sin este filtro se resolverían códigos contra
   * borradores todavía no sellados.
   */
  findDefaultActiveVersion(
    em: EntityManager,
    codeSystemId: string,
    activeStateConceptId: string,
  ): Promise<CodeSystemVersions | null> {
    return em.findOne(CodeSystemVersions, {
      codeSystemId,
      isDefault: true,
      stateConceptId: activeStateConceptId,
    });
  }

  /** Crea la versión en la unidad de trabajo (sin flush). */
  create(
    em: EntityManager,
    data: CreateCodeSystemVersionData,
  ): CodeSystemVersions {
    return em.create(
      CodeSystemVersions,
      {
        codeSystemId: data.codeSystemId,
        version: data.version,
        isDefault: data.isDefault,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
