import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  RefreshTokens,
  SecurityEvents,
  Sessions,
  Users,
} from '../../iam/entities';
import {
  AUTHZ_GOVERNANCE,
  LIFECYCLE_EVENT_CONCEPTS,
} from '../authz-governance.concepts';
import { AuthzGovernanceErrorReason as Reason } from '../authz-governance.error-reasons';
import type {
  LifecycleActionDto,
  LifecycleEventDto,
  LifecycleResultDto,
  UserLifecycleDto,
  UserLifecycleState,
} from '../dto/authz-governance.dto';
import { UserRoleAssignments } from '../entities';

const KIND_BY_EVENT: Readonly<Record<string, LifecycleEventDto['kind']>> = {
  [AUTHZ_GOVERNANCE.EVENT_USER_SUSPENDED]: 'SUSPENDED',
  [AUTHZ_GOVERNANCE.EVENT_USER_REACTIVATED]: 'REACTIVATED',
  [AUTHZ_GOVERNANCE.EVENT_USER_OFFBOARDED]: 'OFFBOARDED',
};

/** Cuántos eventos del historial se devuelven: el reciente alcanza para auditar y no crece sin tope. */
export const LIFECYCLE_HISTORY_LIMIT = 50;

export const OFFBOARD_NOTE =
  'Las sesiones abiertas se cortaron y los roles de authz se revocaron. Los roles globales de iam (si los hay) no se tocan: con la cuenta bloqueada no autorizan nada.';

/**
 * Ciclo de vida de una cuenta interna: suspender, reactivar y dar de baja.
 *
 * - **Suspender**: `ACTIVE → LOCKED`, corta las sesiones. Reversible.
 * - **Reactivar**: `LOCKED → ACTIVE`, sólo si la cuenta quedó así por una suspensión de este
 *   servicio. Una baja no se reactiva aquí, y un bloqueo por intentos fallidos tampoco.
 * - **Baja**: bloquea la cuenta, corta las sesiones y revoca todas las asignaciones de rol activas.
 *   Reactivar después no devuelve los roles: hay que asignarlos de nuevo, con su propio rastro.
 *
 * La precondición va **en la escritura**: el `UPDATE` incluye el estado de partida, así que dos
 * administradores que piden lo mismo a la vez no pisan el resultado del otro; el segundo recibe 409.
 * El motivo, el actor y el instante quedan en `iam.security_events` y de ahí sale el historial.
 *
 * No hay estado `SUSPENDED` ni `OFFBOARDED` en `iam.users`: ambos se guardan como `LOCKED` y se
 * distinguen por el último evento de ciclo de vida. Un concepto propio sería más limpio, pero exige
 * tocar el catálogo compartido de estados de usuario.
 */
