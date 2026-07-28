import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import * as argon2 from 'argon2';
import {
  CONCEPTS,
  ConflictException,
  TokenService,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  UsersRepository,
  CredentialsRepository,
  UserGlobalRolesRepository,
  AccountActivationsRepository,
  SecurityEventsRepository,
} from '../repositories';
import {
  AssistedRegistrationDto,
  AssistedRegistrationResponseDto,
  ActivateAccountDto,
  ActivationResultDto,
} from '../dto';
import { ROLE_CONCEPT_BY_CODE } from './role-mapping';

/** Vida útil del token de activación de un solo uso (72 h). */
const ACTIVATION_TTL_MS = 72 * 60 * 60 * 1000;

/**
 * Registro asistido de pacientes (C-18 / CAN-IDENT).
 *
 * Un clínico u organización crea la cuenta de un paciente que no puede hacerlo por
 * sí mismo. Reglas C-18 que implementa este servicio:
 *  - El creador NO conoce ni conserva la contraseña definitiva: la cuenta nace en
 *    estado PENDING (reutiliza `STATE_PENDING`) con `mustChangePassword` y una
 *    credencial de contraseña PENDIENTE sin secreto.
 *  - Se emite un token de activación de un solo uso de alta entropía del que solo
 *    se persiste su HASH con expiración (reutiliza `TokenService.issueRefreshToken`
 *    y su hash SHA-256).
 *  - Antes de crear se busca coincidencia por el identificador verificado (email):
 *    si ya existe una cuenta se rechaza (conflicto) y se sugiere invitar en vez de
 *    duplicar.
 *  - Trazabilidad completa: creador, motivo, fecha y representación legal quedan en
 *    `iam.account_activations`, y cada paso emite un evento de seguridad.
 *  - En la activación el titular fija su propia contraseña (argon2id) y la cuenta
 *    pasa a ACTIVE; el creador nunca ve esa contraseña.
 *
 * Nota de conceptos: no se introducen conceptos nuevos. El evento de creación
 * asistida reutiliza `SEC_ROLE_GRANT` (igual que el alta ordinaria de usuario) y la
 * activación —primera autenticación del titular— reutiliza `SEC_LOGIN` /
 * `SEC_LOGIN_FAILED`, discriminando el flujo en `detailJson`.
 */
