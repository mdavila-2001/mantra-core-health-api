import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, loadAuthEnv, touch } from '../../../../common';
import {
  describeClient,
  deviceFingerprintOf,
  type ClientDescription,
} from '../../domain/device-fingerprint';
import { readDeviceCookie, signDeviceCookie } from '../../domain/device-cookie';
import type { EffectiveSessionRules } from '../../domain/session-policy';
import type { Devices } from '../../entities';
import {
  DevicesRepository,
  EmailVerificationsRepository,
  SecurityEventsRepository,
} from '../../infrastructure/repositories';
import {
  EMAIL_NOTICE_PORT,
  type EmailNoticePort,
} from '../ports/email-notice.port';

/** Aviso de dispositivo nuevo que viaja en la respuesta del login. */
export interface NewDeviceNotice {
  /** Dispositivo, para confirmarlo con «Fui yo». */
  readonly deviceId: string;
  /** Cómo se lo nombra a la persona: «Chrome en Windows». */
  readonly label: string;
  /** Origen del inicio de sesión, tal como lo vio el servidor. */
  readonly ip?: string;
  /** Cuándo se abrió la sesión. */
  readonly occurredAt: Date;
}

/** Resultado de reconocer el dispositivo de un inicio de sesión. */
export interface DeviceRecognition {
  /** Dispositivo de la sesión, si se pudo determinar. */
  readonly deviceId?: string;
  /** Presente solo si hay que avisar a la persona. */
  readonly notice?: NewDeviceNotice;
  /**
   * Cookie de dispositivo firmada para entregar al navegador (HttpOnly). Solo
   * con `AUTH_DEVICE_COOKIE_ENABLED=true` y nunca a un cliente sin prueba que
   * coincide con un equipo de confianza.
   */
  readonly deviceCookie?: string;
}

/** Cliente sin `User-Agent`: no hay nada que describir, y por eso nunca es «conocido». */
const NO_USER_AGENT: ClientDescription = {
  browser: 'sin-user-agent',
  os: 'sin-user-agent',
  deviceClass: 'desktop',
  label: 'Cliente sin identificar',
};

/**
 * Reconoce desde qué dispositivo se abre una sesión (`iam.devices`) y decide si
 * hay que avisar de uno nuevo.
 *
 * - El dispositivo se identifica por una huella del servidor derivada de la
 *   persona y del `User-Agent` (familia, sistema y clase de equipo). Esa huella
 *   NO autentica a nadie: «Chrome en Windows» lo declara cualquiera. Con
 *   `AUTH_DEVICE_COOKIE_ENABLED=true` se refuerza con una cookie firmada HttpOnly
 *   que liga el navegador a la persona: con una cookie válida el dispositivo es el
 *   de la cookie; sin ella, el cliente que solo coincide por `User-Agent` con un
 *   equipo de confianza (habiendo otros dispositivos) se trata como nuevo y queda
 *   en un dispositivo «gemelo» sin confianza hasta que la persona lo confirme.
 * - Un cliente SIN `User-Agent` cuenta siempre como desconocido (avisa si hay
 *   dispositivos previos): omitir la cabecera no es una forma de pasar inadvertido.
 * - El primer dispositivo de una persona nunca avisa: queda de confianza como
 *   punto de partida. Tampoco avisa nada si ninguna política aplicable tiene
 *   `newDeviceAlert`; el dispositivo se registra igual, de confianza, para que
 *   encender el aviso más tarde no trate como nuevo lo ya conocido.
 * - Un dispositivo desconocido, con dispositivos previos y el aviso encendido,
 *   se registra SIN confianza, avisa en el login y manda un correo FUERA DE BANDA
 *   al correo verificado del titular (el aviso del login lo ve quien inicia
 *   sesión, que puede ser quien no debe).
 * - Es un aviso: si algo falla aquí, el inicio de sesión sigue.
 */
@Injectable()
export class IamDeviceRecognitionService {
  private readonly secret = loadAuthEnv().secret;

