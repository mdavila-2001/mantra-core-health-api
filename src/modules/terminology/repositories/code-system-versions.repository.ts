import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CodeSystemVersions } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para materializar una versión de sistema de códigos. */
export interface CreateCodeSystemVersionData {
  codeSystemId: string;
  version: string;
  isDefault?: boolean;
  stateConceptId?: string;
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

  /** Crea la versión en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateCodeSystemVersionData): CodeSystemVersions {
    return em.create(CodeSystemVersions, {
      codeSystemId: data.codeSystemId,
      version: data.version,
      isDefault: data.isDefault,
      stateConceptId: data.stateConceptId,
      ...createdBy(data.actorUserId),
    }, { partial: true });
  }
}
