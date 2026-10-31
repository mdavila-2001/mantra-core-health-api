import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import * as argon2 from 'argon2';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import { IamErrorReason } from '../../iam.error-reasons';
import {
  UsersRepository,
  CredentialsRepository,
  UserGlobalRolesRepository,
  SessionsRepository,
  RefreshTokensRepository,
  AccountLockoutsRepository,
  SecurityEventsRepository,
} from '../../infrastructure/repositories';
import {
  COMMON_RECORDS_PORT,
  type CommonRecordsPort,
} from '../ports/common-records.port';
import {
  CreateUserDto,
  UserResponseDto,
  LockUserDto,
  GlobalRoleDto,
  StatusResultDto,
  USER_LIFECYCLE_DEFAULT_PAGE_SIZE,
  type UserLifecycleHistoryQueryDto,
  type UserLifecycleResultDto,
  type UserLifecycleViewDto,
} from '../../presentation/dto';
import {
  USER_LIFECYCLE_RULES,
  type UserLifecycleAction,
  type UserLifecycleState,
} from '../../domain/user-lifecycle';
import { ROLE_CONCEPT_BY_CODE } from './role-mapping';

/** Estado de la cuenta (concepto) al que lleva cada estado de ciclo de vida. */
const STATUS_CONCEPT_OF_STATE: Readonly<
  Partial<Record<UserLifecycleState, string>>
> = {
  ACTIVE: CONCEPTS.USER_ACTIVE,
  SUSPENDED: CONCEPTS.USER_LOCKED,
  DEACTIVATED: CONCEPTS.USER_LOCKED,
};

/** Quienes pueden administrar accesos: perder al último dejaría la plataforma sin quien reparar. */
const ACCESS_ADMIN_ROLE_CONCEPTS = [
  CONCEPTS.ROLE_SECURITY_ADMIN,
  CONCEPTS.ROLE_SUPERADMIN,
] as const;

/**
 * Casos de uso de gestión de usuarios por parte de un administrador de seguridad:
 * alta (UC-01-01), bloqueo (UC-01-07), gestión de roles globales (UC-01-10) y
 * anonimización DSAR (UC-01-12).
 *
 * El servicio posee la unidad de trabajo: usa `em.transactional` y hace `flush`
 * del padre antes de crear hijos (las FK son columnas uuid, MikroORM no ordena
 * inserts entre entidades no relacionadas).
 */
