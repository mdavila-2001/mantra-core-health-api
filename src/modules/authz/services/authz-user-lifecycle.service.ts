import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { hasOptionalPlatformTenant } from '../../../common/tenant/platform-tenant-optional.decorator';
import { DIR } from '../../directory/directory.concepts';
import { TenantMemberships } from '../../directory/entities';
import {
  RefreshTokens,
  SecurityEvents,
  Sessions,
  UserGlobalRoles,
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
import { Roles, UserRoleAssignments } from '../entities';

const KIND_BY_EVENT: Readonly<Record<string, LifecycleEventDto['kind']>> = {
  [AUTHZ_GOVERNANCE.EVENT_USER_SUSPENDED]: 'SUSPENDED',
  [AUTHZ_GOVERNANCE.EVENT_USER_REACTIVATED]: 'REACTIVATED',
  [AUTHZ_GOVERNANCE.EVENT_USER_OFFBOARDED]: 'OFFBOARDED',
};

/** Cuántos eventos del historial se devuelven: el reciente alcanza para auditar y no crece sin tope. */
export const LIFECYCLE_HISTORY_LIMIT = 50;
/**
 * Con alcance el historial se filtra por el tenant sellado en el evento y el tope se aplica
 * después: se leen hasta tantas filas para que los eventos de otros tenants no desplacen a los
 * propios fuera de la página.
 */
const SCOPED_HISTORY_SCAN_LIMIT = 1000;

export const OFFBOARD_NOTE =
  'Las sesiones abiertas se cortaron y los roles de authz se revocaron. Los roles globales de iam (si los hay) no se tocan: con la cuenta bloqueada no autorizan nada.';

/** Cómo se informa en la baja con alcance: sólo se revocan los roles de la organización del actor. */
export const OFFBOARD_SCOPED_NOTE =
  'Las sesiones abiertas se cortaron y los roles de authz de tu organización se revocaron. Los de otras organizaciones y los roles globales de iam (si los hay) no se tocan: con la cuenta bloqueada no autorizan nada.';

/**
 * Roles con los que el controlador de gobierno declara `@PlatformTenantOptional`. Tienen que ser
 * los mismos: `TenantContextInterceptor` decide con ellos si el request corre SIN tenant (actor de
 * plataforma) o dentro del tenant resuelto (actor con alcance), y este servicio tiene que llegar a
 * la misma conclusión o el filtro y el contexto se contradicen.
 */
export const GOVERNANCE_PLATFORM_ROLES = [
  'SECURITY_ADMIN',
  'SUPERADMIN',
] as const;

/**
 * Alcance de tenant de una operación de gobierno de acceso.
 *
 * - Actor de plataforma (`SECURITY_ADMIN`/`SUPERADMIN` sin ámbito de tenant en `scopedRoles`):
 *   `undefined`, sin filtro; opera sobre toda la plataforma.
 * - Actor con alcance (el rol sólo vale en uno o varios tenants): el tenant del contexto verificado.
 *   Sin tenant en el contexto falla cerrado (`requireTenantId`), nunca cae a «global».
 *
 * @param actor - Quien ejecuta la operación.
 * @returns El tenant al que acotar toda consulta y escritura, o `undefined` para plataforma.
 * @throws PreconditionFailedException si un actor con alcance no tiene tenant activo.
 */
export function resolveGovernanceScope(
  actor: AuthenticatedUser,
): string | undefined {
  return hasOptionalPlatformTenant(actor, GOVERNANCE_PLATFORM_ROLES)
    ? undefined
    : requireTenantId();
}

/**
 * ¿El usuario pertenece al tenant? Membresía activa del directorio o asignación de rol activa
 * acotada a ese tenant. Una cuenta sin ninguna de las dos no es alcanzable por quien tiene alcance.
 */
export async function userBelongsToTenant(
  em: EntityManager,
  userId: string,
  tenantId: string,
): Promise<boolean> {
  const membership = await em.findOne(TenantMemberships, {
    userId,
    tenantId,
    statusConceptId: {
      $in: [DIR.MEMBERSHIP_ACTIVE, CONCEPTS.MEMBERSHIP_ACTIVE],
    },
  });
  if (membership) return true;
  const assignment = await em.findOne(UserRoleAssignments, {
    userId,
    tenantId,
    statusConceptId: CONCEPTS.STATE_ACTIVE,
  });
  return assignment !== null && assignment !== undefined;
}

/** ¿Quien actúa es `SUPERADMIN` de plataforma? Uno acotado a un tenant no es comodín. */
export function isSuperadminActor(actor: AuthenticatedUser): boolean {
  return roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined);
}

