import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Comments } from '../entities';
import { createdBy } from '../../../common';

export interface CreateCommentData {
  tenantId?: string;
  authorProfileId: string;
  commentableTypeConceptId: string;
  commentableRefId: string;
  parentCommentId?: string;
  rootCommentId?: string;
  threadDepth: number;
  bodyText: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `community.comments` (hilos anidados con contadores). */
@Injectable()
export class CommentsRepository {
  findById(em: EntityManager, id: string): Promise<Comments | null> {
    return em.findOne(Comments, { id });
  }

  create(em: EntityManager, data: CreateCommentData): Comments {
    return em.create(
      Comments,
      {
        tenantId: data.tenantId,
        authorProfileId: data.authorProfileId,
        commentableTypeConceptId: data.commentableTypeConceptId,
        commentableRefId: data.commentableRefId,
        parentCommentId: data.parentCommentId,
        rootCommentId: data.rootCommentId,
        threadDepth: data.threadDepth,
        bodyText: data.bodyText,
        replyCount: 0,
        reactionCount: 0,
        isEdited: false,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