  private readonly cookieEnabled =
    process.env.AUTH_DEVICE_COOKIE_ENABLED === 'true';

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param devicesRepo - Dispositivos.
   * @param eventsRepo - Eventos de seguridad.
   * @param logger - Logger estructurado.
   * @param emailVerifications - Correos verificados, destino del aviso.
   * @param notices - Encolado de correos transaccionales.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly devicesRepo: DevicesRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly logger: PinoLogger,
    private readonly emailVerifications?: EmailVerificationsRepository,
    @Inject(EMAIL_NOTICE_PORT)
    private readonly notices?: EmailNoticePort,
  ) {
    this.logger.setContext(IamDeviceRecognitionService.name);
  }

  /**
   * Reconoce o registra el dispositivo del inicio de sesión.
   *
   * @param userId - Persona que entró.
   * @param userAgent - Cabecera `User-Agent` de la petición.
   * @param ip - Origen de la petición.
   * @param rules - Reglas de sesión efectivas de la persona.
   * @param deviceCookie - Valor de la cookie de dispositivo que trajo el cliente.
   * @returns El dispositivo y, si corresponde, el aviso.
   */
  async recognize(
    userId: string,
    userAgent: string | undefined,
    ip: string | undefined,
    rules: EffectiveSessionRules | undefined,
    deviceCookie?: string,
  ): Promise<DeviceRecognition> {
    const noAgent = !userAgent;
    const client = noAgent
      ? NO_USER_AGENT
      : describeClient(userAgent.slice(0, 512));
    const attempt = (): Promise<DeviceRecognition> =>
      this.resolve({
        userId,
        client,
        noAgent,
        ip,
        rules,
        cookieDeviceId: this.cookieEnabled
          ? readDeviceCookie(this.secret, userId, deviceCookie)
          : undefined,
      });
    let recognition: DeviceRecognition;
    try {
      recognition = await attempt();
    } catch (error) {
      if (!isUniqueViolation(error)) return this.failed(error, userId);
      // Dos inicios de sesión simultáneos desde el mismo equipo nuevo: el otro
      // ya lo registró, se vuelve a leer.
      try {
        recognition = await attempt();
      } catch (retry) {
        return this.failed(retry, userId);
      }
    }
    if (recognition.notice) {
      await this.notifyOutOfBand(userId, recognition.notice);
    }
    return recognition;
  }

  /** Lee o crea el dispositivo y decide el aviso. */
  private resolve(input: {
    userId: string;
    client: ClientDescription;
    noAgent: boolean;
    ip: string | undefined;
    rules: EffectiveSessionRules | undefined;
    cookieDeviceId: string | undefined;
  }): Promise<DeviceRecognition> {
    const { userId, client, noAgent, ip, rules, cookieDeviceId } = input;
    const alertOn = rules?.newDeviceAlert === true;
    const fingerprint = deviceFingerprintOf(this.secret, userId, client);
    return this.em.transactional(async (tx) => {
      const now = new Date();
      const byCookie = cookieDeviceId
        ? await this.devicesRepo.findByIdAndUser(tx, cookieDeviceId, userId)
        : null;
      const byPrint = await this.devicesRepo.findByFingerprint(tx, fingerprint);
      const mine = byPrint && byPrint.userId === userId ? byPrint : null;
      const count = await this.devicesRepo.countByUser(tx, userId);
      let known: Devices | null = byCookie ?? mine;

      // Sin cookie no hay prueba de que este navegador sea el equipo de
      // confianza: solo coincide su `User-Agent`. Con otros dispositivos
      // registrados queda en un dispositivo gemelo sin confianza.
      if (
        known &&
        this.cookieEnabled &&
        !noAgent &&
        !byCookie &&
        known.trusted === true &&
        count > 1
      ) {
        known = await this.twinOf(tx, userId, client, now);
      }

      if (known) {
        known.lastSeenAt = now;
        touch(known, userId, now);
        const othersExist = count > 1;
        const pending = known.trusted !== true || (noAgent && othersExist);
        return {
          deviceId: known.id,
          notice:
            pending && alertOn
              ? { deviceId: known.id, label: client.label, ip, occurredAt: now }
              : undefined,
          deviceCookie: this.cookieFor(userId, known.id, noAgent),
        };
      }

      const alert = alertOn && count > 0;
      const device = this.devicesRepo.create(tx, {
        userId,
        deviceFingerprint: fingerprint,
        platformConceptId: CONCEPTS.PLATFORM_WEB,
        name: client.label,
        trusted: !alert && !(noAgent && count > 0),
        lastSeenAt: now,
        actorUserId: userId,
      });
      await tx.flush();
      if (alert) {
        this.eventsRepo.record(tx, {
          eventTypeConceptId: CONCEPTS.SEC_LOGIN,
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
          userId,
          ip,
          detailJson: { flow: 'new-device', deviceId: device.id },
        });
      }
      return {
        deviceId: device.id,
        notice: alert
          ? { deviceId: device.id, label: client.label, ip, occurredAt: now }
          : undefined,
        deviceCookie: this.cookieFor(userId, device.id, noAgent),
      };
    });
  }

  /**
   * El dispositivo «gemelo» del cliente sin prueba: uno por persona y familia de
   * `User-Agent` (no uno por intento), siempre sin confianza.
   */
  private async twinOf(
    tx: EntityManager,
    userId: string,
    client: ClientDescription,
    now: Date,
  ): Promise<Devices> {
    const twinFingerprint = deviceFingerprintOf(this.secret, userId, {
      ...client,
      os: `${client.os}|sin-cookie`,
    });
    const found = await this.devicesRepo.findByFingerprint(tx, twinFingerprint);
    if (found && found.userId === userId) return found;
    const twin = this.devicesRepo.create(tx, {
      userId,
      deviceFingerprint: twinFingerprint,
      platformConceptId: CONCEPTS.PLATFORM_WEB,
      name: client.label,
      trusted: false,
      lastSeenAt: now,
      actorUserId: userId,
    });
    await tx.flush();
    this.eventsRepo.record(tx, {
      eventTypeConceptId: CONCEPTS.SEC_LOGIN,
      outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
      userId,
      detailJson: { flow: 'new-device', deviceId: twin.id, proof: 'no-cookie' },
    });
    return twin;
  }

  /** Cookie firmada del dispositivo; ninguna si está apagada o no hay `User-Agent`. */
  private cookieFor(
    userId: string,
    deviceId: string,
    noAgent: boolean,
  ): string | undefined {
    if (!this.cookieEnabled || noAgent) return undefined;
    return signDeviceCookie(this.secret, userId, deviceId);
  }

  /**
   * Correo al titular, fuera de banda: el aviso del login lo ve quien inicia
   * sesión, y esa persona puede no ser el titular. Va al correo VERIFICADO de la
   * cuenta; sin uno no hay canal y solo queda el aviso en pantalla. Nunca hace
   * fallar el inicio de sesión.
   */
  private async notifyOutOfBand(
    userId: string,
    notice: NewDeviceNotice,
  ): Promise<void> {
    if (!this.notices || !this.emailVerifications) return;
    try {
      const verified = await this.emailVerifications.findLatestVerifiedByUser(
        this.em.fork(),
        userId,
      );
      if (!verified) {
        this.logger.info(
          { operation: 'iam.device.notify', userId },
          'Cuenta sin correo verificado: el aviso de dispositivo nuevo solo sale en pantalla',
        );
        return;
      }
      await this.notices.enqueueEmail({
        recipientUserId: userId,
        recipientAddress: verified.email,
        subject: 'Nuevo inicio de sesión en su cuenta',
        bodyText: [
          'Se inició sesión en su cuenta desde un dispositivo que no reconocemos.',
          '',
          `Dispositivo: ${notice.label}`,
          notice.ip ? `Origen: ${notice.ip}` : undefined,
          `Fecha (UTC): ${notice.occurredAt.toISOString()}`,
          '',
          'Si fue usted, no tiene que hacer nada: desde su cuenta puede marcar el dispositivo como suyo con «Fui yo».',
          'Si NO fue usted, ingrese a su cuenta, use «No fui yo» en ese dispositivo y cambie su contraseña: así se cierran las demás sesiones.',
        ]
          .filter((line): line is string => line !== undefined)
          .join('\n'),
      });
    } catch (error) {
      this.logger.warn(
        { operation: 'iam.device.notify', userId, err: error },
        'No se pudo enviar el aviso de dispositivo nuevo; el inicio de sesión sigue',
      );
    }
  }

  /** El reconocimiento no es condición del acceso: se registra y se sigue. */
  private failed(error: unknown, userId: string): DeviceRecognition {
    this.logger.warn(
      { operation: 'iam.device.recognize', userId, err: error },
      'Device recognition failed; login continues without it',
    );
    return {};
  }
}

/** ¿Violó la unicidad de la huella? */
function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; name?: string } | null;
  return (
    e?.code === '23505' || e?.name === 'UniqueConstraintViolationException'
  );
}
