import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import * as argon2 from 'argon2';
import {
  CONCEPTS,
  TokenService,
  UnauthorizedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import { NotificationsService } from '../../messaging/services';
import {
  CredentialsRepository,
  EmailVerificationsRepository,
  PasswordResetsRepository,
  RefreshTokensRepository,
  SecurityEventsRepository,
  SessionsRepository,
  UsersRepository,
} from '../repositories';
import type {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from '../dto';

/**
 * Ventana de validez del enlace de restablecimiento.
 *
 * Una hora: suficiente para leer un correo que puede tardar en llegar, y lo
 * bastante corto para que un enlace olvidado en una bandeja compartida deje de
 * servir el mismo día.
 */
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

/**
 * Respuesta única de la solicitud de restablecimiento.
 *
 * Es literalmente la misma exista o no la cuenta. Cualquier diferencia —el
 * texto, el código, incluso el tiempo de respuesta— convierte el formulario en
 * un oráculo de qué correos están registrados en una plataforma de salud.
 */
const NEUTRAL_MESSAGE =
  'Si el identificador corresponde a una cuenta, enviamos un correo con las instrucciones para restablecer la contraseña.';

/**
 * Recuperación de contraseña (UC-01-13): solicitud del enlace y consumo del
 * token.
 *
 * Tres propiedades que sostienen todo lo demás:
 *
 * - **No revela si la cuenta existe.** `requestReset` responde siempre lo mismo,
 *   con el mismo código, haya o no credencial detrás.
 * - **El token en claro sólo existe dentro del correo.** En base queda su
 *   SHA-256, igual que un refresh token, así que leer la tabla no permite
 *   restablecer la contraseña de nadie.
 * - **Restablecer cierra todas las sesiones.** Si alguien recupera su cuenta es
 *   porque perdió el control de la clave; dejar viva la sesión del que se la
 *   robó vaciaría de sentido el trámite.
 */
@Injectable()
export class IamPasswordResetService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param usersRepo - Valor de users repo requerido por la operación.
   * @param credentialsRepo - Credencial de contraseña a reescribir.
   * @param resetsRepo - Solicitudes de restablecimiento.
   * @param emailVerificationsRepo - Dirección declarada de quien entra con documento.
   * @param sessionsRepo - Sesiones a revocar tras el cambio.
   * @param refreshRepo - Refresh tokens a revocar tras el cambio.
   * @param eventsRepo - Registro de eventos de seguridad.
   * @param tokenService - Emisión y hasheo del token de un solo uso.
   * @param notificationsService - Envío del correo con el token.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly usersRepo: UsersRepository,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly resetsRepo: PasswordResetsRepository,
    private readonly emailVerificationsRepo: EmailVerificationsRepository,
    private readonly sessionsRepo: SessionsRepository,
    private readonly refreshRepo: RefreshTokensRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly tokenService: TokenService,
    private readonly notificationsService: NotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IamPasswordResetService.name);
  }

  /**
   * UC-01-13: emite un enlace de restablecimiento si el identificador
   * corresponde a una credencial de contraseña activa.
   *
   * Nunca lanza por «no existe»: devuelve el mismo mensaje neutro siempre. El
   * fallo del envío tampoco se propaga — decirle a quien pide el enlace que el
   * correo no salió también confirmaría que la cuenta existe.
   *
   * @param dto - Identificador con el que la persona inicia sesión.
   * @param ip - Origen de la solicitud, para auditar abuso del formulario.
   * @returns Siempre el mismo mensaje.
   */
  async requestReset(
    dto: ForgotPasswordDto,
    ip?: string,
  ): Promise<ForgotPasswordResponseDto> {
    const issued = await this.em.transactional(async (tx) => {
      const credential = await this.credentialsRepo.findActivePasswordBySubject(
        tx,
        dto.identifier,
      );
      if (!credential) {
        this.logger.info(
          { operation: 'iam.auth.forgot-password', found: false },
          'Solicitud de restablecimiento sobre un identificador sin credencial',
        );
        return undefined;
      }

      const user = await this.usersRepo.findById(tx, credential.userId);
      if (!user) return undefined;

      // Un enlace nuevo invalida los anteriores: cada solicitud sin revocar deja
      // otra llave viva en una bandeja de entrada.
      await this.resetsRepo.revokeActiveForUser(tx, user.id);

      // Quien entra con su documento tiene una cédula por `externalSubject`, no
      // un correo: hay que resolver a dónde escribirle. Si no declaró ninguna
      // dirección no hay canal, y la solicitud no se emite — un token que nadie
      // puede recibir sólo sirve para que alguien lo intercepte.
      const destination = await this.resolveEmail(tx, user.id, dto.identifier);
      if (!destination) {
        this.logger.info(
          { operation: 'iam.auth.forgot-password', userId: user.id },
          'Cuenta sin correo declarado: no hay canal por el que enviar el enlace',
        );
        return undefined;
      }

      const { raw, hash } = this.tokenService.issueRefreshToken();
      this.resetsRepo.create(tx, {
        userId: user.id,
        externalSubject: dto.identifier,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        requestedIp: ip,
        actorUserId: user.id,
      });

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_CRED_REVOKE,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: user.id,
        recordedByUserId: user.id,
        ip,
        detailJson: { flow: 'password-reset-requested' },
      });

      return { userId: user.id, token: raw, email: destination };
    });

    // El correo se encola FUERA de la transacción: si la mensajería falla, la
    // solicitud ya emitida sigue siendo válida y se puede reintentar.
    if (issued) {
      await this.sendResetEmail(issued.userId, issued.email, issued.token);
    }

    return { message: NEUTRAL_MESSAGE };
  }

  /**
   * UC-01-13: consume el token y fija la contraseña nueva.
   *
   * A diferencia de la solicitud, aquí sí se responde con error: quien llega con
   * un token en la mano ya no puede enumerar cuentas con él, y necesita saber si
   * caducó para pedir otro.
   *
   * @param dto - Token recibido por correo y contraseña nueva.
   * @param ip - Origen de la petición, para el evento de seguridad.
   * @returns El usuario y cuántas sesiones se cerraron.
   * @throws UnauthorizedException si el token no existe, ya se usó o expiró.
   */
  async resetPassword(
    dto: ResetPasswordDto,
    ip?: string,
  ): Promise<ResetPasswordResponseDto> {
    const tokenHash = this.tokenService.hashRefreshToken(dto.token);
    // El hash de la contraseña nueva se calcula ANTES de abrir la transacción:
    // argon2 tarda cientos de milisegundos a propósito, y hacerlo dentro
    // mantendría abierta una transacción que ya bloqueó filas de sesión.
    const secretHash = await argon2.hash(dto.newPassword);

    // El caso "expirado" no puede lanzar DENTRO de `em.transactional`: el throw
    // revertiría la propia marca de expiración que se quiere dejar asentada.
    // Mismo patrón que `verifyEmail`.
    const outcome = await this.em.transactional(async (tx) => {
      const reset = await this.resetsRepo.findByTokenHash(tx, tokenHash);
      if (!reset) {
        throw new UnauthorizedException('Token de restablecimiento inválido');
      }
      if (reset.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new UnauthorizedException(
          'El token de restablecimiento ya fue utilizado',
        );
      }
      if (reset.expiresAt.getTime() < Date.now()) {
        reset.stateConceptId = CONCEPTS.STATE_EXPIRED;
        touch(reset, reset.userId);
        return { expired: true } as const;
      }

      const credential = await this.credentialsRepo.findActivePasswordBySubject(
        tx,
        reset.externalSubject,
      );
      // La credencial pudo revocarse entre la solicitud y el consumo. Sin ella
      // no hay dónde escribir la contraseña, y crear una nueva sería dar acceso
      // a una cuenta que alguien deshabilitó a propósito.
      if (!credential || credential.userId !== reset.userId) {
        throw new UnauthorizedException('Token de restablecimiento inválido');
      }

      credential.secretHash = secretHash;
      credential.hashAlgorithmConceptId = CONCEPTS.HASH_ARGON2ID;
      touch(credential, reset.userId);

      reset.stateConceptId = CONCEPTS.STATE_VERIFIED;
      reset.consumedAt = new Date();
      touch(reset, reset.userId);

      // Cambiar la clave cierra todo lo abierto: quien recupera su cuenta lo
      // hace porque perdió el control de la anterior.
      const sessionIds = await this.sessionsRepo.activeSessionIdsForUser(
        tx,
        reset.userId,
      );
      const revokedSessions = await this.sessionsRepo.revokeAllActiveForUser(
        tx,
        reset.userId,
      );
      await this.refreshRepo.revokeActiveBySessionIds(tx, sessionIds);

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGOUT_ALL,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: reset.userId,
        recordedByUserId: reset.userId,
        ip,
        detailJson: { flow: 'password-reset-consumed', revokedSessions },
      });

      this.logger.info(
        {
          operation: 'iam.auth.reset-password',
          userId: reset.userId,
          revokedSessions,
        },
        'Contraseña restablecida',
      );
      return {
        expired: false,
        userId: reset.userId,
        revokedSessions,
      } as const;
    });

    if (outcome.expired) {
      throw new UnauthorizedException('El token de restablecimiento expiró');
    }
    return {
      userId: outcome.userId,
      revokedSessions: outcome.revokedSessions,
    };
  }

  /**
   * Resuelve la dirección a la que enviar el enlace.
   *
   * Si el identificador de acceso ya es un correo, es el mismo con el que la
   * persona entra y no hace falta buscar nada. Si es un documento, se recurre a
   * la última dirección que declaró.
   *
   * @param tx - Transacción activa.
   * @param userId - Usuario que pidió recuperar la cuenta.
   * @param identifier - Identificador con el que la pidió.
   * @returns La dirección, o `undefined` si la cuenta no tiene ninguna.
   */
  private async resolveEmail(
    tx: EntityManager,
    userId: string,
    identifier: string,
  ): Promise<string | undefined> {
    if (identifier.includes('@')) return identifier;

    const declared = await this.emailVerificationsRepo.findLatestByUser(
      tx,
      userId,
    );
    return declared?.email;
  }

  /**
   * Encola el correo con el token de restablecimiento.
   *
   * No propaga el error: informar de que el correo no salió confirmaría que la
   * cuenta existe, que es justo lo que `requestReset` evita.
   *
   * @param userId - Destinatario interno.
   * @param email - Dirección a la que va el correo.
   * @param token - Token en claro, que sólo viaja en el correo.
   */
  private async sendResetEmail(
    userId: string,
    email: string,
    token: string,
  ): Promise<void> {
    const actor: AuthenticatedUser = { id: userId, roles: [] };
    try {
      await this.notificationsService.createRequest(
        {
          channelId: MESSAGING_SEED.emailChannelId,
          recipientUserId: userId,
          recipientAddress: email,
          payloadJson: {
            subject: 'Restablecé tu contraseña',
            bodyText:
              'Para elegir una contraseña nueva, usá este código: ' +
              `${token}\n\nVence en una hora. Si no pediste este cambio, ` +
              'ignorá este mensaje: tu contraseña actual sigue funcionando.',
          },
        },
        actor,
      );
    } catch (error) {
      this.logger.warn(
        { operation: 'iam.auth.forgot-password', userId, err: error },
        'No se pudo encolar el correo de restablecimiento',
      );
    }
  }
}
