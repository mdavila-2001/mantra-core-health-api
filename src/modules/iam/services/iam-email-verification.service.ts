import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { TokenService, type AuthenticatedUser } from '../../../common';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import { NotificationsService } from '../../messaging/services';
import {
  CredentialsRepository,
  EmailVerificationsRepository,
  UsersRepository,
} from '../repositories';
import type {
  ResendVerificationDto,
  ResendVerificationResponseDto,
} from '../dto';

/** Vida útil del token de verificación de correo (24 h), igual que en el alta. */
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Mensaje único del reenvío. No distingue entre "no existe la cuenta", "no
 * declaró correo" y "ya está verificada": las tres respuestas juntas convierten
 * un formulario público en un oráculo de qué direcciones tienen cuenta en una
 * plataforma de salud.
 */
const NEUTRAL_MESSAGE =
  'Si el identificador corresponde a una cuenta con correo pendiente de verificar, enviamos un enlace nuevo.';

/**
 * Reenvío del enlace de verificación de correo.
 *
 * El alta —de paciente, de profesional o de owner de organización— emite un
 * token de 24 h y lo manda por correo una sola vez. Si ese correo no llega
 * (bandeja de spam, dirección mal tecleada, token caducado), la cuenta quedaba
 * sin forma de verificarse: `iam.users.email_verified` no volvía a tener
 * ocasión de pasar a `true` y no había endpoint al que recurrir.
 *
 * Vive aparte del servicio de auto-registro de pacientes —donde está el consumo
 * del token— porque el reenvío no es de pacientes: lo necesitan por igual los
 * tres tipos de alta, y colgarlo de un servicio llamado "patient" habría atado
 * su nombre a un solo caso.
 */
@Injectable()
export class IamEmailVerificationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tokenService - Emisor y hasheador del token de verificación.
   * @param credentialsRepo - Resuelve la cuenta desde el identificador de login.
   * @param usersRepo - Repositorio de cuentas.
   * @param emailVerificationsRepo - Repositorio de verificaciones de correo.
   * @param notificationsService - Encolado del correo.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly tokenService: TokenService,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly usersRepo: UsersRepository,
    private readonly emailVerificationsRepo: EmailVerificationsRepository,
    private readonly notificationsService: NotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IamEmailVerificationService.name);
  }

  /**
   * Emite un token nuevo y lo envía al correo declarado por la cuenta.
   *
   * Nunca lanza por «no existe»: devuelve el mismo mensaje neutro siempre, y el
   * fallo del envío tampoco se propaga —decir que el correo no salió también
   * confirmaría que la cuenta existe—.
   *
   * @param dto - Identificador con el que la persona inicia sesión.
   * @param ip - Origen de la solicitud, para auditar abuso del formulario.
   * @returns Siempre el mismo mensaje.
   */
  async resend(
    dto: ResendVerificationDto,
    ip?: string,
  ): Promise<ResendVerificationResponseDto> {
    const issued = await this.em.transactional(async (tx) => {
      const credential = await this.credentialsRepo.findActivePasswordBySubject(
        tx,
        dto.identifier,
      );
      if (!credential) {
        this.logger.info(
          { operation: 'iam.auth.resend-verification', found: false },
          'Reenvío pedido sobre un identificador sin credencial',
        );
        return undefined;
      }

      const user = await this.usersRepo.findById(tx, credential.userId);
      if (!user) return undefined;

      // Una cuenta ya verificada no necesita otro token vivo en una bandeja.
      if (user.emailVerified === true) {
        this.logger.info(
          { operation: 'iam.auth.resend-verification', userId: user.id },
          'Reenvío pedido sobre una cuenta con el correo ya verificado',
        );
        return undefined;
      }

      // A dónde escribir: quien entra con su documento no tiene un correo por
      // `externalSubject`, así que se recupera el que declaró en el alta. Sin
      // correo declarado no hay canal, y un token que nadie puede recibir sólo
      // sirve para que alguien lo intercepte.
      const destination = dto.identifier.includes('@')
        ? dto.identifier
        : (await this.emailVerificationsRepo.findLatestByUser(tx, user.id))
            ?.email;
      if (!destination) {
        this.logger.info(
          { operation: 'iam.auth.resend-verification', userId: user.id },
          'Cuenta sin correo declarado: no hay canal por el que reenviar',
        );
        return undefined;
      }

      const { raw, hash } = this.tokenService.issueRefreshToken();
      this.emailVerificationsRepo.create(tx, {
        userId: user.id,
        email: destination,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        actorUserId: user.id,
      });

      this.logger.info(
        { operation: 'iam.auth.resend-verification', userId: user.id, ip },
        'Token de verificación reemitido',
      );
      return { userId: user.id, token: raw, email: destination };
    });

    // El correo se encola FUERA de la transacción: si la mensajería falla, el
    // token ya emitido sigue siendo válido y la persona puede reintentar.
    if (issued) {
      await this.sendVerificationEmail(
        issued.userId,
        issued.email,
        issued.token,
      );
    }

    return { message: NEUTRAL_MESSAGE };
  }

  /**
   * Encola el correo sin dejar que su fallo tumbe la solicitud.
   *
   * @param userId - Destinatario interno.
   * @param email - Dirección a la que va el correo.
   * @param token - Token en claro, que sólo viaja en el correo.
   */
  private async sendVerificationEmail(
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
            subject: 'Verificá tu correo',
            bodyText:
              'Para verificar tu correo, usá este código: ' +
              `${token}\n\nEl enlace caduca en 24 horas.`,
          },
        },
        actor,
      );
    } catch (error) {
      this.logger.warn(
        { operation: 'iam.auth.resend-verification', userId, err: error },
        'No se pudo encolar el correo de verificación; el token sigue siendo válido',
      );
    }
  }
}
