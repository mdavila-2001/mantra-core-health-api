import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import { IamErrorReason } from '../../iam.error-reasons';
import {
  UsersRepository,
  DevicesRepository,
  SecurityEventsRepository,
} from '../../infrastructure/repositories';
import {
  CreateDeviceDto,
  DeviceResponseDto,
  type DevicePlatform,
} from '../../presentation/dto';

const PLATFORM_CONCEPT: Readonly<Record<DevicePlatform, string>> = {
  IOS: CONCEPTS.PLATFORM_IOS,
  ANDROID: CONCEPTS.PLATFORM_ANDROID,
  WEB: CONCEPTS.PLATFORM_WEB,
};

/**
 * Roles que pueden registrar un dispositivo sobre una cuenta que no es la propia. Son los mismos
 * que administran el resto de `/iam/users/:id` (todas esas rutas llevan `@Roles('SECURITY_ADMIN')`;
 * `SUPERADMIN` pasa cualquier `@Roles`, ver `roles.guard.ts`).
 */
const ROLES_THAT_MANAGE_DEVICES: readonly string[] = [
  'SECURITY_ADMIN',
  'SUPERADMIN',
];

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

  /**
   * UC-01-05: registra un dispositivo, opcionalmente marcándolo de confianza.
   *
   * Titularidad: la ruta `POST /iam/users/:id/devices` no lleva `@Roles` (el titular registra los
   * suyos), de modo que la decide este servicio. Un dispositivo —y su marca de confianza— lo
   * registra el dueño de la cuenta o un administrador de seguridad; para cualquier otro es 403
   * genérico, sin confirmar si el id existe.
   *
   * @throws ForbiddenException si el actor no es el titular ni un administrador de seguridad.
   */
  async register(
    userId: string,
    dto: CreateDeviceDto,
    actor: AuthenticatedUser,
  ): Promise<DeviceResponseDto> {
    if (
      actor.id !== userId &&
      !actor.roles.some((role) => ROLES_THAT_MANAGE_DEVICES.includes(role))
    ) {
      this.logger.warn(
        { operation: 'iam.device.forbidden', userId, actorId: actor.id },
        'Device registration over another account rejected',
      );
      throw new ForbiddenException(
        'No tiene acceso a los dispositivos de esta cuenta',
      );
    }
    this.logger.info(
      { operation: 'iam.device.register', userId, trust: dto.trust === true },
      'Registering device',
    );
    return this.em.transactional(async (tx) => {
      const user = await this.usersRepo.findById(tx, userId);
      if (!user)
        throw new ResourceNotFoundException(
          'Usuario no encontrado',
          { userId },
          IamErrorReason.USER_NOT_FOUND,
        );

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
