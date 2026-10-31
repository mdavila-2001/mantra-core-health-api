import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import * as argon2 from 'argon2';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  loadAuthEnv,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import {
  deviceCodeDigest,
  deviceConfirmationCode,
  isDeviceConfirmationCodeValid,
  maskEmail,
} from '../../domain/device-confirmation-code';
import { IamErrorReason } from '../../iam.error-reasons';
import { StepUpStorePort } from '../ports/step-up-store.port';
import {
  CredentialsRepository,
  DevicesRepository,
  EmailVerificationsRepository,
  RefreshTokensRepository,
  SecurityEventsRepository,
  SessionsRepository,
} from '../../infrastructure/repositories';
import type {
  ChangePasswordDto,
  ChangePasswordResultDto,
  ConfirmDeviceResultDto,
  MySessionDto,
  ReportDeviceNotMeResultDto,
  RequestDeviceCodeResultDto,
  RevokeMySessionResultDto,
} from '../../presentation/dto';
import {
  EMAIL_NOTICE_PORT,
  type EmailNoticePort,
} from '../ports/email-notice.port';

/**
 * Seguridad de la propia cuenta (ID-24): cambiar la contraseña y ver o cerrar
 * las sesiones abiertas. Todo se resuelve por el `id` del token, nunca por un
 * identificador del cuerpo: nadie puede tocar la cuenta de otro.
 */
