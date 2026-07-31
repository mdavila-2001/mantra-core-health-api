import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  APP_ATTR,
  TracingService,
  type TraceSpan,
} from '../../../observability';
import * as argon2 from 'argon2';
import {
  CONCEPTS,
  TokenService,
  loadAuthEnv,
  touch,
  type AuthEnv,
  type AuthenticatedUser,
} from '../../../common';
import {
  UsersRepository,
  CredentialsRepository,
  SessionsRepository,
  RefreshTokensRepository,
  UserGlobalRolesRepository,
  AccountLockoutsRepository,
  SecurityEventsRepository,
} from '../repositories';
import {
  LoginDto,
  RefreshTokenDto,
  TokenResponseDto,
  LogoutAllResultDto,
  PurgeResultDto,
} from '../dto';
import { conceptIdsToRoleCodes } from './role-mapping';
// Lectura cross-dominio acotada al límite de autenticación: al emitir el token
// se resuelven las membresías de tenant del sujeto para embeberlas como claim.
import { TenantMemberships } from '../../directory/entities';

/**
 * Flujos de autenticación de sesión: login (UC-01-04), rotación de tokens con
 * detección de reuso (UC-01-06), cierre global de sesión (UC-01-08) y purga de
 * sesiones vencidas (UC-01-11).
 *
 * Los efectos de un login fallido (evento de seguridad, contador y posible
 * bloqueo) se confirman en su propia transacción ANTES de lanzar el error, para
 * que no se reviertan con el `throw`.
 */