interface PlatformRole {
  readonly conceptId: string;
  readonly code: string;
  /** Sólo cuenta la asignación de authz SIN tenant (rol de plataforma); una acotada no. */
  readonly unscopedAssignmentsOnly: boolean;
}

/** `SUPERADMIN`: cualquier asignación activa lo hace SUPERADMIN, incluso una acotada a un tenant. */
const SUPERADMIN_ROLE: PlatformRole = {
  conceptId: CONCEPTS.ROLE_SUPERADMIN,
  code: 'SUPERADMIN',
  unscopedAssignmentsOnly: false,
};
/** `SECURITY_ADMIN` de plataforma: el global de iam o una asignación sin tenant. */
const PLATFORM_SECURITY_ADMIN_ROLE: PlatformRole = {
  conceptId: CONCEPTS.ROLE_SECURITY_ADMIN,
  code: 'SECURITY_ADMIN',
  unscopedAssignmentsOnly: true,
};

/** ¿El usuario ejerce el rol, como rol global de iam o como asignación de authz? */
async function holdsRole(
  em: EntityManager,
  userId: string,
  role: PlatformRole,
): Promise<boolean> {
  const global = await em.findOne(UserGlobalRoles, {
    userId,
    roleConceptId: role.conceptId,
    stateConceptId: CONCEPTS.STATE_ACTIVE,
  });
  if (global) return true;
  const row = await em.findOne(Roles, {
    code: role.code,
    stateConceptId: CONCEPTS.STATE_ACTIVE,
  });
  if (!row) return false;
  const assignment = await em.findOne(UserRoleAssignments, {
    userId,
    roleId: row.id,
    statusConceptId: CONCEPTS.STATE_ACTIVE,
    ...(role.unscopedAssignmentsOnly ? { tenantId: null } : {}),
  });
  return assignment !== null && assignment !== undefined;
}

/** De esos usuarios, cuáles ejercen el rol (misma regla que {@link holdsRole}). */
async function userIdsHoldingRole(
  em: EntityManager,
  userIds: readonly string[],
  role: PlatformRole,
): Promise<Set<string>> {
  const found = new Set<string>();
  if (userIds.length === 0) return found;
  const ids = [...userIds];
  const globals = await em.find(
    UserGlobalRoles,
    {
      userId: { $in: ids },
      roleConceptId: role.conceptId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    },
    { fields: ['userId'] },
  );
  for (const g of globals) found.add(g.userId);
  const row = await em.findOne(Roles, {
    code: role.code,
    stateConceptId: CONCEPTS.STATE_ACTIVE,
  });
  if (row) {
    const assigned = await em.find(
      UserRoleAssignments,
      {
        userId: { $in: ids },
        roleId: row.id,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        ...(role.unscopedAssignmentsOnly ? { tenantId: null } : {}),
      },
      { fields: ['userId'] },
    );
    for (const a of assigned) found.add(a.userId);
  }
  return found;
}