@Injectable()
export class IamAssistedRegistrationService {
  constructor(
    private readonly em: EntityManager,
    private readonly tokenService: TokenService,
    private readonly usersRepo: UsersRepository,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly rolesRepo: UserGlobalRolesRepository,
    private readonly activationsRepo: AccountActivationsRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IamAssistedRegistrationService.name);
  }

  /**
   * C-18: crea la cuenta del paciente en estado pendiente y devuelve el token de
   * activación de un solo uso (nunca una contraseña).
   */
  async assistedRegistration(
    dto: AssistedRegistrationDto,
    actor: AuthenticatedUser,
  ): Promise<AssistedRegistrationResponseDto> {
    this.logger.info(
      { operation: 'iam.user.assisted-registration', actorId: actor.id },
      'Assisted patient registration',
    );
    return this.em.transactional(async (tx) => {
      // Evitar duplicados: si el identificador verificado ya tiene una credencial
      // viva (activa o pendiente), NO se crea otra cuenta; se sugiere invitar.
      const existing = await this.credentialsRepo.findLivePasswordBySubject(
        tx,
        dto.email,
      );
      if (existing) {
        this.logger.warn(
          {
            operation: 'iam.user.assisted-registration',
            reason: 'identifier-in-use',
          },
          'Rejected assisted registration: identifier already exists (prefer invitation)',
        );
        throw new ConflictException(
          'Ya existe una cuenta con ese identificador; prefiera invitar en lugar de crear un duplicado',
          { email: dto.email, suggestion: 'invitation' },
        );
      }

      // Cuenta en estado PENDING, sin contraseña definitiva y con cambio exigido.
      const user = this.usersRepo.create(tx, {
        displayName: dto.displayName,
        statusConceptId: CONCEPTS.STATE_PENDING,
        mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
        timeZone: dto.timeZone,
        mustChangePassword: true,
        actorUserId: actor.id,
      });
      // FK son columnas uuid: persistir el padre antes de los hijos.
      await tx.flush();

      // Credencial de contraseña PENDIENTE (reserva el login, sin secreto todavía).
      this.credentialsRepo.createPendingPassword(tx, {
        userId: user.id,
        externalSubject: dto.email,
        actorUserId: actor.id,
      });

      // Rol base del paciente.
      this.rolesRepo.create(tx, {
        userId: user.id,
        roleConceptId: ROLE_CONCEPT_BY_CODE.USER,
        actorUserId: actor.id,
      });

      // Token de activación de un solo uso: solo se persiste su hash + expiración.
      const { raw, hash } = this.tokenService.issueRefreshToken();
      const expiresAt = new Date(Date.now() + ACTIVATION_TTL_MS);
      this.activationsRepo.create(tx, {
        userId: user.id,
        tokenHash: hash,
        expiresAt,
        reason: dto.reason,
        legalRepresentationId: dto.legalRepresentationId,
        legalRepresentativeUserId: dto.legalRepresentativeUserId,
        actorUserId: actor.id,
      });

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_ROLE_GRANT,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: user.id,
        recordedByUserId: actor.id,
        detailJson: {
          flow: 'assisted-registration',
          reason: dto.reason,
          createdBy: actor.id,
          legalRepresentationId: dto.legalRepresentationId,
          legalRepresentativeUserId: dto.legalRepresentativeUserId,
        },
      });

      this.logger.info(
        { operation: 'iam.user.assisted-registration', userId: user.id },
        'Assisted account created (pending activation)',
      );
      return {
        userId: user.id,
        activationToken: raw,
        activationExpiresAt: expiresAt,
        status: 'PENDING_ACTIVATION',
      };
    });
  }

  /**
   * C-18: el titular consume el token de activación de un solo uso, fija su
   * contraseña definitiva (argon2id) y activa la cuenta. Idempotencia de un solo
   * uso: un token ya consumido o expirado se rechaza.
   */
  async activateAccount(
    dto: ActivateAccountDto,
    ip?: string,
  ): Promise<ActivationResultDto> {
    const tokenHash = this.tokenService.hashRefreshToken(dto.activationToken);
    const readEm = this.em.fork();
    const activation = await this.activationsRepo.findByTokenHash(
      readEm,
      tokenHash,
    );
    if (!activation) {
      await this.recordActivationFailure(undefined, ip, 'token-not-found');
      throw new UnauthorizedException('Token de activación inválido');
    }

    if (activation.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
      // Un solo uso: el token ya se consumió o se invalidó.
      await this.recordActivationFailure(
        activation.userId,
        ip,
        'token-already-used',
      );
      throw new UnauthorizedException('El token de activación ya fue utilizado');
    }

    if (activation.expiresAt.getTime() < Date.now()) {
      await this.em.transactional(async (tx) => {
        const managed = await this.activationsRepo.findByTokenHash(
          tx,
          tokenHash,
        );
        if (managed) {
          managed.stateConceptId = CONCEPTS.STATE_EXPIRED;
          touch(managed, activation.userId);
        }
        this.eventsRepo.record(tx, {
          eventTypeConceptId: CONCEPTS.SEC_LOGIN_FAILED,
          outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
          userId: activation.userId,
          ip,
          detailJson: { flow: 'account-activation', reason: 'token-expired' },
        });
      });
      throw new UnauthorizedException('El token de activación expiró');
    }

    return this.em.transactional(async (tx) => {
      // Recheck bajo transacción para blindar el un-solo-uso ante concurrencia.
      const managed = await this.activationsRepo.findByTokenHash(tx, tokenHash);
      if (!managed || managed.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new UnauthorizedException(
          'El token de activación ya fue utilizado',
        );
      }

      const user = await this.usersRepo.findById(tx, managed.userId);
      if (!user) {
        throw new UnauthorizedException('Token de activación inválido');
      }

      // Fijar la contraseña elegida por el titular sobre la credencial pendiente.
      const cred = await this.credentialsRepo.findPendingPasswordByUser(
        tx,
        user.id,
      );
      if (!cred) {
        throw new UnauthorizedException('Token de activación inválido');
      }
      cred.secretHash = await argon2.hash(dto.newPassword);
      cred.hashAlgorithmConceptId = CONCEPTS.HASH_ARGON2ID;
      cred.stateConceptId = CONCEPTS.STATE_ACTIVE;
      touch(cred, user.id);

      // Consumir el token (un solo uso) y activar la cuenta.
      managed.stateConceptId = CONCEPTS.STATE_VERIFIED;
      managed.consumedAt = new Date();
      touch(managed, user.id);

      user.statusConceptId = CONCEPTS.USER_ACTIVE;
      // El titular ya fijó su propia contraseña: no se exige otro cambio.
      user.mustChangePassword = false;
      touch(user, user.id);

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGIN,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: user.id,
        ip,
        detailJson: { flow: 'account-activation' },
      });

      this.logger.info(
        { operation: 'iam.auth.activate', userId: user.id },
        'Account activated',
      );
      return { userId: user.id, status: 'ACTIVE', activated: true };
    });
  }

  /** Registra un fallo de activación en su propia transacción (se confirma pese al throw). */
  private async recordActivationFailure(
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
        detailJson: { flow: 'account-activation', reason },
      });
    });
    this.logger.warn(
      { operation: 'iam.auth.activate', reason },
      'Account activation failed',
    );
  }
}
