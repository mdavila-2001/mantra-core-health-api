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
import {
  assertTargetActionable,
  nonActionableUserIds,
  resolveGovernanceScope,
  userBelongsToTenant,
} from './authz-user-lifecycle.service';

/** Tope de usuarios de la cola de revisión: una cola infinita no se revisa. */
export const ACCESS_REVIEW_DUE_LIMIT = 200;
export const ACCESS_REVIEW_HISTORY_LIMIT = 50;
/**
 * Con alcance, el historial se filtra por el tenant sellado en el evento y el tope se aplica
 * después: se leen hasta tantas filas del usuario para que los eventos de otros tenants no
 * desplacen a los propios fuera de la página.
 */
const SCOPED_HISTORY_SCAN_LIMIT = 1000;
const DAY_MS = 86_400_000;

interface ReviewDetail {
  readonly decision?: AccessReviewDecision;
  readonly reason?: string;
  readonly assignmentIds?: readonly string[];
  /** Tenant del actor con alcance que revisó; `null`/ausente = revisión de plataforma. */
  readonly tenantId?: string | null;
}

/**
 * Revisión periódica de accesos de las cuentas internas. Quien revisa certifica que las
 * asignaciones de rol activas de una persona siguen siendo las que debe tener, o deja asentado que
 * hay que cambiarlas. El registro (quién, cuándo, qué asignaciones, por qué) es un evento de
 * `iam.security_events` y no se edita ni se borra.
 *
 * Revisar no cambia ningún acceso: si hay que quitar un rol se usa la revocación de siempre, que
 * deja su propio rastro. Nadie revisa sus propios accesos.
 *
 * **Alcance de tenant.** Un actor de plataforma ve y revisa todas las cuentas. Un actor con alcance
 * sólo la cola, el historial y la revisión de las cuentas de SU organización, y sólo de las
 * asignaciones de su tenant: el evento se sella con el tenant del revisor y el historial y la fecha
 * de «última revisión» sólo cuentan eventos de ese mismo tenant. Una cuenta ajena responde el 404
 * de una inexistente. Nadie que no sea `SUPERADMIN` revisa a un `SUPERADMIN` ni lo ve en la cola, y con alcance tampoco a un administrador de plataforma.
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
    const scope = resolveGovernanceScope(actor);
    return this.em.transactional(async (tx) => {
      const user = await tx.findOne(Users, { id: userId });
      if (!user || !(await this.inScope(tx, userId, scope)))
        throw this.notFound(userId);
      await assertTargetActionable(tx, userId, actor, scope);
      const ids = [...new Set(dto.assignmentIds)];
      if (ids.length > 0) {
        const found = await tx.count(UserRoleAssignments, {
          id: { $in: ids },
          userId,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          // Con alcance, sólo se pueden citar asignaciones de la propia organización.
          ...(scope !== undefined ? { tenantId: scope } : {}),
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
            tenantId: scope ?? null,
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

  async historyOf(
    userId: string,
    actor: AuthenticatedUser,
  ): Promise<UserAccessReviewsDto> {
    const scope = resolveGovernanceScope(actor);
    const user = await this.em.findOne(Users, { id: userId });
    if (!user || !(await this.inScope(this.em, userId, scope)))
      throw this.notFound(userId);
    const rows = await this.em.find(
      SecurityEvents,
      { userId, eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_ACCESS_REVIEWED },
      {
        orderBy: { recordedAt: 'DESC' },
        limit:
          scope === undefined
            ? ACCESS_REVIEW_HISTORY_LIMIT
            : SCOPED_HISTORY_SCAN_LIMIT,
      },
    );
    const visible = rows
      .filter((r) => this.isVisibleIn(r, scope))
      .slice(0, ACCESS_REVIEW_HISTORY_LIMIT);
    return { userId, items: visible.map((r) => this.view(r)) };
  }

  /**
   * Quiénes tienen asignaciones activas y no se revisaron en los últimos `olderThanDays` días (o
   * nunca). Sin `olderThanDays` se listan todos con la fecha de su última revisión: la cadencia es
   * una decisión de quien gobierna, no un número de esta API.
   */
  async due(
    actor: AuthenticatedUser,
    olderThanDays?: number,
  ): Promise<AccessReviewDuePageDto> {
    const scope = resolveGovernanceScope(actor);
    const active = await this.em.find(
      UserRoleAssignments,
      {
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        // Con alcance, la cola es sólo de las asignaciones de su tenant (las globales, no).
        ...(scope !== undefined ? { tenantId: scope } : {}),
      },
      { fields: ['userId'] },
    );
    const perUser = new Map<string, number>();
    for (const a of active)
      perUser.set(a.userId, (perUser.get(a.userId) ?? 0) + 1);
    // Tampoco se ofrece en la cola a quien este actor no puede revisar (SUPERADMIN; y, con
    // alcance, un administrador de plataforma).
    for (const id of await nonActionableUserIds(
      this.em,
      [...perUser.keys()],
      actor,
      scope,
    ))
      perUser.delete(id);
    const userIds = [...perUser.keys()];
    if (userIds.length === 0)
      return { items: [], olderThanDays: olderThanDays ?? null };

    const [users, reviews] = await Promise.all([
      this.em.find(
        Users,
        { id: { $in: userIds } },
        { fields: ['id', 'displayName'] },
      ),
      this.em.find(
        SecurityEvents,
        {
          userId: { $in: userIds },
          eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_ACCESS_REVIEWED,
        },
        {
          orderBy: { recordedAt: 'DESC' },
          fields: ['userId', 'recordedAt', 'detailJson'],
        },
      ),
    ]);
    const lastReview = new Map<string, Date>();
    for (const r of reviews)
      if (r.userId && this.isVisibleIn(r, scope) && !lastReview.has(r.userId))
        lastReview.set(r.userId, r.recordedAt);

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

  private async inScope(
    em: EntityManager,
    userId: string,
    scope: string | undefined,
  ): Promise<boolean> {
    return scope === undefined || userBelongsToTenant(em, userId, scope);
  }

  /**
   * Una revisión es visible para la plataforma siempre y para un actor con alcance sólo si se selló
   * con su tenant. Una revisión sin sello (anterior a este control o de plataforma) no se le
   * muestra: ante la duda no se divulga.
   */
  private isVisibleIn(
    event: { detailJson?: unknown },
    scope: string | undefined,
  ): boolean {
    if (scope === undefined) return true;
    return (
      (event.detailJson as ReviewDetail | null | undefined)?.tenantId === scope
    );
  }

  private notFound(userId: string) {
    return new ResourceNotFoundException(
      'Usuario no encontrado',
      { userId },
      Reason.ACCESS_REVIEW_USER_NOT_FOUND,
    );
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
