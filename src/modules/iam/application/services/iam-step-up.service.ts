import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  loadAuthEnv,
  type AuthenticatedUser,
} from '../../../../common';
import { IamErrorReason } from '../../iam.error-reasons';
import { clampMaxAgeMinutes, isStepUpFresh } from '../../domain/step-up';
import { StepUpStorePort } from '../ports/step-up-store.port';
import {
  MfaFactorsRepository,
  SecurityEventsRepository,
  UsersRepository,
} from '../../infrastructure/repositories';
import type {
  StepUpDto,
  StepUpResultDto,
  StepUpStatusDto,
} from '../../presentation/dto';
import { StepUpUnavailableError } from '../ports/step-up.port';
import { IamTotpService } from './iam-totp.service';

/**
 * Paso extra de la propia sesión: la persona demuestra con el código de su app
 * autenticadora que sigue siendo ella y la sesión queda sellada (en Redis, con
 * TTL) para que las acciones que lo exigen lo comprueben a través de
 * `StepUpPort`. No cambia el token ni el login.
 *
 * ## Qué reutiliza
 *
 * - La verificación del segundo factor es la de `IamTotpService` (código de un
 *   solo uso: el mismo código no vale dos veces, ni aquí ni en el login).
 * - Un código malo deja el mismo evento que un fallo del segundo factor en el
 *   login (`SEC_LOGIN_FAILED`, `reason: 'bad-mfa'`), así que suma al MISMO
 *   contador. Al llegar al umbral (`ACCOUNT_LOCK_THRESHOLD`) deja de aceptar
 *   intentos hasta el próximo inicio de sesión: frena la adivinanza con un token
 *   robado sin bloquear la cuenta de su dueña (quien conoce la contraseña
 *   reinicia el contador al entrar).
 *
 * ## Contrato de errores
 *
 * Nunca 401 (el cliente cierra la sesión ante un 401 y aquí la sesión es válida):
 * 422 `MFA_NOT_ENROLLED` / `MFA_CODE_INVALID` / `STEP_UP_SESSION_REQUIRED`, 429
 * `STEP_UP_ATTEMPTS_EXCEEDED`, 503 `STEP_UP_UNAVAILABLE` (Redis caído: falla
 * cerrado).
 */
@Injectable()
export class IamStepUpService {
  private readonly lockThreshold = loadAuthEnv().lockThreshold;

  /**
   * @param em - Contexto de persistencia.
   * @param mfaRepo - Factores MFA.
   * @param totp - Códigos TOTP de un solo uso.
   * @param eventsRepo - Eventos de seguridad.
   * @param usersRepo - Usuarios (último inicio de sesión).
   * @param store - Sello del paso extra en Redis.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly mfaRepo: MfaFactorsRepository,
    private readonly totp: IamTotpService,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly usersRepo: UsersRepository,
    private readonly store: StepUpStorePort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IamStepUpService.name);
  }

  /**
   * Verifica el código y sella la sesión del token.
   *
   * @param actor - Sujeto autenticado; su `sessionId` es lo que se sella.
   * @param dto - Código de la app autenticadora.
   * @param ip - Origen, para el evento de seguridad si el código falla.
   * @returns Cuándo se verificó y cuánto vale el sello.
   */
  async verify(
    actor: AuthenticatedUser,
    dto: StepUpDto,
    ip?: string,
  ): Promise<StepUpResultDto> {
    const sessionId = actor.sessionId;
    if (!sessionId) {
      throw new PreconditionFailedException(
        'Esta sesión no admite la verificación adicional. Vuelva a iniciar sesión.',
        undefined,
        IamErrorReason.STEP_UP_SESSION_REQUIRED,
      );
    }
    const em = this.em.fork();
    const factors = (
      await this.mfaRepo.findVerifiedByUser(em, actor.id)
    ).filter((factor) => !!factor.secretEncrypted);
    if (factors.length === 0) {
      throw new PreconditionFailedException(
        'Para confirmar su identidad primero active la verificación en dos pasos en su cuenta',
        undefined,
        IamErrorReason.MFA_NOT_ENROLLED,
      );
    }

    // Antes de gastar el código de un solo uso: sin Redis no se podría sellar.
    await this.guardUnavailable(() => this.store.assertAvailable());

    // B-B10: comprobar el contador, gastar el código y anotar el fallo es UNA sección crítica por
    // persona (cerrojo `pg_advisory_xact_lock`). Sin ella, N peticiones paralelas con el mismo
    // token leían todas el mismo contador (check-then-act) y probaban N códigos antes de que el
    // primer fallo quedara anotado. El fallo se confirma ANTES de soltar el cerrojo.
    const outcome = await this.eventsRepo.withMfaAttemptLock(
      this.em,
      actor.id,
      async () => {
        await this.assertAttemptsLeft(em, actor.id);
        const result = await this.totp.consume(actor.id, factors, dto.code);
        if (!result.valid) await this.recordFailure(actor.id, ip);
        return result;
      },
    );
    if (!outcome.valid) {
      throw new PreconditionFailedException(
        'El código de verificación no es válido',
        undefined,
        IamErrorReason.MFA_CODE_INVALID,
      );
    }

    const stamp = await this.guardUnavailable(() =>
      this.store.stamp(sessionId),
    );
    this.logger.info(
      { operation: 'iam.step_up.verify', userId: actor.id },
      'Step-up verified',
    );
    return { verifiedAt: stamp.verifiedAt, validForMinutes: stamp.ttlMinutes };
  }

