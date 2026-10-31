import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { SecurityEvents, Users } from '../../iam/entities';
import { AUTHZ_GOVERNANCE } from '../authz-governance.concepts';
import { AuthzGovernanceErrorReason as Reason } from '../authz-governance.error-reasons';
import type {
  AccessReviewDecision,
  AccessReviewDto,
  AccessReviewDuePageDto,
  RecordAccessReviewDto,
  UserAccessReviewsDto,
} from '../dto/authz-governance.dto';
import { UserRoleAssignments } from '../entities';

/** Tope de usuarios de la cola de revisión: una cola infinita no se revisa. */
export const ACCESS_REVIEW_DUE_LIMIT = 200;
export const ACCESS_REVIEW_HISTORY_LIMIT = 50;
const DAY_MS = 86_400_000;

interface ReviewDetail {
  readonly decision?: AccessReviewDecision;
  readonly reason?: string;
  readonly assignmentIds?: readonly string[];
}

/**
 * Revisión periódica de accesos de las cuentas internas. Quien revisa certifica que las
 * asignaciones de rol activas de una persona siguen siendo las que debe tener, o deja asentado que
 * hay que cambiarlas. El registro (quién, cuándo, qué asignaciones, por qué) es un evento de
 * `iam.security_events` y no se edita ni se borra.
 *
 * Revisar no cambia ningún acceso: si hay que quitar un rol se usa la revocación de siempre, que
 * deja su propio rastro. Nadie revisa sus propios accesos.
 */
@Injectable()
export class AuthzAccessReviewsService {
  constructor(private readonly em: EntityManager) {}

  async record(
    userId: string,
    dto: RecordAccessReviewDto,
    actor: AuthenticatedUser,
  ): Promise<AccessReviewDto> {
    if (actor.id === userId)
      throw new PreconditionFailedException(
        'Nadie revisa sus propios accesos',
        { userId },
        Reason.ACCESS_REVIEW_SELF_REVIEW,
      );
    return this.em.transactional(async (tx) => {
      const user = await tx.findOne(Users, { id: userId });
      if (!user)
        throw new ResourceNotFoundException(
          'Usuario no encontrado',
          { userId },
          Reason.ACCESS_REVIEW_USER_NOT_FOUND,
        );
      const ids = [...new Set(dto.assignmentIds)];
      if (ids.length > 0) {
        const found = await tx.count(UserRoleAssignments, {
          id: { $in: ids },
          userId,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
        });
        if (found !== ids.length)
          throw new PreconditionFailedException(
            'Alguna asignación citada no es de esa persona o ya no está activa',
            { userId },
            Reason.ACCESS_REVIEW_ASSIGNMENT_MISMATCH,
          );
      }
      const now = new Date();
      const event = tx.create(
        SecurityEvents,
        {
          eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_ACCESS_REVIEWED,
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
          userId,
          detailJson: {
            decision: dto.decision,
            reason: dto.reason,
            assignmentIds: ids,
          } satisfies ReviewDetail,
          recordedByUserId: actor.id,
          recordedAt: now,
        },
        { partial: true },
      );
      await tx.flush();
      return this.view(event);
    });
  }

  async historyOf(userId: string): Promise<UserAccessReviewsDto> {
    const user = await this.em.findOne(Users, { id: userId });
    if (!user)
      throw new ResourceNotFoundException(
        'Usuario no encontrado',
        { userId },
        Reason.ACCESS_REVIEW_USER_NOT_FOUND,
      );
    const rows = await this.em.find(
      SecurityEvents,
      { userId, eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_ACCESS_REVIEWED },
      {
        orderBy: { recordedAt: 'DESC' },
        limit: ACCESS_REVIEW_HISTORY_LIMIT,
      },
    );
    return { userId, items: rows.map((r) => this.view(r)) };
  }

  /**
   * Quiénes tienen asignaciones activas y no se revisaron en los últimos `olderThanDays` días (o
   * nunca). Sin `olderThanDays` se listan todos con la fecha de su última revisión: la cadencia es
   * una decisión de quien gobierna, no un número de esta API.
   */
  async due(olderThanDays?: number): Promise<AccessReviewDuePageDto> {
    const active = await this.em.find(
      UserRoleAssignments,
      { statusConceptId: CONCEPTS.STATE_ACTIVE },
      { fields: ['userId'] },
    );
    const perUser = new Map<string, number>();
    for (const a of active) perUser.set(a.userId, (perUser.get(a.userId) ?? 0) + 1);
    const userIds = [...perUser.keys()];
    if (userIds.length === 0)
      return { items: [], olderThanDays: olderThanDays ?? null };

    const [users, reviews] = await Promise.all([
      this.em.find(Users, { id: { $in: userIds } }, { fields: ['id', 'displayName'] }),
      this.em.find(
        SecurityEvents,
        {
          userId: { $in: userIds },
          eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_ACCESS_REVIEWED,
        },
        { orderBy: { recordedAt: 'DESC' }, fields: ['userId', 'recordedAt'] },
      ),
    ]);
    const lastReview = new Map<string, Date>();
    for (const r of reviews)
      if (r.userId && !lastReview.has(r.userId)) lastReview.set(r.userId, r.recordedAt);

    const limit =
      olderThanDays === undefined ? null : Date.now() - olderThanDays * DAY_MS;
    const items = users
      .map((u) => ({
        userId: u.id,
        displayName: u.displayName,
        activeAssignments: perUser.get(u.id) ?? 0,
        lastReviewedAt: lastReview.get(u.id) ?? null,
      }))
      .filter(
        (i) =>
          limit === null ||
          i.lastReviewedAt === null ||
          i.lastReviewedAt.getTime() < limit,
      )
      // Primero quienes nunca se revisaron, luego los más antiguos.
      .sort(
        (a, b) =>
          (a.lastReviewedAt?.getTime() ?? 0) -
            (b.lastReviewedAt?.getTime() ?? 0) ||
          a.displayName.localeCompare(b.displayName, 'es'),
      )
      .slice(0, ACCESS_REVIEW_DUE_LIMIT);
    return { items, olderThanDays: olderThanDays ?? null };
  }

  private view(event: SecurityEvents): AccessReviewDto {
    const detail = (event.detailJson ?? {}) as ReviewDetail;
    return {
      id: event.id,
      userId: event.userId as string,
      decision: detail.decision ?? 'CHANGES_REQUIRED',
      reason: detail.reason ?? '',
      assignmentIds: [...(detail.assignmentIds ?? [])],
      reviewerUserId: event.recordedByUserId ?? null,
      reviewedAt: event.recordedAt,
    };
  }
}
