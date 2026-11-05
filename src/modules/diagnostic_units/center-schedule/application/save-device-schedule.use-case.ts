import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import { DiagnosticUnitsErrorReason } from '../../diagnostic_units.error-reasons';
import type { ScheduleBlock } from '../domain/center-schedule.model';
import {
  isSlotStart,
  templateName,
  validateBlock,
} from '../domain/schedule-rules';
import { CenterBookingsRepository } from '../infrastructure/center-bookings.repository';
import { CenterScheduleRepository } from '../infrastructure/center-schedule.repository';
import type { CenterScheduleViewDto } from '../presentation/dto/center-schedule-view.dto';
import { CenterContextService } from './center-context.service';
import { DeviceBookingsService } from './device-bookings.service';
import { GetCenterScheduleUseCase } from './get-center-schedule.use-case';

/**
 * `PUT /diagnostic-units/:unitId/equipment/:equipmentId/schedule`: the hours
 * of one device, its production line. `null` means «follow the center's
 * general schedule» and retires its own. 409 when a booked appointment of the
 * device would fall outside the new hours.
 */
@Injectable()
export class SaveDeviceScheduleUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly scheduleRepo: CenterScheduleRepository,
    private readonly bookingsRepo: CenterBookingsRepository,
    private readonly context: CenterContextService,
    private readonly devices: DeviceBookingsService,
    private readonly reader: GetCenterScheduleUseCase,
  ) {}

  execute(
    unitId: string,
    equipmentId: string,
    schedule: ScheduleBlock | null,
    actor: AuthenticatedUser,
  ): Promise<CenterScheduleViewDto> {
    return this.em.transactional(async (tx) => {
      const unit = await this.reader.staffUnit(tx, unitId);
      const loaded = await this.context.load(tx, unit);
      const device = loaded.equipment.find((e) => e.id === equipmentId);
      if (!device) {
        throw new ResourceNotFoundException(
          'Equipo no encontrado',
          undefined,
          DiagnosticUnitsErrorReason.DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE,
        );
      }
      if (device.modalityCode === null) {
        throw new PreconditionFailedException(
          'Este equipo no da turnos: no tiene horario propio.',
          { equipmentId },
        );
      }
      const problems = schedule ? validateBlock(device.id, schedule) : [];
      if (problems.length > 0) {
        throw new PreconditionFailedException(
          'El horario tiene datos incompletos.',
          { problems },
        );
      }
      if (loaded.resourceId) {
        await this.bookingsRepo.lockResource(tx, loaded.resourceId);
      }
      const ctx = await this.devices.adoptLegacy(tx, loaded, actor.id);
      const current = ctx.equipment.find((e) => e.id === equipmentId)!;
      const resourceId = await this.devices.resourceOf(
        tx,
        ctx,
        current,
        actor.id,
      );
      const block = schedule ?? ctx.schedule.general;
      const outside = (await this.devices.future(tx, ctx)).filter(
        (b) =>
          b.equipmentId === equipmentId &&
          !isSlotStart(block, b.startAt, ctx.zone),
      ).length;
      if (outside > 0) {
        throw new ConflictException(
          outside === 1
            ? 'Hay 1 turno reservado en este equipo que quedaría fuera del horario nuevo.'
            : `Hay ${outside} turnos reservados en este equipo que quedarían fuera del horario nuevo.`,
          { affectedBookings: outside },
        );
      }
      await this.scheduleRepo.retireTemplates(tx, resourceId, actor.id);
      if (schedule) {
        await this.scheduleRepo.insertTemplate(
          tx,
          {
            resourceId,
            name: templateName({ level: 'GENERAL' }),
            serviceConceptId: null,
            slotMinutes: schedule.slotMinutes,
            windows: schedule.windows,
          },
          actor.id,
        );
      }
      return this.reader.view(tx, await this.context.load(tx, unit));
    });
  }
}