@Injectable()
export class IamAccountSecurityService {
  private readonly secret = loadAuthEnv().secret;

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param credentialsRepo - Credenciales.
   * @param sessionsRepo - Sesiones.
   * @param refreshRepo - Refresh tokens.
   * @param eventsRepo - Eventos de seguridad.
   * @param logger - Logger.
   * @param devicesRepo - Dispositivos.
   * @param emailVerifications - Correos verificados, destino del código de «Fui yo».
   * @param notices - Encolado de correos transaccionales.
   * @param stepUp - Sello del paso extra por sesión (se borra al cerrar una sesión).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly sessionsRepo: SessionsRepository,
    private readonly refreshRepo: RefreshTokensRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly logger: PinoLogger,
    private readonly devicesRepo: DevicesRepository,
    private readonly emailVerifications?: EmailVerificationsRepository,
    @Inject(EMAIL_NOTICE_PORT)
    private readonly notices?: EmailNoticePort,
    private readonly stepUp?: StepUpStorePort,
  ) {
    this.logger.setContext(IamAccountSecurityService.name);
  }

  /**
   * Cambia la contraseña del titular y cierra las **otras** sesiones.
   *
   * La sesión desde la que se cambia sigue viva: la persona acaba de probar que
   * es ella. Un caso de uso, una transacción: credencial nueva y revocación
   * salen juntas o no salen.
   *
   * @param actor - Sujeto autenticado.
   * @param dto - Contraseña actual y nueva.
   * @param ip - Origen, para el evento de seguridad.
   * @returns Cuántas sesiones ajenas se cerraron.
   * @throws PreconditionFailedException (422) si la actual no coincide, si la
   *   nueva es igual o si la cuenta no tiene contraseña. No es 401 a propósito:
   *   el cliente cierra la sesión ante un 401 y aquí la sesión es válida.
   */
  async changePassword(
    actor: AuthenticatedUser,
    dto: ChangePasswordDto,
    ip?: string,
  ): Promise<ChangePasswordResultDto> {
    const readEm = this.em.fork();
    const current = await this.credentialsRepo.findActivePasswordByUser(
      readEm,
      actor.id,
    );
    if (!current?.secretHash) {
      throw new PreconditionFailedException(
        'La cuenta no tiene una contraseña que cambiar',
        { reason: 'NO_PASSWORD_CREDENTIAL' },
      );
    }
    const matches = await argon2
      .verify(current.secretHash, dto.currentPassword)
      .catch(() => false);
    if (!matches) {
      throw new PreconditionFailedException(
        'La contraseña actual no coincide',
        {
          reason: 'CURRENT_PASSWORD_INVALID',
        },
      );
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new PreconditionFailedException(
        'La contraseña nueva tiene que ser distinta de la actual',
        { reason: 'PASSWORD_UNCHANGED' },
      );
    }
    // argon2 tarda a propósito: se calcula antes de abrir la transacción.
    const secretHash = await argon2.hash(dto.newPassword);

    return this.em.transactional(async (tx) => {
      const credential = await this.credentialsRepo.findActivePasswordByUser(
        tx,
        actor.id,
      );
      if (!credential) {
        throw new PreconditionFailedException(
          'La cuenta no tiene una contraseña que cambiar',
          { reason: 'NO_PASSWORD_CREDENTIAL' },
        );
      }
      credential.secretHash = secretHash;
      credential.hashAlgorithmConceptId = CONCEPTS.HASH_ARGON2ID;
      touch(credential, actor.id);

      const others = (
        await this.sessionsRepo.findActiveByUser(tx, actor.id)
      ).filter((session) => session.tokenId !== actor.sessionId);
      const ids = others.map((session) => session.id);
      const revokedSessions = await this.sessionsRepo.revokeByIds(tx, ids);
      await this.refreshRepo.revokeActiveBySessionIds(tx, ids);

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_CRED_REVOKE,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: actor.id,
        recordedByUserId: actor.id,
        ip,
        detailJson: { flow: 'password-changed', revokedSessions },
      });
      this.logger.info(
        { operation: 'iam.account.change-password', userId: actor.id },
        'Contraseña cambiada',
      );
      return { revokedSessions };
    });
  }

  /**
   * Sesiones abiertas del titular, marcando la actual.
   *
   * @param actor - Sujeto autenticado.
   * @returns Sesiones ACTIVAS y vigentes, de la más reciente a la más antigua.
   */
  async listSessions(actor: AuthenticatedUser): Promise<MySessionDto[]> {
    const rows = await this.sessionsRepo.findActiveByUser(
      this.em.fork(),
      actor.id,
    );
    return rows.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      ip: session.ip ?? undefined,
      current: session.tokenId === actor.sessionId,
    }));
  }

  /**
   * Revoca una sesión propia y su refresh token.
   *
   * @param actor - Sujeto autenticado.
   * @param sessionId - `id` de la sesión (el que devuelve `listSessions`).
   * @returns Si quedó revocada en esta llamada.
   * @throws ResourceNotFoundException (404) si no existe o es de otro usuario:
   *   no se revela cuál de las dos cosas.
   */
  async revokeSession(
    actor: AuthenticatedUser,
    sessionId: string,
  ): Promise<RevokeMySessionResultDto> {
    return this.em.transactional(async (tx) => {
      const session = await this.sessionsRepo.findById(tx, sessionId);
      if (!session || session.userId !== actor.id) {
        throw new ResourceNotFoundException('Sesión no encontrada', {
          sessionId,
        });
      }
      if (session.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        return { revoked: false };
      }
      await this.sessionsRepo.revokeById(tx, session.id);
      await this.refreshRepo.revokeBySessionId(tx, session.id);
      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGOUT_ALL,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: actor.id,
        recordedByUserId: actor.id,
        detailJson: { scope: 'single-session', by: 'owner' },
      });
      // El paso extra no sobrevive a la sesión (best-effort: no lanza).
      await this.stepUp?.clear(session.tokenId);
      return { revoked: true };
    });
  }

  /**
   * «Fui yo»: la persona reconoce un dispositivo desde el que se abrió una
   * sesión. Queda de confianza y el aviso de dispositivo nuevo no vuelve a salir
   * por él. Idempotente.
   *
   * El aviso del login lo ve quien inicia sesión, que puede ser quien no debe:
   * confirmar «desde el propio dispositivo» no probaría nada. Por eso solo se
   * confirma (a) desde una sesión abierta en OTRO dispositivo que ya es de
   * confianza, o (b) con el código de un solo uso enviado al correo VERIFICADO
   * de la cuenta (`requestDeviceCode`).
   *
   * @param actor - Sujeto autenticado.
   * @param deviceId - Dispositivo del aviso.
   * @param ip - Origen, para el evento de seguridad.
   * @param code - Código recibido por correo, si lo hay.
   * @returns `{ confirmed: true, deviceId }`.
   * @throws ResourceNotFoundException (404) si no existe o es de otra persona.
   * @throws PreconditionFailedException `DEVICE_CONFIRM_CODE_REQUIRED` /
   *   `DEVICE_CONFIRM_CODE_INVALID` sin dispositivo de confianza ni código válido.
   */
  async confirmDevice(
    actor: AuthenticatedUser,
    deviceId: string,
    ip?: string,
    code?: string,
  ): Promise<ConfirmDeviceResultDto> {
    return this.em.transactional(async (tx) => {
      const device = await this.devicesRepo.findByIdAndUser(
        tx,
        deviceId,
        actor.id,
      );
      if (!device) throw this.deviceNotFound(deviceId);
      if (device.trusted === true) return { confirmed: true, deviceId };

      let flow = 'confirmed-by-trusted-device';
      let codeDigest: string | undefined;
      if (!(await this.sessionIsOnOtherTrustedDevice(tx, actor, deviceId))) {
        if (!code) {
          throw new PreconditionFailedException(
            'Para confirmar este dispositivo hace falta el código enviado a su correo',
            { canRequestCode: true },
            IamErrorReason.DEVICE_CONFIRM_CODE_REQUIRED,
          );
        }
        codeDigest = deviceCodeDigest(actor.id, deviceId, code);
        const valid = isDeviceConfirmationCodeValid(
          this.secret,
          actor.id,
          deviceId,
          code,
          new Date(),
        );
        if (
          !valid ||
          (await this.eventsRepo.deviceCodeUsed(tx, actor.id, codeDigest))
        ) {
          throw new PreconditionFailedException(
            'El código no es válido o ya se usó',
            undefined,
            IamErrorReason.DEVICE_CONFIRM_CODE_INVALID,
          );
        }
        flow = 'confirmed-by-email-code';
      }
      device.trusted = true;
      touch(device, actor.id);
      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_DEVICE_TRUST,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: actor.id,
        recordedByUserId: actor.id,
        ip,
        detailJson: { flow, deviceId, ...(codeDigest ? { codeDigest } : {}) },
      });
      return { confirmed: true, deviceId };
    });
  }

  /**
   * Manda al correo VERIFICADO de la cuenta el código de un solo uso con el que
   * se confirma un dispositivo («Fui yo»). Sin correo verificado no hay canal.
   *
   * @param actor - Sujeto autenticado.
   * @param deviceId - Dispositivo a confirmar.
   * @returns Si se envió y a qué dirección (enmascarada).
   * @throws ResourceNotFoundException (404) si el dispositivo no existe o es ajeno.
   * @throws PreconditionFailedException `DEVICE_CONFIRM_NO_VERIFIED_EMAIL`.
   */
  async requestDeviceCode(
    actor: AuthenticatedUser,
    deviceId: string,
  ): Promise<RequestDeviceCodeResultDto> {
    const em = this.em.fork();
    const device = await this.devicesRepo.findByIdAndUser(
      em,
      deviceId,
      actor.id,
    );
    if (!device) throw this.deviceNotFound(deviceId);
    if (device.trusted === true) return { sent: false };
    const verified = await this.emailVerifications?.findLatestVerifiedByUser(
      em,
      actor.id,
    );
    if (!verified || !this.notices) {
      throw new PreconditionFailedException(
        'La cuenta no tiene un correo verificado al que enviar el código',
        undefined,
        IamErrorReason.DEVICE_CONFIRM_NO_VERIFIED_EMAIL,
      );
    }
    const code = deviceConfirmationCode(
      this.secret,
      actor.id,
      deviceId,
      new Date(),
    );
    await this.notices.enqueueEmail({
      recipientUserId: actor.id,
      recipientAddress: verified.email,
      subject: 'Código para confirmar su dispositivo',
      bodyText: [
        `Su código para confirmar el dispositivo «${device.name ?? 'sin nombre'}» es: ${code}`,
        '',
        'Vale por unos minutos y solo se puede usar una vez. Si usted no lo pidió, ignore este mensaje: nadie podrá confirmar el dispositivo sin él.',
      ].join('\n'),
    });
    this.logger.info(
      { operation: 'iam.account.device-confirm-code', userId: actor.id },
      'Código de confirmación de dispositivo enviado',
    );
    return { sent: true, sentTo: maskEmail(verified.email) };
  }

  /**
   * ¿Se abrió la sesión del actor desde OTRO dispositivo que ya es de confianza?
   * Es la única forma de confirmar sin código: el dispositivo del que se confirma
   * no puede ser el mismo que se confirma.
   */
  private async sessionIsOnOtherTrustedDevice(
    tx: EntityManager,
    actor: AuthenticatedUser,
    deviceId: string,
  ): Promise<boolean> {
    if (!actor.sessionId) return false;
    const session = await this.sessionsRepo.findActiveByTokenId(
      tx,
      actor.sessionId,
    );
    if (!session || session.userId !== actor.id || !session.deviceId) {
      return false;
    }
    if (session.deviceId === deviceId) return false;
    const own = await this.devicesRepo.findByIdAndUser(
      tx,
      session.deviceId,
      actor.id,
    );
    return own?.trusted === true;
  }

  /**
   * «No fui yo»: la persona no reconoce el dispositivo. Deja de ser de confianza
   * y se cierran las **demás** sesiones de la cuenta con sus refresh tokens (la
   * actual sigue, desde ella se cambia la contraseña). Queda un evento de
   * seguridad con el dispositivo y la cantidad de sesiones cerradas. Un caso de
   * uso, una transacción.
   *
   * @param actor - Sujeto autenticado.
   * @param deviceId - Dispositivo del aviso.
   * @param ip - Origen, para el evento de seguridad.
   * @returns Cuántas sesiones ajenas a la actual se cerraron.
   * @throws ResourceNotFoundException (404) si no existe o es de otra persona.
   */
  async reportDeviceNotMe(
    actor: AuthenticatedUser,
    deviceId: string,
    ip?: string,
  ): Promise<ReportDeviceNotMeResultDto> {
    return this.em.transactional(async (tx) => {
      const device = await this.devicesRepo.findByIdAndUser(
        tx,
        deviceId,
        actor.id,
      );
      if (!device) throw this.deviceNotFound(deviceId);
      device.trusted = false;
      touch(device, actor.id);

      const others = (
        await this.sessionsRepo.findActiveByUser(tx, actor.id)
      ).filter((session) => session.tokenId !== actor.sessionId);
      const ids = others.map((session) => session.id);
      const revokedSessions = await this.sessionsRepo.revokeByIds(tx, ids);
      await this.refreshRepo.revokeActiveBySessionIds(tx, ids);

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGOUT_ALL,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: actor.id,
        recordedByUserId: actor.id,
        ip,
        detailJson: { flow: 'device-not-me', deviceId, revokedSessions },
      });
      this.logger.warn(
        { operation: 'iam.account.device-not-me', userId: actor.id },
        'Owner reported an unrecognized device',
      );
      return { revokedSessions, deviceId };
    });
  }

  /** Un dispositivo ajeno responde igual que uno inexistente. */
  private deviceNotFound(deviceId: string): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Dispositivo no encontrado',
      { deviceId },
      IamErrorReason.DEVICE_NOT_FOUND,
    );
  }
}
