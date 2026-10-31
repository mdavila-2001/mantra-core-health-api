import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import { IamErrorReason } from '../../iam.error-reasons';
import {
  MfaFactorsRepository,
  SecurityEventsRepository,
  UsersRepository,
} from '../../infrastructure/repositories';
import type {
  ConfirmMyTotpDto,
  ConfirmMyTotpResultDto,
  MfaFactorResponseDto,
  MyMfaFactorDto,
  MyMfaStatusDto,
  RevokeMyMfaDto,
  RevokeMyMfaResultDto,
  StartMyTotpDto,
} from '../../presentation/dto';
import { IamMfaService } from './iam-mfa.service';
import { SessionPoliciesService } from './session-policies.service';

const TYPE_CODE: Readonly<Record<string, string>> = {
  [CONCEPTS.MFA_TOTP]: 'TOTP',
  [CONCEPTS.MFA_WEBAUTHN]: 'WEBAUTHN',
};
const STATE_CODE: Readonly<Record<string, string>> = {
  [CONCEPTS.STATE_PENDING]: 'PENDING',
  [CONCEPTS.STATE_VERIFIED]: 'VERIFIED',
  [CONCEPTS.STATE_REVOKED]: 'REVOKED',
};

/**
 * Segundo paso de la propia cuenta: ver su estado, dar de alta una app
 * autenticadora (TOTP) y confirmarla con un código. Es la salida de quien inicia
 * sesión con `mfaEnrollmentRequired`: el login lo deja entrar justamente para
 * poder hacerlo. Todo opera sobre el `id` del token, nunca sobre un id ajeno, y
 * delega el alta y la verificación en `IamMfaService`, que es quien cifra el
 * secreto y registra el evento de seguridad.
 */
