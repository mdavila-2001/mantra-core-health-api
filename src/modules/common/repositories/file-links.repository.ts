import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FileLinks } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para vincular un archivo a un propietario polimórfico. */
export interface CreateFileLinkData {
  fileId: string;
  ownerTypeConceptId: string;
  ownerId: string;
  linkRoleConceptId: string;
  visibilityConceptId?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `common.file_links`.
 *
 * Repositorio sin estado: recibe el `EntityManager` activo por parámetro.
 */
@Injectable()
export class FileLinksRepository {
  /** Construye la entidad en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateFileLinkData): FileLinks {
    return em.create(
      FileLinks,
      {
        fileId: data.fileId,
        ownerTypeConceptId: data.ownerTypeConceptId,
        ownerId: data.ownerId,
        linkRoleConceptId: data.linkRoleConceptId,
        visibilityConceptId: data.visibilityConceptId,
        ...createdBy(data.actorUserId),
        // `partial: true`: la columna `row_version` (version: true) tiene DEFAULT en
        // BD y la gestiona MikroORM; el tipo la exigiría sin este relajo.
      },
      { partial: true },
    );
  }
}
