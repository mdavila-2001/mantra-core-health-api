import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Devices } from '../entities';
import { createdBy } from '../../../common';

/** Alta de un dispositivo asociado a un usuario. */
export interface CreateDeviceData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Valor de device fingerprint mantenido por la instancia.
   */
  deviceFingerprint?: string;
  /**
   * Identificador asociado a platform concept.
   */
  platformConceptId?: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name?: string;
  /**
   * Valor de trusted mantenido por la instancia.
   */
  trusted?: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `iam.devices`. */
@Injectable()
export class DevicesRepository {
  /** Crea un dispositivo (sin flush). */
  create(em: EntityManager, data: CreateDeviceData): Devices {
    return em.create(
      Devices,
      {
        userId: data.userId,
        deviceFingerprint: data.deviceFingerprint,
        platformConceptId: data.platformConceptId,
        name: data.name,
        trusted: data.trusted ?? false,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