/**
 * Sobre quién NO puede actuar quien actúa:
 * - Nadie que no sea `SUPERADMIN` actúa sobre un `SUPERADMIN`.
 * - Un actor con alcance de organización tampoco actúa sobre un administrador de seguridad de
 *   plataforma (global): de lo contrario bloquearía o auditaría a quien está por encima de él.
 *
 * @param scope - Resultado de {@link resolveGovernanceScope}.
 * @throws InsufficientRoleException (403) `GOVERNANCE_TARGET_REQUIRES_SUPERADMIN` o
 *   `GOVERNANCE_TARGET_REQUIRES_PLATFORM`.
 */
export async function assertTargetActionable(
  em: EntityManager,
  userId: string,
  actor: AuthenticatedUser,
  scope: string | undefined,
): Promise<void> {
  if (isSuperadminActor(actor)) return;
  if (await holdsRole(em, userId, SUPERADMIN_ROLE))
    throw new InsufficientRoleException(
      'Sólo un SUPERADMIN puede actuar sobre una cuenta SUPERADMIN',
      undefined,
      Reason.GOVERNANCE_TARGET_REQUIRES_SUPERADMIN,
    );
  if (
    scope !== undefined &&
    (await holdsRole(em, userId, PLATFORM_SECURITY_ADMIN_ROLE))
  )
    throw new InsufficientRoleException(
      'Sólo la plataforma puede actuar sobre un administrador de seguridad de plataforma',
      undefined,
      Reason.GOVERNANCE_TARGET_REQUIRES_PLATFORM,
    );
}

/** De esos usuarios, sobre cuáles NO puede actuar quien actúa (misma regla que {@link assertTargetActionable}). */
export async function nonActionableUserIds(
  em: EntityManager,
  userIds: readonly string[],
  actor: AuthenticatedUser,
  scope: string | undefined,
): Promise<Set<string>> {
  if (isSuperadminActor(actor)) return new Set();
  const blocked = await userIdsHoldingRole(em, userIds, SUPERADMIN_ROLE);
  if (scope !== undefined)
    for (const id of await userIdsHoldingRole(
      em,
      userIds,
      PLATFORM_SECURITY_ADMIN_ROLE,
    ))
      blocked.add(id);
  return blocked;
}

/**
 * Suspender, reactivar o dar de baja afecta la CUENTA (una sola, de toda la plataforma), no la
 * pertenencia a una organización. Un actor con alcance sólo puede hacerlo sobre una cuenta que
 * vive únicamente en su tenant; si tiene membresías activas o asignaciones activas en otros tenants
 * (o globales) el efecto cruzaría organizaciones y se rechaza.
 *
 * @throws ConflictException (409) `USER_LIFECYCLE_MULTI_TENANT`.
 */