@Injectable()
export class IamUsersService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param usersRepo - Valor de users repo requerido por la operación.
   * @param credentialsRepo - Valor de credentials repo requerido por la operación.
   * @param rolesRepo - Valor de roles repo requerido por la operación.
   * @param sessionsRepo - Valor de sessions repo requerido por la operación.
   * @param refreshRepo - Valor de refresh repo requerido por la operación.
   * @param lockoutsRepo - Valor de lockouts repo requerido por la operación.
   * @param eventsRepo - Valor de events repo requerido por la operación.
   * @param commonRecords - Puntos de contacto donde vive el teléfono del usuario.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly usersRepo: UsersRepository,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly rolesRepo: UserGlobalRolesRepository,
    private readonly sessionsRepo: SessionsRepository,
    private readonly refreshRepo: RefreshTokensRepository,
    private readonly lockoutsRepo: AccountLockoutsRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    @Inject(COMMON_RECORDS_PORT)
    private readonly commonRecords: CommonRecordsPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IamUsersService.name);
  }

  /** UC-01-01: crea un usuario con su credencial de contraseña y rol inicial. */
  async createUser(
    dto: CreateUserDto,
    actor: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    this.logger.info(
      { operation: 'iam.user.create', actorId: actor.id },
      'Creating user',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.credentialsRepo.findActivePasswordBySubject(
        tx,
        dto.email,
      );
      if (clash) {
        this.logger.warn(
          { operation: 'iam.user.create', reason: 'email-in-use' },
          'Rejected user creation: email already has an active credential',
        );
        throw new ConflictException(
          'El email ya tiene una credencial de contraseña activa',
          {
            email: dto.email,
          },
          IamErrorReason.EMAIL_HAS_ACTIVE_PASSWORD_CREDENTIAL,
        );
      }

      const user = this.usersRepo.create(tx, {
        displayName: dto.displayName,
        statusConceptId: CONCEPTS.USER_ACTIVE,
        mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
        timeZone: dto.timeZone,
        actorUserId: actor.id,
      });
      // FK son columnas uuid: hay que persistir el padre antes de los hijos.
      await tx.flush();

      const secretHash = await argon2.hash(dto.password);
      this.credentialsRepo.createPassword(tx, {
        userId: user.id,
        externalSubject: dto.email,
        secretHash,
        actorUserId: actor.id,
      });

      // `iam.users` no tiene columna de teléfono —sólo `phone_verified`—, así que
      // el número vive en `common.contact_points` colgado del propio usuario.
      if (dto.phone) {
        this.commonRecords.createContactPoint(tx, {
          ownerTypeConceptId: CONCEPTS.OWNER_USER,
          ownerId: user.id,
          systemConceptId: CONCEPTS.CONTACT_PHONE,
          value: dto.phone,
          useConceptId: CONCEPTS.CONTACT_USE_WORK,
          actorUserId: actor.id,
        });
      }

      const roleCode = dto.initialRole ?? 'USER';
      this.rolesRepo.create(tx, {
        userId: user.id,
        roleConceptId: ROLE_CONCEPT_BY_CODE[roleCode],
        actorUserId: actor.id,
      });

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_ROLE_GRANT,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: user.id,
        recordedByUserId: actor.id,
        detailJson: { role: roleCode, reason: 'user-create' },
      });

      this.logger.info(
        { operation: 'iam.user.create', userId: user.id },
        'User created',
      );
      return {
        id: user.id,
        displayName: user.displayName,
        status: user.statusConceptId,
        createdAt: user.createdAt,
      };
    });
  }

  /** UC-01-07: bloquea la cuenta y revoca sus sesiones activas. */
  async lock(
    userId: string,
    dto: LockUserDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'iam.user.lock', userId, actorId: actor.id },
      'Locking user',
    );
    return this.em.transactional(async (tx) => {
      const user = await this.usersRepo.findById(tx, userId);
      if (!user)
        throw new ResourceNotFoundException(
          'Usuario no encontrado',
          { userId },
          IamErrorReason.USER_NOT_FOUND,
        );

      user.statusConceptId = CONCEPTS.USER_LOCKED;
      touch(user, actor.id);

      this.lockoutsRepo.create(tx, {
        userId,
        reasonConceptId: CONCEPTS.LOCK_REASON_MANUAL,
        sourceIp: undefined,
        actorUserId: actor.id,
      });

      const sessionIds = await this.sessionsRepo.activeSessionIdsForUser(
        tx,
        userId,
      );
      await this.sessionsRepo.revokeAllActiveForUser(tx, userId);
      await this.refreshRepo.revokeActiveBySessionIds(tx, sessionIds);

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_ACCOUNT_LOCK,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId,
        recordedByUserId: actor.id,
        detailJson: { reason: dto.reason, source: 'manual' },
      });

      return { ok: true };
    });
  }

  /** Suspende la cuenta (reversible): bloquea el acceso y cierra sus sesiones. */
  suspend(
    userId: string,
    reason: string,
    actor: AuthenticatedUser,
  ): Promise<UserLifecycleResultDto> {
    return this.applyLifecycle('SUSPEND', userId, reason, actor);
  }

  /** Reactiva una cuenta suspendida. No reactiva una baja ni una cuenta anonimizada. */
  reactivate(
    userId: string,
    reason: string,
    actor: AuthenticatedUser,
  ): Promise<UserLifecycleResultDto> {
    return this.applyLifecycle('REACTIVATE', userId, reason, actor);
  }

  /**
   * Da de baja la cuenta. **No borra nada**: la fila y su historia quedan; se revocan las
   * credenciales, los roles globales y las sesiones. Es definitiva para el uso (no se reactiva).
   */
  deactivate(
    userId: string,
    reason: string,
    actor: AuthenticatedUser,
  ): Promise<UserLifecycleResultDto> {
    return this.applyLifecycle('DEACTIVATE', userId, reason, actor);
  }

  /** Estado de ciclo de vida de la cuenta y su historia, paginada, de la más reciente a la más antigua. */
  async lifecycleOf(
    userId: string,
    query: UserLifecycleHistoryQueryDto,
  ): Promise<UserLifecycleViewDto> {
    const em = this.em.fork();
    const user = await this.usersRepo.findById(em, userId);
    if (!user)
      throw new ResourceNotFoundException(
        'Usuario no encontrado',
        { userId },
        IamErrorReason.USER_NOT_FOUND,
      );
    const limit = query.limit ?? USER_LIFECYCLE_DEFAULT_PAGE_SIZE;
    const key = query.cursor ? decodeKeysetCursor(query.cursor) : undefined;
    if (key && (typeof key.t !== 'string' || typeof key.i !== 'string'))
      throw new BadRequestException('El cursor de paginación no es válido');
    const [state, rows] = await Promise.all([
      this.lifecycleStateOf(em, user.id, user.statusConceptId),
      this.eventsRepo.lifecycleHistory(em, userId, {
        limit,
        after: key
          ? { recordedAt: key.t as string, id: key.i as string }
          : undefined,
      }),
    ]);
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    return {
      userId,
      // Una cuenta sin estado reconocible se presenta como suspendida: no accede.
      state: state ?? 'SUSPENDED',
      items: page.map((r) => ({
        id: r.id,
        action: r.action,
        reason: r.reason,
        recordedByUserId: r.recorded_by_user_id,
        recordedAt: r.recorded_at,
      })),
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({ t: last.recorded_at, i: last.id })
          : null,
      limit,
    };
  }

  /**
   * Estado de ciclo de vida a partir del estado de la cuenta.
   *
   * `LOCKED` es suspensión o baja: la baja se reconoce porque su última acción de ciclo de vida
   * fue `DEACTIVATE` (el catálogo cerrado `user-status` no tiene un estado propio para ella).
   */
  private async lifecycleStateOf(
    em: EntityManager,
    userId: string,
    statusConceptId: string,
  ): Promise<UserLifecycleState | null> {
    if (statusConceptId === CONCEPTS.USER_ACTIVE) return 'ACTIVE';
    if (statusConceptId === CONCEPTS.USER_ANONYMIZED) return 'ANONYMIZED';
    if (statusConceptId !== CONCEPTS.USER_LOCKED) return null;
    const last = await this.eventsRepo.latestLifecycleAction(em, userId);
    return last === 'DEACTIVATE' ? 'DEACTIVATED' : 'SUSPENDED';
  }

  /**
   * Transición de ciclo de vida: motivo obligatorio (lo valida el DTO), cerrojo de fila,
   * precondición de estado en la escritura, idempotente, con rastro en la bitácora de seguridad
   * y cierre de sesiones. Todo en una transacción: o queda entero o no queda nada.
   */
  private async applyLifecycle(
    action: UserLifecycleAction,
    userId: string,
    reason: string,
    actor: AuthenticatedUser,
  ): Promise<UserLifecycleResultDto> {
    this.logger.info(
      {
        operation: `iam.user.${action.toLowerCase()}`,
        userId,
        actorId: actor.id,
      },
      'Applying user lifecycle transition',
    );
    // Quien administra no se saca el acceso a sí mismo: dejaría la sesión que lo hace sin cuenta.
    if (userId === actor.id && action !== 'REACTIVATE')
      throw new PreconditionFailedException(
        'Un administrador no puede suspender ni dar de baja su propia cuenta',
        { userId },
        IamErrorReason.USER_SELF_LIFECYCLE_FORBIDDEN,
      );
    const rule = USER_LIFECYCLE_RULES[action];

    return this.em.transactional(async (tx) => {
      const user = await this.usersRepo.findByIdForUpdate(tx, userId);
      if (!user)
        throw new ResourceNotFoundException(
          'Usuario no encontrado',
          { userId },
          IamErrorReason.USER_NOT_FOUND,
        );
      const from = await this.lifecycleStateOf(
        tx,
        userId,
        user.statusConceptId,
      );

      // Idempotencia: la cuenta ya está donde la acción la dejaría. No se escribe nada.
      if (from === rule.to)
        return { id: userId, state: from, changed: false, revokedSessions: 0 };
      if (!from || !rule.from.includes(from))
        throw new ConflictException(
          'La cuenta no puede pasar a ese estado desde el que tiene',
          { userId, action, state: from },
          IamErrorReason.USER_LIFECYCLE_TRANSITION_INVALID,
        );

      if (action !== 'REACTIVATE') {
        const grants = await this.rolesRepo.findActiveForUser(tx, userId);
        const isAccessAdmin = grants.some((g) =>
          (ACCESS_ADMIN_ROLE_CONCEPTS as readonly string[]).includes(
            g.roleConceptId,
          ),
        );
        if (isAccessAdmin) await this.usersRepo.lockAccessAdminChanges(tx);
        if (
          isAccessAdmin &&
          (await this.rolesRepo.countOtherActiveHolders(
            tx,
            ACCESS_ADMIN_ROLE_CONCEPTS,
            userId,
          )) === 0
        )
          throw new PreconditionFailedException(
            'Es la última cuenta que administra accesos: concedé ese rol a otra antes',
            { userId },
            IamErrorReason.USER_LAST_SECURITY_ADMIN,
          );
      }

      const target = STATUS_CONCEPT_OF_STATE[rule.to] as string;
      // La precondición va en la escritura: si la cuenta cambió desde la lectura, no se aplica.
      const applied = await this.usersRepo.transitionStatus(
        tx,
        userId,
        [user.statusConceptId],
        target,
        actor.id,
      );
      if (!applied)
        throw new ConflictException(
          'La cuenta cambió de estado mientras se aplicaba: reintentá',
          { userId, action },
          IamErrorReason.USER_LIFECYCLE_TRANSITION_INVALID,
        );

      let revokedSessions = 0;
      if (action === 'REACTIVATE') {
        await this.lockoutsRepo.releaseActiveForUser(tx, userId, actor.id);
      } else {
        if (!(await this.lockoutsRepo.findActiveForUser(tx, userId)))
          this.lockoutsRepo.create(tx, {
            userId,
            reasonConceptId: CONCEPTS.LOCK_REASON_MANUAL,
            actorUserId: actor.id,
          });
        const sessionIds = await this.sessionsRepo.activeSessionIdsForUser(
          tx,
          userId,
        );
        revokedSessions = await this.sessionsRepo.revokeAllActiveForUser(
          tx,
          userId,
        );
        await this.refreshRepo.revokeActiveBySessionIds(tx, sessionIds);
        if (action === 'DEACTIVATE') {
          await this.credentialsRepo.revokeAllForUser(tx, userId);
          await this.rolesRepo.revokeAllForUser(tx, userId);
        }
      }

      // `ACCOUNT_LOCK` también registra la reactivación: el catálogo no tiene un tipo de evento
      // de desbloqueo y la acción va en el detalle.
      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_ACCOUNT_LOCK,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId,
        recordedByUserId: actor.id,
        detailJson: { action, reason, source: 'manual' },
      });
      return { id: userId, state: rule.to, changed: true, revokedSessions };
    });
  }

  /** UC-01-10: concede o revoca un rol global. */
  async changeGlobalRole(
    userId: string,
    dto: GlobalRoleDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      {
        operation: 'iam.user.role',
        userId,
        role: dto.role,
        action: dto.action,
      },
      'Changing global role',
    );
    return this.em.transactional(async (tx) => {
      const user = await this.usersRepo.findById(tx, userId);
      if (!user)
        throw new ResourceNotFoundException(
          'Usuario no encontrado',
          { userId },
          IamErrorReason.USER_NOT_FOUND,
        );

      const roleConceptId = ROLE_CONCEPT_BY_CODE[dto.role];
      const active = await this.rolesRepo.findActive(tx, userId, roleConceptId);

      if (dto.action === 'GRANT') {
        if (active)
          throw new ConflictException(
            'El rol ya está concedido',
            { role: dto.role },
            IamErrorReason.ROLE_ALREADY_GRANTED,
          );
        this.rolesRepo.create(tx, {
          userId,
          roleConceptId,
          actorUserId: actor.id,
        });
        this.eventsRepo.record(tx, {
          eventTypeConceptId: CONCEPTS.SEC_ROLE_GRANT,
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
          userId,
          recordedByUserId: actor.id,
          detailJson: { role: dto.role },
        });
      } else {
        if (!active) {
          throw new ResourceNotFoundException(
            'El usuario no tiene ese rol activo',
            {
              role: dto.role,
            },
            IamErrorReason.ROLE_NOT_GRANTED,
          );
        }
        active.stateConceptId = CONCEPTS.STATE_REVOKED;
        touch(active, actor.id);
        // El rol viaja firmado en el access token: retirarlo en la base no
        // alcanza. Se cierran las sesiones para que el token deje de servir en
        // la petición siguiente (MCH-004) y el próximo login emita los roles
        // vigentes.
        const sessionIds = await this.sessionsRepo.activeSessionIdsForUser(
          tx,
          userId,
        );
        await this.sessionsRepo.revokeAllActiveForUser(tx, userId);
        await this.refreshRepo.revokeActiveBySessionIds(tx, sessionIds);
        this.eventsRepo.record(tx, {
          eventTypeConceptId: CONCEPTS.SEC_ROLE_REVOKE,
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
          userId,
          recordedByUserId: actor.id,
          detailJson: { role: dto.role },
        });
      }

      return { ok: true };
    });
  }

  /** UC-01-12: anonimiza (DSAR) la cuenta y revoca credenciales, sesiones y roles. */
  async anonymize(
    userId: string,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'iam.user.anonymize', userId, actorId: actor.id },
      'Anonymizing user',
    );
    return this.em.transactional(async (tx) => {
      const user = await this.usersRepo.findById(tx, userId);
      if (!user)
        throw new ResourceNotFoundException(
          'Usuario no encontrado',
          { userId },
          IamErrorReason.USER_NOT_FOUND,
        );

      user.statusConceptId = CONCEPTS.USER_ANONYMIZED;
      user.anonymizedAt = new Date();
      user.displayName = 'ANONYMIZED';
      touch(user, actor.id);

      await this.credentialsRepo.revokeAllForUser(tx, userId);
      const sessionIds = await this.sessionsRepo.activeSessionIdsForUser(
        tx,
        userId,
      );
      await this.sessionsRepo.revokeAllActiveForUser(tx, userId);
      await this.refreshRepo.revokeActiveBySessionIds(tx, sessionIds);
      await this.rolesRepo.revokeAllForUser(tx, userId);

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_ANONYMIZE,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId,
        recordedByUserId: actor.id,
      });

      return { ok: true };
    });
  }
}
