import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Files } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para dar de alta el agregado archivo (sin su primera versión). */
export interface CreateFileData {
  tenantId: string;
  categoryConceptId: string;
  sensitivityConceptId: string;
  lifecycleStatusConceptId: string;
  originalName?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `common.files`.
 *
 * Repositorio sin estado: recibe el `EntityManager` activo por parámetro. Las
 * mutaciones (promoción de versión, borrado lógico) las realiza el servicio sobre
 * la entidad cargada; aquí solo se ofrece la búsqueda y el alta.
 */
@Injectable()
export class FilesRepository {
  /** Busca un archivo por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<Files | null> {
    return em.findOne(Files, { id });
  }

  /** Construye la entidad en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateFileData): Files {
    return em.create(Files, {
      tenantId: data.tenantId,
      categoryConceptId: data.categoryConceptId,
      originalName: data.originalName,
      sensitivityConceptId: data.sensitivityConceptId,
      lifecycleStatusConceptId: data.lifecycleStatusConceptId,
      ...createdBy(data.actorUserId),
      // `partial: true`: la columna `row_version` (version: true) tiene DEFAULT en
      // BD y la gestiona MikroORM; el tipo la exigiría sin este relajo.
    }, { partial: true });
  }
}
