import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ConflictException, type AuthenticatedUser } from '../../../../common';
import { DeviceResourcesRepository } from '../infrastructure/device-resources.repository';
import type { CenterScheduleViewDto } from '../presentation/dto/center-schedule-view.dto';
import { CenterContextService } from './center-context.service';
import { GetCenterScheduleUseCase } from './get-center-schedule.use-case';
import { UpdateEquipmentUseCase } from './update-equipment.use-case';

/**
 * `DELETE /diagnostic-units/:unitId/equipment/:equipmentId`: the center
 * retires a device it no longer has. A device that ever attended a booking
 * keeps its history: 409, and the center marks it out of service instead.
 * Otherwise its resource is retired (never deleted: published templates are
 * audited) and the equipment row goes away.
 */
@Injectable()
export class RemoveEquipmentUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly devicesRepo: DeviceResourcesRepository,
    private readonly context: CenterContextService,
    private readonly updater: UpdateEquipmentUseCase,
    private readonly reader: GetCenterScheduleUseCase,
  ) {}

  execute(
    unitId: string,
    equipmentId: string,
    actor: AuthenticatedUser,
  ): Promise<CenterScheduleViewDto> {
    return this.em.transactional(async (tx) => {
      const unit = await this.reader.staffUnit(tx, unitId);
      await this.updater.ownEquipment(tx, unit.id, equipmentId);
      const ctx = await this.context.load(tx, unit);
      const device = ctx.equipment.find((e) => e.id === equipmentId);
      const resourceId = device?.resourceId ?? null;
      if (resourceId && (await this.devicesRepo.hasBookings(tx, resourceId))) {
        throw new ConflictException(
          'Este equipo ya atendió turnos y conserva su historia: márquelo fuera de servicio.',
          { equipmentId },
        );
      }
      if (resourceId) {
        await this.devicesRepo.retireResource(tx, resourceId, actor.id);
      }
      await this.devicesRepo.deleteEquipment(tx, equipmentId);
      return this.reader.view(tx, await this.context.load(tx, unit));
    });
  }
}
