import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Devices } from '../../../iam/entities';
import type { DevicePort } from '../../services/support-access-context.ports';

/** Dispositivos de confianza de la persona (reconocimiento de dispositivos de `iam`). */
@Injectable()
export class DeviceAdapter implements DevicePort {
  async isTrusted(
    em: EntityManager,
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    // Solo cuenta un dispositivo de LA persona: el de otra no es de confianza.
    const device = await em.findOne(Devices, { id: deviceId, userId });
    return device?.trusted === true;
  }
}
