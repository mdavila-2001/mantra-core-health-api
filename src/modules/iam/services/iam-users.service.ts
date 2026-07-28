import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import * as argon2 from 'argon2';
import {
  CONCEPTS,
  ConflictException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  UsersRepository,
  CredentialsRepository,
  UserGlobalRolesRepository,
  SessionsRepository,
  RefreshTokensRepository,
  AccountLockoutsRepository,
  SecurityEventsRepository,
} from '../repositories';
import {
  CreateUserDto,
  UserResponseDto,
  LockUserDto,
  GlobalRoleDto,
  StatusResultDto,
} from '../dto';
import { ROLE_CONCEPT_BY_CODE } from './role-mapping';

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
        throw new ResourceNotFoundException('Usuario no encontrado', {
          userId,
        });

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
        throw new ResourceNotFoundException('Usuario no encontrado', {
          userId,
        });

      const roleConceptId = ROLE_CONCEPT_BY_CODE[dto.role];
      const active = await this.rolesRepo.findActive(tx, userId, roleConceptId);

      if (dto.action === 'GRANT') {
        if (active)
          throw new ConflictException('El rol ya está concedido', {
            role: dto.role,
          });
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
          );
        }
        active.stateConceptId = CONCEPTS.STATE_REVOKED;
        touch(active, actor.id);
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
        throw new ResourceNotFoundException('Usuario no encontrado', {
          userId,
        });

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
