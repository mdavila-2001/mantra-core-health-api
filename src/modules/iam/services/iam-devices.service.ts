import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  UsersRepository,
  DevicesRepository,
  SecurityEventsRepository,
} from '../repositories';
import {
  CreateDeviceDto,
  DeviceResponseDto,
  type DevicePlatform,
} from '../dto';

const PLATFORM_CONCEPT: Readonly<Record<DevicePlatform, string>> = {
  IOS: CONCEPTS.PLATFORM_IOS,
  ANDROID: CONCEPTS.PLATFORM_ANDROID,
  WEB: CONCEPTS.PLATFORM_WEB,
};

/** Registro de dispositivos de un usuario (UC-01-05). */
@Injectable()
export class IamDevicesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param usersRepo - Valor de users repo requerido por la operación.
   * @param devicesRepo - Valor de devices repo requerido por la operación.
   * @param eventsRepo - Valor de events repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly usersRepo: UsersRepository,
    private readonly devicesRepo: DevicesRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IamDevicesService.name);
  }

  /** UC-01-05: registra un dispositivo, opcionalmente marcándolo de confianza. */
  async register(
    userId: string,
    dto: CreateDeviceDto,
    actor: AuthenticatedUser,
  ): Promise<DeviceResponseDto> {
    this.logger.info(
      { operation: 'iam.device.register', userId, trust: dto.trust === true },
      'Registering device',
    );
    return this.em.transactional(async (tx) => {
      const user = await this.usersRepo.findById(tx, userId);
      if (!user)
        throw new ResourceNotFoundException('Usuario no encontrado', {
          userId,
        });

      const trusted = dto.trust === true;
      const device = this.devicesRepo.create(tx, {
        userId,
        deviceFingerprint: dto.deviceFingerprint,
        platformConceptId: dto.platform
          ? PLATFORM_CONCEPT[dto.platform]
          : undefined,
        name: dto.name,
        trusted,
        actorUserId: actor.id,
      });

      if (trusted) {
        this.eventsRepo.record(tx, {
          eventTypeConceptId: CONCEPTS.SEC_DEVICE_TRUST,
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
          userId,
          recordedByUserId: actor.id,
          detailJson: { deviceId: device.id },
        });
      }

      return { id: device.id, userId, trusted };
    });
  }
}