@Injectable()
export class IamAuthService {
  /**
   * Valor de auth env mantenido por la instancia.
   */
  private readonly authEnv: AuthEnv = loadAuthEnv();

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tokenService - Valor de token service requerido por la operación.
   * @param usersRepo - Valor de users repo requerido por la operación.
   * @param credentialsRepo - Valor de credentials repo requerido por la operación.
   * @param sessionsRepo - Valor de sessions repo requerido por la operación.
   * @param refreshRepo - Valor de refresh repo requerido por la operación.
   * @param rolesRepo - Valor de roles repo requerido por la operación.
   * @param lockoutsRepo - Valor de lockouts repo requerido por la operación.
   * @param eventsRepo - Valor de events repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly tokenService: TokenService,
    private readonly usersRepo: UsersRepository,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly sessionsRepo: SessionsRepository,
    private readonly refreshRepo: RefreshTokensRepository,
    private readonly rolesRepo: UserGlobalRolesRepository,
    private readonly lockoutsRepo: AccountLockoutsRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly logger: PinoLogger,
    private readonly tracing: TracingService,
  ) {
    this.logger.setContext(IamAuthService.name);
  }

  /**
   * Tenants de los que el usuario es miembro ACTIVO. Se embeben en el token para
   * que el `X-Tenant-Id` del request pueda validarse sin un lookup por petición.
   */
  private async loadActiveTenantIds(
    em: EntityManager,
    userId: string,
  ): Promise<string[]> {
    const memberships =
      (await em.find(TenantMemberships, {
        userId,
        statusConceptId: CONCEPTS.MEMBERSHIP_ACTIVE,
      })) ?? [];
    return [...new Set(memberships.map((m) => m.tenantId))];
  }

  /**
   * UC-01-04: autentica por identificador+contraseña y abre una sesión.
   *
   * El identificador es el `external_subject` de la credencial: el correo para
   * las altas por correo, el documento de identidad para los pacientes
   * auto-registrados. Ambos viven en la misma columna, así que la búsqueda es
   * idéntica; sólo cambia de qué campo del DTO sale.
   */
  async login(dto: LoginDto, ip?: string): Promise<TokenResponseDto> {
    // Span de negocio: la autenticación es la operación con más caminos de
    // fallo distintos del sistema (sin credencial, usuario inactivo, contraseña
    // incorrecta, cuenta bloqueada) y todos devuelven el mismo 401 opaco al
    // cliente, por diseño. Los eventos del span son el único sitio donde queda
    // registrado CUÁL de los cuatro ocurrió, sin filtrarlo al atacante.
    //
    // Nunca se registran aquí ni la contraseña, ni el documento de identidad,
    // ni el correo: son datos personales o secretos. El `userId` solo se añade
    // cuando ya está autenticado.
    return this.tracing.runInSpan(
      'iam.authenticate',
      {
        [APP_ATTR.MODULE]: 'iam',
        [APP_ATTR.OPERATION]: 'authenticate',
        [APP_ATTR.ENTITY_TYPE]: 'iam.users',
        'iam.auth.subject_kind': dto.nationalId ? 'national_id' : 'email',
      },
      (span) => this.performLogin(dto, span, ip),
    );
  }

  /**
   * Autenticación propiamente dicha. La lógica no cambió al instrumentar; se
   * extrajo para que `login` sea solo la declaración del span de negocio.
   */
  private async performLogin(
    dto: LoginDto,
    span: TraceSpan,
    ip?: string,
  ): Promise<TokenResponseDto> {
    const subject = dto.nationalId ?? dto.email;
    if (!subject) {
      // El DTO ya lo exige, pero sin esta guarda un cuerpo inesperado buscaría
      // una credencial con subject `undefined` y devolvería la primera que
      // encontrara con ese valor nulo.
      span.addEvent('auth.rejected', { reason: 'no-subject' });
      await this.recordLoginFailure(undefined, ip, 'no-subject');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    this.logger.info(
      // El documento de identidad no se registra: es un dato personal y el
      // correo ya bastaba para diagnosticar un intento fallido.
      { operation: 'iam.auth.login', email: dto.email },
      'Login attempt',
    );
    const readEm = this.em.fork();

    const cred = await this.credentialsRepo.findActivePasswordBySubject(
      readEm,
      subject,
    );
    if (!cred || !cred.secretHash) {
      span.addEvent('auth.rejected', { reason: 'no-credential' });
      await this.recordLoginFailure(undefined, ip, 'no-credential');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const user = await this.usersRepo.findById(readEm, cred.userId);
    if (!user || user.statusConceptId !== CONCEPTS.USER_ACTIVE) {
      span.addEvent('auth.rejected', { reason: 'user-not-active' });
      await this.recordLoginFailure(user?.id, ip, 'user-not-active');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordOk = await argon2
      .verify(cred.secretHash, dto.password)
      .catch(() => false);
    if (!passwordOk) {
      span.addEvent('auth.rejected', { reason: 'bad-password' });
      await this.handleFailedPassword(user.id, ip);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.em.transactional(async (tx) => {
      const activeRoles = await this.rolesRepo.findActiveForUser(tx, user.id);
      const roles = conceptIdsToRoleCodes(
        activeRoles.map((r) => r.roleConceptId),
      );
      const tenants = await this.loadActiveTenantIds(tx, user.id);
      const issued = this.tokenService.issueSessionTokens(
        user.id,
        roles,
        tenants,
      );

      const session = this.sessionsRepo.create(tx, {
        userId: user.id,
        tokenId: issued.sessionTokenId,
        expiresAt: issued.expiresAt,
        ip,
      });
      // La sesión es el padre del refresh token: persistir antes de crearlo.
      await tx.flush();

      this.refreshRepo.create(tx, {
        sessionId: session.id,
        tokenHash: issued.refreshTokenHash,
        expiresAt: issued.expiresAt,
      });

      const managedUser = await this.usersRepo.findById(tx, user.id);
      if (managedUser) {
        managedUser.lastLoginAt = new Date();
        touch(managedUser, user.id);
      }

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGIN,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: user.id,
        ip,
      });

      span.setAttribute(APP_ATTR.ENTITY_ID, user.id);
      span.addEvent('auth.session.issued');
      this.logger.info(
        { operation: 'iam.auth.login', userId: user.id },
        'Login succeeded',
      );
      return {
        accessToken: issued.accessToken,
        refreshToken: issued.refreshToken,
        expiresAt: issued.expiresAt,
      };
    });
  }

  /** UC-01-06: rota el refresh token; detecta y castiga el reuso. */
  async refresh(dto: RefreshTokenDto): Promise<TokenResponseDto> {
    const tokenHash = this.tokenService.hashRefreshToken(dto.refreshToken);
    const readEm = this.em.fork();
    const rt = await this.refreshRepo.findByHash(readEm, tokenHash);
    if (!rt) throw new UnauthorizedException('Refresh token inválido');

    if (rt.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
      // Reuso: un token ya rotado/revocado se presenta de nuevo → revocar sesión.
      this.logger.warn(
        {
          operation: 'iam.auth.refresh',
          sessionId: rt.sessionId,
          reason: 'token-reuse',
        },
        'Refresh token reuse detected',
      );
      await this.em.transactional(async (tx) => {
        this.eventsRepo.record(tx, {
          eventTypeConceptId: CONCEPTS.SEC_TOKEN_REUSE,
          outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
          userId: undefined,
          detailJson: { sessionId: rt.sessionId },
        });
        await this.refreshRepo.revokeBySessionId(tx, rt.sessionId);
        await this.sessionsRepo.revokeById(tx, rt.sessionId);
      });
      throw new UnauthorizedException('Reuso de refresh token detectado');
    }

    if (rt.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    return this.em.transactional(async (tx) => {
      const session = await this.sessionsRepo.findById(tx, rt.sessionId);
      if (!session || session.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new UnauthorizedException('Sesión no activa');
      }

      const activeRoles = await this.rolesRepo.findActiveForUser(
        tx,
        session.userId,
      );
      const roles = conceptIdsToRoleCodes(
        activeRoles.map((r) => r.roleConceptId),
      );
      const tenants = await this.loadActiveTenantIds(tx, session.userId);
      const accessToken = this.tokenService.signAccessToken(
        session.userId,
        session.tokenId,
        roles,
        tenants,
      );
      const { raw, hash } = this.tokenService.issueRefreshToken();
      const expiresAt = new Date(
        Date.now() + this.authEnv.refreshTtlDays * 24 * 60 * 60 * 1000,
      );

      const oldRt = await this.refreshRepo.findByHash(tx, tokenHash);
      if (oldRt) {
        oldRt.stateConceptId = CONCEPTS.STATE_ROTATED;
        touch(oldRt, session.userId);
      }

      this.refreshRepo.create(tx, {
        sessionId: session.id,
        tokenHash: hash,
        expiresAt,
        replacedById: oldRt?.id,
      });

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_TOKEN_REFRESH,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: session.userId,
      });

      return { accessToken, refreshToken: raw, expiresAt };
    });
  }

  /** UC-01-08: revoca todas las sesiones activas del usuario actual. */
  async logoutAll(actor: AuthenticatedUser): Promise<LogoutAllResultDto> {
    this.logger.info(
      { operation: 'iam.auth.logout-all', userId: actor.id },
      'Global logout',
    );
    return this.em.transactional(async (tx) => {
      const sessionIds = await this.sessionsRepo.activeSessionIdsForUser(
        tx,
        actor.id,
      );
      const revokedSessions = await this.sessionsRepo.revokeAllActiveForUser(
        tx,
        actor.id,
      );
      await this.refreshRepo.revokeActiveBySessionIds(tx, sessionIds);

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGOUT_ALL,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: actor.id,
        recordedByUserId: actor.id,
      });

      return { revokedSessions };
    });
  }

  /** UC-01-11: expira sesiones y refresh tokens ya vencidos. */
  async purgeSessions(actor: AuthenticatedUser): Promise<PurgeResultDto> {
    this.logger.info(
      { operation: 'iam.auth.purge', actorId: actor.id },
      'Purging expired sessions',
    );
    return this.em.transactional(async (tx) => {
      const now = new Date();
      const expiredSessions = await this.sessionsRepo.purgeExpired(tx, now);
      const expiredTokens = await this.refreshRepo.purgeExpired(tx, now);

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_SESSION_PURGE,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        recordedByUserId: actor.id,
        detailJson: { expiredSessions, expiredTokens },
      });

      return { expiredSessions, expiredTokens };
    });
  }

  /** Registra un login fallido en su propia transacción (se confirma pese al throw). */
  private async recordLoginFailure(
    userId: string | undefined,
    ip: string | undefined,
    reason: string,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGIN_FAILED,
        outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
        userId,
        ip,
        detailJson: { reason },
      });
    });
    this.logger.warn({ operation: 'iam.auth.login', reason }, 'Login failed');
  }

  /**
   * Contraseña incorrecta: registra el fallo y, si se alcanza el umbral, crea el
   * bloqueo de cuenta y revoca sesiones (realiza UC-01-07 de forma automática).
   */
  private async handleFailedPassword(
    userId: string,
    ip: string | undefined,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGIN_FAILED,
        outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
        userId,
        ip,
        detailJson: { reason: 'bad-password' },
      });
      // Persistir el evento antes de contar para que el conteo lo incluya.
      await tx.flush();

      const user = await this.usersRepo.findById(tx, userId);
      const failedCount = await this.eventsRepo.countFailedLoginsSince(
        tx,
        userId,
        user?.lastLoginAt,
      );

      if (failedCount >= this.authEnv.lockThreshold) {
        this.logger.warn(
          {
            operation: 'iam.auth.login',
            userId,
            failedCount,
            reason: 'lock-threshold',
          },
          'Account locked after repeated failures',
        );
        if (user) {
          user.statusConceptId = CONCEPTS.USER_LOCKED;
          touch(user, userId);
        }

        const existingLock = await this.lockoutsRepo.findActiveForUser(
          tx,
          userId,
        );
        if (existingLock) {
          existingLock.failedAttempts = failedCount;
          touch(existingLock, userId);
        } else {
          this.lockoutsRepo.create(tx, {
            userId,
            reasonConceptId: CONCEPTS.LOCK_REASON_FAILED_ATTEMPTS,
            failedAttempts: failedCount,
            sourceIp: ip,
          });
        }

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
          ip,
          detailJson: { failedAttempts: failedCount, source: 'auto' },
        });
      }
    });
  }
}
