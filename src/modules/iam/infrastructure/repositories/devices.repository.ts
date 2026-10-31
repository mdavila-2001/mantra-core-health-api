import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Devices } from '../../entities';
import { createdBy } from '../../../../common';

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
  /** Último momento en que se vio el dispositivo. */
  lastSeenAt?: Date;
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
        lastSeenAt: data.lastSeenAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
  /** Dispositivo por su huella (única en toda la tabla). */
  findByFingerprint(
    em: EntityManager,
    deviceFingerprint: string,
  ): Promise<Devices | null> {
    return em.findOne(Devices, { deviceFingerprint });
  }

  /** Dispositivo por id que pertenece al usuario indicado. */
  findByIdAndUser(
    em: EntityManager,
    id: string,
    userId: string,
  ): Promise<Devices | null> {
    return em.findOne(Devices, { id, userId });
  }

  /** Cuántos dispositivos se han visto de este usuario. */
  countByUser(em: EntityManager, userId: string): Promise<number> {
    return em.count(Devices, { userId });
  }

  /** Dispositivos registrados por el usuario, del más reciente al más antiguo. */
  findByUser(em: EntityManager, userId: string): Promise<Devices[]> {
    return em.find(Devices, { userId }, { orderBy: { createdAt: 'DESC' } });
  }
}
