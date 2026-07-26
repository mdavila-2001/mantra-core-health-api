import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Bookmarks } from '../entities';
import { createdBy } from '../../../common';

export interface CreateBookmarkData {
  profileId: string;
  bookmarkableTypeConceptId: string;
  bookmarkableRefId: string;
  collectionName?: string;
  actorUserId?: string;
}

/** Acceso a datos de `community.bookmarks` (una fila por profile/objeto). */
@Injectable()
export class BookmarksRepository {
  findByProfileTarget(
    em: EntityManager,
    profileId: string,
    bookmarkableTypeConceptId: string,
    bookmarkableRefId: string,
  ): Promise<Bookmarks | null> {
    return em.findOne(Bookmarks, { profileId, bookmarkableTypeConceptId, bookmarkableRefId });
  }

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