@Injectable()
export class AuthzUserLifecycleService {
  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzUserLifecycleService.name);
  }

  async lifecycleOf(userId: string): Promise<UserLifecycleDto> {
    const user = await this.em.findOne(Users, { id: userId });
    if (!user) throw this.notFound(userId);
    const history = await this.history(this.em, userId);
    return {
      userId,
      state: this.stateOf(user.statusConceptId, history),
      history,
    };
  }

  suspend(
    userId: string,
    dto: LifecycleActionDto,
    actor: AuthenticatedUser,
  ): Promise<LifecycleResultDto> {
    return this.act('suspend', userId, dto, actor);
  }

  reactivate(
    userId: string,
    dto: LifecycleActionDto,
    actor: AuthenticatedUser,
  ): Promise<LifecycleResultDto> {
    return this.act('reactivate', userId, dto, actor);
  }

  offboard(
    userId: string,
    dto: LifecycleActionDto,
    actor: AuthenticatedUser,
  ): Promise<LifecycleResultDto> {
    return this.act('offboard', userId, dto, actor);
  }

  private async act(
    action: 'suspend' | 'reactivate' | 'offboard',
    userId: string,
    dto: LifecycleActionDto,
    actor: AuthenticatedUser,
  ): Promise<LifecycleResultDto> {
    this.logger.info(
      { operation: `authz.user-lifecycle.${action}`, userId, actorId: actor.id },
      'User lifecycle action',
    );
    if (action !== 'reactivate' && actor.id === userId) {
      throw new PreconditionFailedException(
        'Nadie puede suspenderse ni darse de baja a sí mismo',
        { userId },
        Reason.USER_LIFECYCLE_SELF_ACTION,
      );
    }
    return this.em.transactional(async (tx) => {
      const user = await tx.findOne(Users, { id: userId });
      if (!user) throw this.notFound(userId);
      if (user.statusConceptId === CONCEPTS.USER_ANONYMIZED)
        throw this.anonymized(userId);
      const history = await this.history(tx, userId);
      const state = this.stateOf(user.statusConceptId, history);

      // Estado de partida permitido y estados de destino, por acción.
      const from: string[] =
        action === 'suspend'
          ? [CONCEPTS.USER_ACTIVE]
          : action === 'reactivate'
            ? [CONCEPTS.USER_LOCKED]
            : [CONCEPTS.USER_ACTIVE, CONCEPTS.USER_LOCKED];
      const to =
        action === 'reactivate' ? CONCEPTS.USER_ACTIVE : CONCEPTS.USER_LOCKED;
      if (action === 'reactivate' && state === 'OFFBOARDED')
        throw this.conflict(
          'La cuenta se dio de baja: no se reactiva, hay que volver a darla de alta y asignar los roles',
          userId,
          state,
          Reason.USER_LIFECYCLE_ALREADY_OFFBOARDED,
        );
      if (action === 'reactivate' && state !== 'SUSPENDED')
        throw this.conflict(
          'La cuenta no está suspendida',
          userId,
          state,
          Reason.USER_LIFECYCLE_NOT_SUSPENDED,
        );
      if (action === 'offboard' && state === 'OFFBOARDED')
        throw this.conflict(
          'La cuenta ya se dio de baja',
          userId,
          state,
          Reason.USER_LIFECYCLE_ALREADY_OFFBOARDED,
        );

      // La precondición va en el UPDATE: si otro cambió el estado entre la lectura y esta
      // escritura, no se afecta ninguna fila y se responde 409 en vez de pisarlo.
      const now = new Date();
      const affected = await tx.nativeUpdate(
        Users,
        { id: userId, statusConceptId: { $in: from } },
        { statusConceptId: to, updatedAt: now, updatedByUserId: actor.id },
      );
      if (affected === 0)
        throw this.conflict(
          'El estado de la cuenta cambió mientras se hacía la operación',
          userId,
          state,
          action === 'reactivate'
            ? Reason.USER_LIFECYCLE_NOT_SUSPENDED
            : Reason.USER_LIFECYCLE_NOT_ACTIVE,
        );

      let revokedAssignments = 0;
      if (action !== 'reactivate') {
        const sessions = await tx.find(
          Sessions,
          { userId, stateConceptId: CONCEPTS.STATE_ACTIVE },
          { fields: ['id'] },
        );
        await tx.nativeUpdate(
          Sessions,
          { userId, stateConceptId: CONCEPTS.STATE_ACTIVE },
          { stateConceptId: CONCEPTS.STATE_REVOKED, updatedAt: now },
        );
        if (sessions.length > 0)
          await tx.nativeUpdate(
            RefreshTokens,
            {
              sessionId: { $in: sessions.map((s) => s.id) },
              stateConceptId: CONCEPTS.STATE_ACTIVE,
            },
            { stateConceptId: CONCEPTS.STATE_REVOKED, updatedAt: now },
          );
      }
      if (action === 'offboard') {
        revokedAssignments = await tx.nativeUpdate(
          UserRoleAssignments,
          { userId, statusConceptId: CONCEPTS.STATE_ACTIVE },
          {
            statusConceptId: CONCEPTS.STATE_REVOKED,
            updatedAt: now,
            updatedByUserId: actor.id,
          },
        );
      }

      tx.create(
        SecurityEvents,
        {
          eventTypeConceptId:
            action === 'suspend'
              ? AUTHZ_GOVERNANCE.EVENT_USER_SUSPENDED
              : action === 'reactivate'
                ? AUTHZ_GOVERNANCE.EVENT_USER_REACTIVATED
                : AUTHZ_GOVERNANCE.EVENT_USER_OFFBOARDED,
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
          userId,
          detailJson: { reason: dto.reason, revokedAssignments },
          recordedByUserId: actor.id,
          recordedAt: now,
        },
        { partial: true },
      );
      await tx.flush();

      return {
        userId,
        state:
          action === 'suspend'
            ? 'SUSPENDED'
            : action === 'reactivate'
              ? 'ACTIVE'
              : 'OFFBOARDED',
        revokedAssignments,
        note:
          action === 'offboard'
            ? OFFBOARD_NOTE
            : action === 'suspend'
              ? 'Las sesiones abiertas se cortaron. Los roles se conservan.'
              : 'La cuenta puede volver a ingresar. Sus roles no cambiaron.',
      };
    });
  }

  private async history(
    em: EntityManager,
    userId: string,
  ): Promise<LifecycleEventDto[]> {
    const rows = await em.find(
      SecurityEvents,
      { userId, eventTypeConceptId: { $in: [...LIFECYCLE_EVENT_CONCEPTS] } },
      { orderBy: { recordedAt: 'DESC' }, limit: LIFECYCLE_HISTORY_LIMIT },
    );
    return rows.map((r) => ({
      id: r.id,
      kind: KIND_BY_EVENT[r.eventTypeConceptId] ?? 'SUSPENDED',
      reason: (r.detailJson as { reason?: string } | undefined)?.reason ?? '',
      actorUserId: r.recordedByUserId ?? null,
      recordedAt: r.recordedAt,
    }));
  }

  private stateOf(
    status: string,
    history: readonly LifecycleEventDto[],
  ): UserLifecycleState {
    if (status === CONCEPTS.USER_ACTIVE) return 'ACTIVE';
    if (status === CONCEPTS.USER_ANONYMIZED) return 'ANONYMIZED';
    if (status !== CONCEPTS.USER_LOCKED) return 'OTHER';
    const last = history[0]?.kind;
    if (last === 'SUSPENDED') return 'SUSPENDED';
    if (last === 'OFFBOARDED') return 'OFFBOARDED';
    return 'LOCKED_OTHER';
  }

  private notFound(userId: string) {
    return new ResourceNotFoundException(
      'Usuario no encontrado',
      { userId },
      Reason.USER_LIFECYCLE_USER_NOT_FOUND,
    );
  }

  private anonymized(userId: string) {
    return new PreconditionFailedException(
      'La cuenta está anonimizada: no admite más transiciones',
      { userId },
      Reason.USER_LIFECYCLE_ANONYMIZED,
    );
  }

  private conflict(
    message: string,
    userId: string,
    state: UserLifecycleState,
    reason: Reason,
  ) {
    return new ConflictException(message, { userId, state }, reason);
  }
}
