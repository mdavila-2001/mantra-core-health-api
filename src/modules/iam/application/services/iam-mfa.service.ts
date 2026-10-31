import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import * as argon2 from 'argon2';
import { generateSecret, generateURI, verify as verifyTotp } from 'otplib';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  decryptSecret,
  encryptSecret,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import { IamErrorReason } from '../../iam.error-reasons';
import {
  CredentialsRepository,
  UsersRepository,
  MfaFactorsRepository,
  SecurityEventsRepository,
} from '../../infrastructure/repositories';
import { MfaFactorDto, MfaFactorResponseDto } from '../../presentation/dto';
import { IamTotpService } from './iam-totp.service';

/** Con qué prueba la persona que es ella al añadir o quitar un factor. */
export interface Reauthentication {
  /** Contraseña actual. */
  readonly currentPassword?: string;
  /** Código vigente de un factor ya verificado. */
  readonly mfaCode?: string;
}

/**
 * Roles que pueden enrolar o verificar un factor sobre una cuenta que no es la
 * propia. Son los mismos que administran el resto de `/iam/users/:id` (todas
 * esas rutas llevan `@Roles('SECURITY_ADMIN')`; `SUPERADMIN` pasa cualquier
 * `@Roles`, ver `roles.guard.ts`).
 */
const ROLES_THAT_MANAGE_MFA: readonly string[] = [
  'SECURITY_ADMIN',
  'SUPERADMIN',
];

/**
 * Enrolamiento y verificación de factores MFA (UC-01-03). El mismo endpoint sirve
 * para dar de alta un factor (PENDING) o para verificar uno existente, lo que
 * además habilita el MFA a nivel de usuario.
 */
