import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { generateSecret, generateURI, verify as verifyTotp } from 'otplib';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  decryptSecret,
  encryptSecret,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  UsersRepository,
  MfaFactorsRepository,
  SecurityEventsRepository,
} from '../repositories';
import { MfaFactorDto, MfaFactorResponseDto } from '../dto';

/**
 * Roles que pueden enrolar o verificar un factor sobre una cuenta que no es la
 * propia. Son los mismos que administran el resto de `/iam/users/:id` (todas
 * esas rutas llevan `@Roles('SECURITY_ADMIN')`; `SUPERADMIN` pasa cualquier
 * `@Roles`, ver `roles.guard.ts`).
 */
const ROLES_QUE_ADMINISTRAN_MFA: readonly string[] = [
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
   */
  constructor(
    private readonly em: EntityManager,
    private readonly usersRepo: UsersRepository,
    private readonly mfaRepo: MfaFactorsRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IamMfaService.name);
  }

  /** UC-01-03: enrola un factor nuevo o verifica uno existente. */
  async enrollOrVerify(
    userId: string,
    dto: MfaFactorDto,
    actor: AuthenticatedUser,
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
      !actor.roles.some((rol) => ROLES_QUE_ADMINISTRAN_MFA.includes(rol))
    ) {
      this.logger.warn(
        { operation: 'iam.mfa.forbidden', userId, actorId: actor.id },
        'MFA factor request over another account rejected',
      );
      throw new ForbiddenException(
        'No tiene acceso a los factores MFA de esta cuenta',
      );
    }

    return this.em.transactional(async (tx) => {
      const user = await this.usersRepo.findById(tx, userId);
      if (!user)
        throw new ResourceNotFoundException('Usuario no encontrado', {
          userId,
        });

      if (dto.verify) {
        this.logger.info(
          { operation: 'iam.mfa.verify', userId, factorId: dto.factorId },
          'Verifying MFA factor',
        );
        if (!dto.factorId) {
          throw new PreconditionFailedException(
            'factorId es obligatorio para verificar',
          );
        }
        const factor = await this.mfaRepo.findByIdAndUser(
          tx,
          dto.factorId,
          userId,
        );
        if (!factor) {
          throw new ResourceNotFoundException('Factor MFA no encontrado', {
            userId,
            factorId: dto.factorId,
          });
        }

        // El código es obligatorio para verificar un factor TOTP.
        if (!dto.code) {
          throw new PreconditionFailedException(
            'code es obligatorio para verificar',
          );
        }

        // El secreto se guardó cifrado al enrolar; sin él no se puede validar.
        if (!factor.secretEncrypted) {
          throw new PreconditionFailedException(
            'El factor no tiene un secreto TOTP asociado',
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
          throw new PreconditionFailedException('Código MFA inválido');
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