async function assertSingleTenantAccount(
  em: EntityManager,
  userId: string,
  tenantId: string,
): Promise<void> {
  const otherMembership = await em.findOne(TenantMemberships, {
    userId,
    tenantId: { $ne: tenantId },
    statusConceptId: {
      $in: [DIR.MEMBERSHIP_ACTIVE, CONCEPTS.MEMBERSHIP_ACTIVE],
    },
  });
  const otherAssignment = otherMembership
    ? null
    : await em.findOne(UserRoleAssignments, {
        userId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        $or: [{ tenantId: { $ne: tenantId } }, { tenantId: null }],
      });
  if (otherMembership || otherAssignment)
    throw new ConflictException(
      'La cuenta pertenece también a otras organizaciones: la acción afectaría a todas y debe hacerla un administrador de plataforma',
      { userId },
      Reason.USER_LIFECYCLE_MULTI_TENANT,
    );
}

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
 * **Alcance de tenant.** Un actor de plataforma opera sobre cualquier cuenta. Un actor con alcance
 * (su rol de administrador vale sólo en su organización) únicamente alcanza cuentas de esa
 * organización: una cuenta ajena responde 404 idéntico al de una inexistente, y la baja revoca
 * sólo las asignaciones de su tenant. Como la cuenta es una sola, además no puede suspender,
 * reactivar ni dar de baja una cuenta que también vive en otros tenants (409
 * `USER_LIFECYCLE_MULTI_TENANT`): eso lo hace la plataforma. Nadie que no sea `SUPERADMIN` actúa
 * sobre un `SUPERADMIN`, y un actor con alcance tampoco sobre un administrador de plataforma. Su
 * historial sólo muestra los eventos sellados con su tenant.
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

  async lifecycleOf(
    userId: string,
    actor: AuthenticatedUser,
  ): Promise<UserLifecycleDto> {
    const scope = resolveGovernanceScope(actor);
    const user = await this.em.findOne(Users, { id: userId });
    if (!user || !(await this.inScope(this.em, userId, scope)))
      throw this.notFound(userId);
    // El estado sale del último evento SIN filtrar: la cuenta es una sola. Lo que se muestra a un
    // actor con alcance son sólo los eventos sellados con su tenant.
    const rows = await this.events(
      this.em,
      userId,
      scope === undefined ? LIFECYCLE_HISTORY_LIMIT : SCOPED_HISTORY_SCAN_LIMIT,
    );
    const all = rows.map((r) => this.toDto(r));
    const history =
      scope === undefined
        ? all
        : rows
            .filter(
              (r) =>
                (r.detailJson as { tenantId?: string | null } | undefined)
                  ?.tenantId === scope,
            )
            .map((r) => this.toDto(r))
            .slice(0, LIFECYCLE_HISTORY_LIMIT);
    return {
      userId,
      state: this.stateOf(user.statusConceptId, all),
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
      {
        operation: `authz.user-lifecycle.${action}`,
        userId,
        actorId: actor.id,
      },
      'User lifecycle action',
    );
    if (action !== 'reactivate' && actor.id === userId) {
      throw new PreconditionFailedException(
        'Nadie puede suspenderse ni darse de baja a sí mismo',
        { userId },
        Reason.USER_LIFECYCLE_SELF_ACTION,
      );
    }
    const scope = resolveGovernanceScope(actor);
    return this.em.transactional(async (tx) => {
      const user = await tx.findOne(Users, { id: userId });
      // Una cuenta fuera del alcance del actor es indistinguible de una inexistente: 404 idéntico.
      if (!user || !(await this.inScope(tx, userId, scope)))
        throw this.notFound(userId);
      await assertTargetActionable(tx, userId, actor, scope);
      if (scope !== undefined)
        await assertSingleTenantAccount(tx, userId, scope);
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
          {
            userId,
            statusConceptId: CONCEPTS.STATE_ACTIVE,
            // Con alcance, sólo los roles de SU organización; las de otras no son suyas para revocar.
            ...(scope !== undefined ? { tenantId: scope } : {}),
          },
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
          detailJson: {
            reason: dto.reason,
            revokedAssignments,
            // Sello del tenant de quien actuó (null = plataforma): el historial con alcance lo filtra.
            tenantId: scope ?? null,
          },
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
            ? scope !== undefined
              ? OFFBOARD_SCOPED_NOTE
              : OFFBOARD_NOTE
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
    const rows = await this.events(em, userId, LIFECYCLE_HISTORY_LIMIT);
    return rows.map((r) => this.toDto(r));
  }

  private events(em: EntityManager, userId: string, limit: number) {
    return em.find(
      SecurityEvents,
      { userId, eventTypeConceptId: { $in: [...LIFECYCLE_EVENT_CONCEPTS] } },
      { orderBy: { recordedAt: 'DESC' }, limit },
    );
  }

  private toDto(r: SecurityEvents): LifecycleEventDto {
    return {
      id: r.id,
      kind: KIND_BY_EVENT[r.eventTypeConceptId] ?? 'SUSPENDED',
      reason: (r.detailJson as { reason?: string } | undefined)?.reason ?? '',
      actorUserId: r.recordedByUserId ?? null,
      recordedAt: r.recordedAt,
    };
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

  private async inScope(
    em: EntityManager,
    userId: string,
    scope: string | undefined,
  ): Promise<boolean> {
    return scope === undefined || userBelongsToTenant(em, userId, scope);
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