  /**
   * Estado del paso extra de la sesión del token.
   *
   * @param actor - Sujeto autenticado.
   * @param maxAgeMinutes - Edad máxima para contar como fresco (1-60, por defecto 10).
   * @returns Si hay sello fresco y su edad en minutos (2 decimales).
   * @throws DomainException 503 `STEP_UP_UNAVAILABLE` si no se puede comprobar.
   */
  async status(
    actor: AuthenticatedUser,
    maxAgeMinutes?: number,
  ): Promise<StepUpStatusDto> {
    if (!actor.sessionId) return { fresh: false, ageMinutes: null };
    const sessionId = actor.sessionId;
    const age = await this.guardUnavailable(() =>
      this.store.ageMinutes(sessionId),
    );
    return {
      fresh: isStepUpFresh(age, clampMaxAgeMinutes(maxAgeMinutes)),
      ageMinutes: age === null ? null : Math.round(age * 100) / 100,
    };
  }

  /** 429 si los fallos del segundo factor desde el último login ya llegaron al umbral. */
  private async assertAttemptsLeft(
    em: EntityManager,
    userId: string,
  ): Promise<void> {
    const user = await this.usersRepo.findById(em, userId);
    const failed = await this.eventsRepo.countFailedMfaSince(
      em,
      userId,
      user?.lastLoginAt ?? undefined,
    );
    if (failed < this.lockThreshold) return;
    this.logger.warn(
      { operation: 'iam.step_up.blocked', userId, failedCount: failed },
      'Step-up attempts exceeded',
    );
    throw new DomainException(
      HttpStatus.TOO_MANY_REQUESTS,
      ErrorCode.RATE_LIMITED,
      'Demasiados códigos incorrectos. Cierre sesión e inicie sesión de nuevo para continuar.',
      undefined,
      IamErrorReason.STEP_UP_ATTEMPTS_EXCEEDED,
    );
  }

  /** Deja el fallo del segundo factor en el mismo contador que usa el login. */
  private async recordFailure(userId: string, ip?: string): Promise<void> {
    const auditEm = this.em.fork();
    this.eventsRepo.record(auditEm, {
      eventTypeConceptId: CONCEPTS.SEC_LOGIN_FAILED,
      outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
      userId,
      recordedByUserId: userId,
      ip,
      detailJson: { reason: 'bad-mfa', flow: 'step-up' },
    });
    await auditEm.flush();
    this.logger.warn(
      { operation: 'iam.step_up.failed', userId },
      'Step-up code rejected',
    );
  }

  /** Traduce «Redis no disponible» a 503 `STEP_UP_UNAVAILABLE`; el resto pasa igual. */
  private async guardUnavailable<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (err) {
      if (err instanceof StepUpUnavailableError) {
        throw new DomainException(
          HttpStatus.SERVICE_UNAVAILABLE,
          ErrorCode.DEPENDENCY_UNAVAILABLE,
          'No se pudo comprobar la verificación en dos pasos. Intente de nuevo en un momento.',
          undefined,
          IamErrorReason.STEP_UP_UNAVAILABLE,
        );
      }
      throw err;
    }
  }
}
