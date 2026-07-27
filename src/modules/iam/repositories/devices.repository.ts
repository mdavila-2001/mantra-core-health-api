import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Devices } from '../entities';
import { createdBy } from '../../../common';

/** Alta de un dispositivo asociado a un usuario. */
export interface CreateDeviceData {
  userId: string;
  deviceFingerprint?: string;
  platformConceptId?: string;
  name?: string;
  trusted?: boolean;
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
