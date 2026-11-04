import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHash, randomInt } from 'node:crypto';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import type { Devices } from '../../entities';
import {
  CredentialsRepository,
  DevicesRepository,
  EmailVerificationsRepository,
  SecurityEventsRepository,
  SessionsRepository,
  UsersRepository,
} from '../../infrastructure/repositories';
import type {
  DeviceCodeRequestedDto,
  DeviceConfirmedDto,
  MyDeviceDto,
} from '../../presentation/dto';
import { deviceCodeEmail } from '../emails/device-code.email';
import {
  EMAIL_NOTICE_PORT,
  type EmailNoticePort,
} from '../ports/email-notice.port';

const CODE_TTL_MS = 10 * 60 * 1000;
const PLATFORM: Readonly<Record<string, MyDeviceDto['platform']>> = {
  [CONCEPTS.PLATFORM_WEB]: 'WEB',
  [CONCEPTS.PLATFORM_IOS]: 'IOS',
  [CONCEPTS.PLATFORM_ANDROID]: 'ANDROID',
};

/** The code is bound to its device: the same digits never verify another one. */
const codeHash = (deviceId: string, code: string): string =>
  createHash('sha256').update(`device:${deviceId}:${code}`).digest('hex');

/** `j***@correo.com`: never the full address. */
export const maskEmail = (email: string): string =>
  email.replace(/^(.)[^@]*@/, '$1***@');

/**
 * The account owner's devices (Ajustes › Dispositivos): list them and verify one with an
 * 8-digit code mailed to the account's verified address. Ownership always comes from the
 * token; a device of another account is a plain 404.
 *
 * The code rides on `iam.email_verifications` (hash, expiry, single use): it is an email
 * ownership proof, and the table already has every column the code needs.
 */
@Injectable()
export class IamMyDevicesService {
  constructor(
    private readonly em: EntityManager,
    private readonly devicesRepo: DevicesRepository,
    private readonly sessionsRepo: SessionsRepository,
    private readonly usersRepo: UsersRepository,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly verificationsRepo: EmailVerificationsRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    @Inject(EMAIL_NOTICE_PORT) private readonly emailNotice: EmailNoticePort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IamMyDevicesService.name);
  }

  async list(actor: AuthenticatedUser): Promise<MyDeviceDto[]> {
    const em = this.em.fork();
    const [devices, sessions] = await Promise.all([
      this.devicesRepo.findByUser(em, actor.id),
      this.sessionsRepo.findActiveByUser(em, actor.id),
    ]);
    const currentDevice = sessions.find(
      (s) => s.tokenId === actor.sessionId,
    )?.deviceId;
    return devices.map((device) => ({
      id: device.id,
      name: device.name ?? 'Dispositivo desconocido',
      platform: PLATFORM[device.platformConceptId ?? ''],
      trusted: device.trusted === true,
      current: device.id === currentDevice,
      activeSessions: sessions.filter((s) => s.deviceId === device.id).length,
      lastSeenAt: device.lastSeenAt,
      createdAt: device.createdAt,
    }));
  }

  /** Mails a fresh code. `sent: false` when the device is already trusted. */
  async requestCode(
    actor: AuthenticatedUser,
    deviceId: string,
  ): Promise<DeviceCodeRequestedDto> {
    const issued = await this.em.transactional(async (tx) => {
      const device = await this.ownDevice(tx, actor, deviceId);
      if (device.trusted) return undefined;
      const email = await this.verifiedEmail(tx, actor.id);
      const code = String(randomInt(0, 100_000_000)).padStart(8, '0');
      this.verificationsRepo.create(tx, {
        userId: actor.id,
        email,
        tokenHash: codeHash(device.id, code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
        actorUserId: actor.id,
      });
      return { email, code, deviceName: device.name ?? 'su dispositivo' };
    });
    if (!issued) return { sent: false };
    await this.emailNotice.enqueueEmail({
      recipientUserId: actor.id,
      recipientAddress: issued.email,
      ...deviceCodeEmail(issued),
    });
    this.logger.info(
      { operation: 'iam.device.code-sent', userId: actor.id, deviceId },
      'Device code sent',
    );
    return { sent: true, sentTo: maskEmail(issued.email) };
  }

  /**
   * Trusts the device with the mailed code, or without it from a session opened on
   * ANOTHER trusted device: confirming from the device itself proves nothing.
   */
  async confirm(
    actor: AuthenticatedUser,
    deviceId: string,
    code?: string,
  ): Promise<DeviceConfirmedDto> {
    return this.em.transactional(async (tx) => {
      const device = await this.ownDevice(tx, actor, deviceId);
      if (device.trusted) return { confirmed: true, deviceId };
      if (code === undefined) {
        if (!(await this.fromOtherTrustedDevice(tx, actor, deviceId))) {
          throw new PreconditionFailedException(
            'Para verificar este dispositivo hace falta el código enviado a su correo',
            { reason: 'DEVICE_CONFIRM_CODE_REQUIRED', canRequestCode: true },
          );
        }
      } else {
        const pending = await this.verificationsRepo.findByTokenHash(
          tx,
          codeHash(deviceId, code),
        );
        if (
          !pending ||
          pending.userId !== actor.id ||
          pending.consumedAt ||
          pending.stateConceptId !== CONCEPTS.STATE_ACTIVE ||
          pending.expiresAt < new Date()
        ) {
          throw new PreconditionFailedException(
            'El código no es válido o ya se usó',
            {
              reason: 'DEVICE_CONFIRM_CODE_INVALID',
            },
          );
        }
        pending.consumedAt = new Date();
        touch(pending, actor.id);
      }
      device.trusted = true;
      touch(device, actor.id);
      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_DEVICE_TRUST,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: actor.id,
        recordedByUserId: actor.id,
        detailJson: {
          deviceId,
          by: code === undefined ? 'trusted-session' : 'email-code',
        },
      });
      return { confirmed: true, deviceId };
    });
  }

  private async ownDevice(
    tx: EntityManager,
    actor: AuthenticatedUser,
    id: string,
  ): Promise<Devices> {
    const device = await this.devicesRepo.findById(tx, id);
    if (!device || device.userId !== actor.id) {
      throw new ResourceNotFoundException('Dispositivo no encontrado', {
        reason: 'DEVICE_NOT_FOUND',
      });
    }
    return device;
  }

  private async fromOtherTrustedDevice(
    tx: EntityManager,
    actor: AuthenticatedUser,
    target: string,
  ): Promise<boolean> {
    const session = actor.sessionId
      ? await this.sessionsRepo.findActiveByTokenId(tx, actor.sessionId)
      : null;
    if (!session?.deviceId || session.deviceId === target) return false;
    return (
      (await this.devicesRepo.findById(tx, session.deviceId))?.trusted === true
    );
  }

  /** The account's verified address: its login email, or the one declared at sign-up. */
  private async verifiedEmail(
    tx: EntityManager,
    userId: string,
  ): Promise<string> {
    const user = await this.usersRepo.findById(tx, userId);
    const subject = (
      await this.credentialsRepo.findActivePasswordByUser(tx, userId)
    )?.externalSubject;
    const email = subject?.includes('@')
      ? subject
      : (await this.verificationsRepo.findLatestByUser(tx, userId))?.email;
    if (user?.emailVerified !== true || !email) {
      throw new PreconditionFailedException(
        'La cuenta no tiene un correo verificado al que enviar el código',
        { reason: 'DEVICE_CONFIRM_NO_VERIFIED_EMAIL' },
      );
    }
    return email;
  }
}
