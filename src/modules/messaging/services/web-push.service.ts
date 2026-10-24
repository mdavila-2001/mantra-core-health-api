import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import webpush from 'web-push';
import {
  decryptSecret,
  encryptSecret,
} from '../../../common/crypto/secret-cipher';
import { Devices } from '../../iam/entities';
import { PreconditionFailedException } from '../../../common';

/** Suscripción que entrega el navegador (`PushSubscription.toJSON()`). */
export interface WebPushSubscriptionInput {
  readonly endpoint: string;
  readonly keys: { readonly p256dh: string; readonly auth: string };
}

/** Lo mínimo que viaja en el push: el detalle se lee dentro de la aplicación. */
export interface WebPushMessage {
  readonly recipientUserId: string;
  /** Título corto del aviso, el mismo de la campana. */
  readonly subject: string;
  /** Ruta de la aplicación a la que lleva el toque. */
  readonly route?: string;
  readonly notificationId?: string;
}

/** Nombre con que se guarda el dispositivo web en `iam.devices`. */
const WEB_DEVICE_NAME = 'Navegador web';
/** Cuánto vive un push sin entregar: pasada la hora, ya no sirve. */
const PUSH_TTL_SECONDS = 60 * 60;
const GONE_STATUS_CODES: readonly number[] = [404, 410];
/** Título fijo: la pantalla bloqueada no debe mostrar datos de la persona. */
const PUSH_TITLE = 'AloVida';
const DEFAULT_ROUTE = '/notifications';

/**
 * Servicios de push que emiten los navegadores. El servidor hace un POST a la
 * dirección que trae la suscripción, así que aceptar cualquier URL sería
 * entregarle a quien se suscribe una petición saliente a medida (SSRF).
 */
const PUSH_HOST_SUFFIXES: readonly string[] = [
  'fcm.googleapis.com',
  'push.services.mozilla.com',
  'notify.windows.com',
  'push.apple.com',
];

/** `true` si la dirección es HTTPS y pertenece a un servicio de push conocido. */
export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  return PUSH_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

/** Huella estable del endpoint: identifica el dispositivo sin guardarlo dos veces. */
function fingerprintOf(endpoint: string): string {
  return `webpush:${createHash('sha256').update(endpoint).digest('hex')}`;
}

/**
 * Push web: avisa al navegador de la persona cuando le llega una notificación.
 *
 * - La clave pública y privada VAPID salen de `VAPID_PUBLIC_KEY`,
 *   `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT`. Sin ellas el servicio queda
 *   desactivado: la campana sigue funcionando y nada falla.
 * - La suscripción se guarda cifrada en `iam.devices.push_token_encrypted`, que
 *   el modelo ya declaraba para esto; no se crea ninguna tabla.
 * - `pushToUser` **nunca lanza**: un push caído no puede deshacer el acto que
 *   lo originó (misma regla que `emitInApp`).
 */
@Injectable()
export class WebPushService {
  private readonly vapid = readVapid();

  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WebPushService.name);
  }

  /** Clave pública para `pushManager.subscribe`, o `null` si está desactivado. */
  publicKey(): string | null {
    return this.vapid?.publicKey ?? null;
  }

  /** Guarda (o refresca) la suscripción del navegador de esta cuenta. */
  async subscribe(
    userId: string,
    input: WebPushSubscriptionInput,
  ): Promise<void> {
    if (!this.vapid) {
      throw new PreconditionFailedException(
        'Las notificaciones push no están activadas en este entorno',
        {},
      );
    }
    const token = encryptSecret(
      JSON.stringify({ endpoint: input.endpoint, keys: input.keys }),
    );
    const fingerprint = fingerprintOf(input.endpoint);
    await this.em.transactional(async (tx) => {
      const now = new Date();
      const existing = await tx.findOne(Devices, {
        userId,
        deviceFingerprint: fingerprint,
      });
      if (existing) {
        existing.pushTokenEncrypted = token;
        existing.lastSeenAt = now;
        existing.updatedAt = now;
        existing.updatedByUserId = userId;
        return;
      }
      tx.create(Devices, {
        userId,
        deviceFingerprint: fingerprint,
        name: WEB_DEVICE_NAME,
        pushTokenEncrypted: token,
        trusted: false,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
        createdByUserId: userId,
        updatedByUserId: userId,
        rowVersion: 1,
      });
    });
  }

  /** Quita la suscripción de este navegador. Idempotente. */
  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.em.transactional(async (tx) => {
      const device = await tx.findOne(Devices, {
        userId,
        deviceFingerprint: fingerprintOf(endpoint),
      });
      if (!device) return;
      device.pushTokenEncrypted = undefined;
      device.updatedAt = new Date();
      device.updatedByUserId = userId;
    });
  }

  /** Empuja el aviso a todos los navegadores suscritos de la cuenta. */
  async pushToUser(message: WebPushMessage): Promise<void> {
    if (!this.vapid) return;
    try {
      const devices = await this.em.fork().find(Devices, {
        userId: message.recipientUserId,
        pushTokenEncrypted: { $ne: null },
      });
      const body = JSON.stringify({
        title: PUSH_TITLE,
        body: message.subject,
        route: message.route ?? DEFAULT_ROUTE,
        notificationId: message.notificationId,
      });
      for (const device of devices) {
        await this.sendTo(device, body);
      }
    } catch (error: unknown) {
      this.logger.warn(
        {
          operation: 'messaging.web-push.send',
          recipientUserId: message.recipientUserId,
          errorName: error instanceof Error ? error.name : 'unknown',
        },
        'No se pudo enviar el push web; la notificación in-app ya quedó',
      );
    }
  }

  private async sendTo(device: Devices, body: string): Promise<void> {
    if (!device.pushTokenEncrypted) return;
    try {
      const subscription = JSON.parse(
        decryptSecret(device.pushTokenEncrypted),
      ) as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      if (!isAllowedPushEndpoint(subscription.endpoint)) return;
      await webpush.sendNotification(subscription, body, {
        TTL: PUSH_TTL_SECONDS,
        vapidDetails: this.vapid!,
      });
    } catch (error: unknown) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status !== undefined && GONE_STATUS_CODES.includes(status)) {
        await this.forget(device.id);
        return;
      }
      this.logger.warn(
        {
          operation: 'messaging.web-push.device',
          deviceId: device.id,
          status,
          errorName: error instanceof Error ? error.name : 'unknown',
        },
        'El servicio de push rechazó el envío',
      );
    }
  }

  /** El navegador ya no existe (404/410): se borra la suscripción muerta. */
  private async forget(deviceId: string): Promise<void> {
    await this.em.transactional(async (tx) => {
      const device = await tx.findOne(Devices, { id: deviceId });
      if (device) device.pushTokenEncrypted = undefined;
    });
  }
}

interface VapidDetails {
  subject: string;
  publicKey: string;
  privateKey: string;
}

/** Lee las claves VAPID del entorno; `null` si falta alguna. */
function readVapid(): VapidDetails | null {
  const publicKey = process.env['VAPID_PUBLIC_KEY'];
  const privateKey = process.env['VAPID_PRIVATE_KEY'];
  const subject = process.env['VAPID_SUBJECT'];
  if (!publicKey || !privateKey || !subject) return null;
  return { subject, publicKey, privateKey };
}