@Injectable()
export class IamMfaService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param usersRepo - Valor de users repo requerido por la operación.
   * @param mfaRepo - Valor de mfa repo requerido por la operación.
   * @param eventsRepo - Valor de events repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   * @param credentialsRepo - Credenciales, para reautenticar con la contraseña.
   * @param totp - Códigos TOTP de un solo uso, para reautenticar con un factor.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly usersRepo: UsersRepository,
    private readonly mfaRepo: MfaFactorsRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly logger: PinoLogger,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly totp: IamTotpService,
  ) {
    this.logger.setContext(IamMfaService.name);
  }

  /**
   * Exige que quien añade o quita un factor DE SU PROPIA cuenta pruebe que es la
   * titular: la contraseña actual o el código de un factor ya verificado. Un
   * token robado (XSS, equipo desatendido) no basta: sin esto, quien lo tuviera
   * añadía su propio TOTP, que el login acepta como cualquier otro factor, y
   * dejaba una puerta trasera permanente (o bloqueaba a la dueña cuando una
   * política exigiera el segundo paso).
   *
   * No es 401 a propósito: el cliente cierra la sesión ante un 401 y aquí la
   * sesión es válida. Cada fallo deja un evento de seguridad.
   *
   * @param userId - Titular.
   * @param proof - Contraseña o código presentados.
   * @param ip - Origen, para el evento de seguridad.
   * @throws PreconditionFailedException `MFA_REAUTH_REQUIRED` si no se presenta
   *   ninguna prueba, `MFA_REAUTH_FAILED` si no valen.
   */
  async assertReauthenticated(
    userId: string,
    proof: Reauthentication,
    ip?: string,
  ): Promise<void> {
    if (!proof.currentPassword && !proof.mfaCode) {
      throw new PreconditionFailedException(
        'Para añadir o quitar un factor confirme su contraseña actual o un código de su app autenticadora',
        undefined,
        IamErrorReason.MFA_REAUTH_REQUIRED,
      );
    }
    const ok = proof.currentPassword
      ? await this.passwordMatches(userId, proof.currentPassword)
      : await this.codeMatches(userId, proof.mfaCode as string);
    if (ok) return;
    const auditEm = this.em.fork();
    this.eventsRepo.record(auditEm, {
      eventTypeConceptId: CONCEPTS.SEC_LOGIN_FAILED,
      outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
      userId,
      recordedByUserId: userId,
      ip,
      detailJson: { reason: 'reauth-failed', flow: 'mfa-factor' },
    });
    await auditEm.flush();
    throw new PreconditionFailedException(
      'La contraseña o el código no coinciden',
      undefined,
      IamErrorReason.MFA_REAUTH_FAILED,
    );
  }

  private async passwordMatches(
    userId: string,
    password: string,
  ): Promise<boolean> {
    const credential = await this.credentialsRepo.findActivePasswordByUser(
      this.em.fork(),
      userId,
    );
    if (!credential?.secretHash) return false;
    return argon2.verify(credential.secretHash, password).catch(() => false);
  }

  private async codeMatches(userId: string, code: string): Promise<boolean> {
    const factors = (
      await this.mfaRepo.findVerifiedByUser(this.em.fork(), userId)
    ).filter((factor) => !!factor.secretEncrypted);
    if (factors.length === 0) return false;
    return (await this.totp.consume(userId, factors, code)).valid;
  }

  /**
   * UC-01-03: enrola un factor nuevo o verifica uno existente.
   *
   * Enrolar un factor de la propia cuenta exige reautenticación (contraseña
   * actual o código de un factor verificado en `dto`); quien administra la
   * seguridad de OTRA cuenta no tiene con qué reautenticar al titular y queda
   * como estaba. `options.reauthenticated` lo marca cuando el llamador ya lo
   * comprobó (el alta propia de `IamMyMfaService`).
   */
  async enrollOrVerify(
    userId: string,
    dto: MfaFactorDto,
    actor: AuthenticatedUser,
    options: { readonly reauthenticated?: boolean } = {},
  ): Promise<MfaFactorResponseDto> {
    // Titularidad. La ruta `POST /iam/users/:id/mfa-factors` no lleva `@Roles`
    // —cualquier sesión la alcanza— y este servicio no miraba quién era el actor:
    // verificado contra la API viva el 2026-09-26, una paciente enroló un factor
    // TOTP sobre la cuenta de otra (201) y quedó en `iam.mfa_factors` con el
    // `user_id` ajeno. Un factor lo enrola o verifica su dueño, o un
    // administrador de seguridad; para cualquier otro la cuenta ni existe (403
    // genérico, sin confirmar el id).
    if (
      actor.id !== userId &&
      !actor.roles.some((role) => ROLES_THAT_MANAGE_MFA.includes(role))
    ) {
      this.logger.warn(
        { operation: 'iam.mfa.forbidden', userId, actorId: actor.id },
        'MFA factor request over another account rejected',
      );
      throw new ForbiddenException(
        'No tiene acceso a los factores MFA de esta cuenta',
      );
    }

    if (!dto.verify && actor.id === userId && !options.reauthenticated) {
      await this.assertReauthenticated(userId, dto);
    }

    return this.em.transactional(async (tx) => {
      const user = await this.usersRepo.findById(tx, userId);
      if (!user)
        throw new ResourceNotFoundException(
          'Usuario no encontrado',
          { userId },
          IamErrorReason.USER_NOT_FOUND,
        );

      if (dto.verify) {
        this.logger.info(
          { operation: 'iam.mfa.verify', userId, factorId: dto.factorId },
          'Verifying MFA factor',
        );
        if (!dto.factorId) {
          throw new PreconditionFailedException(
            'factorId es obligatorio para verificar',
            undefined,
            IamErrorReason.MFA_FACTOR_ID_REQUIRED_TO_VERIFY,
          );
        }
        const factor = await this.mfaRepo.findByIdAndUser(
          tx,
          dto.factorId,
          userId,
        );
        if (!factor) {
          throw new ResourceNotFoundException(
            'Factor MFA no encontrado',
            { userId, factorId: dto.factorId },
            IamErrorReason.MFA_FACTOR_NOT_FOUND,
          );
        }

        // El código es obligatorio para verificar un factor TOTP.
        if (!dto.code) {
          throw new PreconditionFailedException(
            'code es obligatorio para verificar',
            undefined,
            IamErrorReason.MFA_CODE_REQUIRED_TO_VERIFY,
          );
        }

        // El secreto se guardó cifrado al enrolar; sin él no se puede validar.
        if (!factor.secretEncrypted) {
          throw new PreconditionFailedException(
            'El factor no tiene un secreto TOTP asociado',
            undefined,
            IamErrorReason.MFA_FACTOR_MISSING_SECRET,
          );
        }

        const secret = decryptSecret(factor.secretEncrypted);
        const result = await verifyTotp({ token: dto.code, secret });
        if (!result.valid) {
          // Registrar el intento fallido como evento de seguridad ANTES de abortar.
          // Se usa un EntityManager independiente (fork + flush) porque al lanzar
          // la excepción la transacción principal hace rollback: si el evento se
          // registrara sobre `tx` se perdería, y el log de auditoría es append-only.
          const auditEm = this.em.fork();
          this.eventsRepo.record(auditEm, {
            eventTypeConceptId: CONCEPTS.SEC_MFA_ENROLL,
            outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
            userId,
            recordedByUserId: actor.id,
            detailJson: { factorId: factor.id, action: 'verify' },
          });
          await auditEm.flush();
          throw new PreconditionFailedException(
            'Código MFA inválido',
            undefined,
            IamErrorReason.MFA_CODE_INVALID,
          );
        }

        factor.stateConceptId = CONCEPTS.STATE_VERIFIED;
        factor.verifiedAt = new Date();
        touch(factor, actor.id);

        user.mfaStatusConceptId = CONCEPTS.MFA_ENABLED;
        touch(user, actor.id);

        this.eventsRepo.record(tx, {
          eventTypeConceptId: CONCEPTS.SEC_MFA_ENROLL,
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
          userId,
          recordedByUserId: actor.id,
          detailJson: { factorId: factor.id, action: 'verify' },
        });

        return {
          id: factor.id,
          userId,
          state: factor.stateConceptId,
          verifiedAt: factor.verifiedAt,
        };
      }

      this.logger.info(
        { operation: 'iam.mfa.enroll', userId, factorType: dto.factorType },
        'Enrolling MFA factor',
      );
      if (!dto.factorType) {
        throw new PreconditionFailedException(
          'factorType es obligatorio para enrolar',
          undefined,
          IamErrorReason.MFA_FACTOR_TYPE_REQUIRED_TO_ENROLL,
        );
      }
      const factorTypeConceptId =
        dto.factorType === 'TOTP' ? CONCEPTS.MFA_TOTP : CONCEPTS.MFA_WEBAUTHN;

      const factor = this.mfaRepo.create(tx, {
        userId,
        factorTypeConceptId,
        label: dto.label,
        actorUserId: actor.id,
      });

      // Para TOTP se genera un secreto, se guarda cifrado y se devuelve una sola
      // vez (junto con el URI otpauth://) para que el usuario lo cargue en su app
      // autenticadora. Para WEBAUTHN se mantiene el comportamiento actual.
      let secret: string | undefined;
      let otpauthUri: string | undefined;
      if (dto.factorType === 'TOTP') {
        secret = generateSecret();
        factor.secretEncrypted = encryptSecret(secret);
        otpauthUri = generateURI({
          issuer: 'ALOVIDA Health',
          label: user.displayName ?? userId,
          secret,
        });
      }

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_MFA_ENROLL,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId,
        recordedByUserId: actor.id,
        detailJson: { action: 'enroll', factorType: dto.factorType },
      });

      return {
        id: factor.id,
        userId,
        state: factor.stateConceptId,
        verifiedAt: undefined,
        secret,
        otpauthUri,
      };
    });
  }
}
