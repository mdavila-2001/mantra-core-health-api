import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Bookmarks } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create bookmark data.
 */
export interface CreateBookmarkData {
  /**
   * Identificador asociado a profile.
   */
  profileId: string;
  /**
   * Identificador asociado a bookmarkable type concept.
   */
  bookmarkableTypeConceptId: string;
  /**
   * Identificador asociado a bookmarkable ref.
   */
  bookmarkableRefId: string;
  /**
   * Valor de collection name mantenido por la instancia.
   */
  collectionName?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `community.bookmarks` (una fila por profile/objeto). */
@Injectable()
export class BookmarksRepository {
  /**
   * Obtiene find by profile target.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param profileId - Identificador de profile.
   * @param bookmarkableTypeConceptId - Identificador de bookmarkable type concept.
   * @param bookmarkableRefId - Identificador de bookmarkable ref.
   * @returns Resultado de find by profile target conforme al contrato `Promise<Bookmarks | null>`.
   */
  findByProfileTarget(
    em: EntityManager,
    profileId: string,
    bookmarkableTypeConceptId: string,
    bookmarkableRefId: string,
  ): Promise<Bookmarks | null> {
    return em.findOne(Bookmarks, {
      profileId,
      bookmarkableTypeConceptId,
      bookmarkableRefId,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Bookmarks`.
   */
  create(em: EntityManager, data: CreateBookmarkData): Bookmarks {
    return em.create(
      Bookmarks,
      {
        profileId: data.profileId,
        bookmarkableTypeConceptId: data.bookmarkableTypeConceptId,
        bookmarkableRefId: data.bookmarkableRefId,
        collectionName: data.collectionName,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