@Injectable()
export class IamMyMfaService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param mfaRepo - Factores MFA.
   * @param mfa - Alta y verificación de factores.
   * @param sessionPolicies - Políticas de sesión de las organizaciones.
   * @param logger - Logger estructurado.
   * @param usersRepo - Usuarios.
   * @param eventsRepo - Eventos de seguridad.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly mfaRepo: MfaFactorsRepository,
    private readonly mfa: IamMfaService,
    private readonly sessionPolicies: SessionPoliciesService,
    private readonly logger: PinoLogger,
    private readonly usersRepo: UsersRepository,
    private readonly eventsRepo: SecurityEventsRepository,
  ) {
    this.logger.setContext(IamMyMfaService.name);
  }

  /**
   * Estado del segundo paso: si alguna política lo exige y qué factores tiene.
   *
   * @param actor - Sujeto autenticado.
   * @returns Exigencia, alta y factores (sin secretos).
   */
  async status(actor: AuthenticatedUser): Promise<MyMfaStatusDto> {
    const em = this.em.fork();
    // Con el token de alcance limitado (o con organizaciones que lo niegan por el
    // segundo factor) las organizaciones que lo exigen no figuran en
    // `tenantIds`: el token mismo dice que la exigencia existe.
    const deniedByMfa = Object.values(actor.deniedTenants ?? {}).some(
      (reason) => reason.startsWith('MFA_'),
    );
    const rules = await this.sessionPolicies.rulesFor(
      em,
      [...(actor.tenantIds ?? []), ...Object.keys(actor.deniedTenants ?? {})],
      actor.roles,
      actor.scopedRoles,
    );
    const rows = await this.mfaRepo.findByUser(em, actor.id);
    const factors: MyMfaFactorDto[] = rows
      .filter((f) => f.stateConceptId !== CONCEPTS.STATE_REVOKED)
      .map((f) => ({
        id: f.id,
        type: TYPE_CODE[f.factorTypeConceptId] ?? 'UNKNOWN',
        state: STATE_CODE[f.stateConceptId] ?? 'UNKNOWN',
        label: f.label ?? undefined,
        verifiedAt: f.verifiedAt ?? undefined,
        createdAt: f.createdAt,
      }));
    const enrolled = factors.some((f) => f.state === 'VERIFIED');
    const required =
      rules.requireMfa || deniedByMfa || actor.mfaEnrollment === true;
    return {
      required,
      enrolled,
      enrollmentRequired: required && !enrolled,
      factors,
    };
  }

  /**
   * Empieza el alta de una app autenticadora: exige reautenticación (contraseña
   * actual o código de un factor ya verificado), retira los intentos anteriores
   * sin confirmar (no se acumulan secretos que nadie va a usar) y devuelve, una
   * sola vez, el secreto y la URI `otpauth://` para el QR.
   *
   * @param actor - Sujeto autenticado.
   * @param dto - Nombre opcional del factor y la prueba de reautenticación.
   * @param ip - Origen, para el evento de seguridad si la prueba falla.
   * @returns El factor pendiente con su secreto.
   * @throws PreconditionFailedException `MFA_REAUTH_REQUIRED` / `MFA_REAUTH_FAILED`.
   */
  async startTotp(
    actor: AuthenticatedUser,
    dto: StartMyTotpDto,
    ip?: string,
  ): Promise<MfaFactorResponseDto> {
    // Antes de tocar nada: sin reautenticar no se retira ni se crea ningún factor.
    await this.mfa.assertReauthenticated(actor.id, dto, ip);
    await this.em.transactional(async (tx) => {
      const stale = (await this.mfaRepo.findByUser(tx, actor.id)).filter(
        (f) =>
          f.stateConceptId === CONCEPTS.STATE_PENDING &&
          f.factorTypeConceptId === CONCEPTS.MFA_TOTP,
      );
      for (const factor of stale) {
        factor.stateConceptId = CONCEPTS.STATE_REVOKED;
        touch(factor, actor.id);
      }
    });
    return this.mfa.enrollOrVerify(
      actor.id,
      { factorType: 'TOTP', label: dto.label },
      actor,
      { reauthenticated: true },
    );
  }

  /**
   * Quita un factor propio. Exige reautenticación, igual que añadirlo: quien
   * tuviera un token robado no puede retirar el factor de la dueña para entrar
   * solo con la contraseña. Si era el último confirmado, el segundo paso de la
   * cuenta queda apagado (y una organización que lo exija vuelve a pedir el alta).
   *
   * @param actor - Sujeto autenticado.
   * @param factorId - Factor a retirar.
   * @param dto - Prueba de reautenticación.
   * @param ip - Origen, para el evento de seguridad.
   * @returns Cuántos factores confirmados le quedan.
   * @throws ResourceNotFoundException (404) si no existe o es de otra persona.
   */
  async revokeFactor(
    actor: AuthenticatedUser,
    factorId: string,
    dto: RevokeMyMfaDto,
    ip?: string,
  ): Promise<RevokeMyMfaResultDto> {
    await this.mfa.assertReauthenticated(actor.id, dto, ip);
    return this.em.transactional(async (tx) => {
      const factor = await this.mfaRepo.findByIdAndUser(tx, factorId, actor.id);
      if (!factor || factor.stateConceptId === CONCEPTS.STATE_REVOKED) {
        throw new ResourceNotFoundException(
          'Factor MFA no encontrado',
          { factorId },
          IamErrorReason.MFA_FACTOR_NOT_FOUND,
        );
      }
      factor.stateConceptId = CONCEPTS.STATE_REVOKED;
      touch(factor, actor.id);
      const remaining = (
        await this.mfaRepo.findVerifiedByUser(tx, actor.id)
      ).filter((f) => f.id !== factor.id).length;
      if (remaining === 0) {
        const user = await this.usersRepo.findById(tx, actor.id);
        if (user) {
          user.mfaStatusConceptId = CONCEPTS.MFA_DISABLED;
          touch(user, actor.id);
        }
      }
      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_MFA_ENROLL,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: actor.id,
        recordedByUserId: actor.id,
        ip,
        detailJson: { action: 'revoke', factorId: factor.id },
      });
      return { revoked: true, remainingVerified: remaining };
    });
  }

  /**
   * Confirma el factor con un código de la app. Un código inválido es 422 y deja
   * un evento de seguridad fallido; con uno válido el factor queda verificado y
   * la cuenta con segundo paso activo.
   *
   * @param actor - Sujeto autenticado.
   * @param factorId - Factor pendiente.
   * @param dto - Código de la app.
   * @returns El factor verificado.
   */
  async confirmTotp(
    actor: AuthenticatedUser,
    factorId: string,
    dto: ConfirmMyTotpDto,
  ): Promise<ConfirmMyTotpResultDto> {
    const own = await this.mfaRepo.findByIdAndUser(
      this.em.fork(),
      factorId,
      actor.id,
    );
    if (own?.stateConceptId === CONCEPTS.STATE_REVOKED) {
      throw new PreconditionFailedException(
        'El factor fue reemplazado por uno más reciente',
        { factorId },
        IamErrorReason.MFA_FACTOR_NOT_FOUND,
      );
    }
    const result = await this.mfa.enrollOrVerify(
      actor.id,
      { verify: true, factorId, code: dto.code },
      actor,
    );
    this.logger.info(
      { operation: 'iam.my_mfa.confirm', userId: actor.id, factorId },
      'Own TOTP factor confirmed',
    );
    return {
      verified: true,
      factorId: result.id,
      verifiedAt: result.verifiedAt ?? new Date(),
    };
  }
}
