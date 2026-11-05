import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../../common';
import { bookingsOutsideSchedule } from '../domain/availability';
import {
  MODALITY_CONCEPT,
  type CenterSchedule,
  type ScheduleBlock,
} from '../domain/center-schedule.model';
import {
  devicesOf,
  templateName,
  validateSchedule,
} from '../domain/schedule-rules';
import { CenterBookingsRepository } from '../infrastructure/center-bookings.repository';
import { CenterScheduleRepository } from '../infrastructure/center-schedule.repository';
import type { SaveCenterScheduleDto } from '../presentation/dto/center-schedule.dto';
import type { CenterScheduleViewDto } from '../presentation/dto/center-schedule-view.dto';
import {
  CenterContextService,
  type CenterContext,
} from './center-context.service';
import { DeviceBookingsService } from './device-bookings.service';
import { GetCenterScheduleUseCase } from './get-center-schedule.use-case';

/**
 * `PUT /diagnostic-units/:unitId/schedule`: publishes the center's general
 * schedule and its study exceptions. The previous templates are retired, not
 * deleted. 409 when a booked future appointment would fall outside the new
 * schedule: the server never cancels a patient's appointment on its own.
 *
 * A modality schedule is a default for devices that do not exist yet. While
 * the modality has no device it is published as before, so a center that has
 * not inventoried its equipment keeps it. Once the modality has devices, it
 * becomes the own schedule of every device of that modality that has none,
 * and the modality level disappears for that modality.
 */
@Injectable()
export class SaveCenterScheduleUseCase {
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
    dto: SaveCenterScheduleDto,
    actor: AuthenticatedUser,
  ): Promise<CenterScheduleViewDto> {
    return this.em.transactional(async (tx) => {
      const unit = await this.reader.staffUnit(tx, unitId);
      const loaded = await this.context.load(tx, unit);
      // Like the frontend rules: a block for a study the center no longer
      // offers, or a repeated level, is dropped instead of failing.
      const offered = new Map(loaded.studyRows.map((s) => [s.study_code, s]));
      const legacyModalities = [
        ...loaded.schedule.modalities,
        ...dto.modalities,
      ].filter(
        (m, i, all) =>
          all.findIndex((x) => x.modalityCode === m.modalityCode) === i,
      );
      const withoutDevices = (m: {
        modalityCode: CenterSchedule['modalities'][number]['modalityCode'];
      }) => devicesOf(loaded.equipment, m.modalityCode).length === 0;
      const schedule: CenterSchedule = {
        general: dto.general,
        modalities: dto.modalities.filter(
          (m, i) =>
            withoutDevices(m) &&
            dto.modalities.findIndex(
              (x) => x.modalityCode === m.modalityCode,
            ) === i,
        ),
        studies: dto.studies.filter(
          (s, i) =>
            offered.has(s.studyCode) &&
            dto.studies.findIndex((x) => x.studyCode === s.studyCode) === i,
        ),
      };
      const problems = validateSchedule({
        ...schedule,
        modalities: legacyModalities,
      });
      if (problems.length > 0) {
        throw new PreconditionFailedException(
          'El horario tiene datos incompletos.',
          { problems },
        );
      }

      const resourceId =
        loaded.resourceId ??
        (await this.scheduleRepo.createResource(
          tx,
          unit,
          loaded.zone,
          actor.id,
        ));
      await this.bookingsRepo.lockResource(tx, resourceId);
      const ctx = await this.devices.adoptLegacy(
        tx,
        { ...loaded, resourceId },
        actor.id,
      );
      const migrated = await this.migrateModalities(
        tx,
        ctx,
        legacyModalities.filter((m) => !withoutDevices(m)),
        actor.id,
      );
      const future = await this.devices.future(tx, migrated);
      const affected = bookingsOutsideSchedule(
        schedule,
        future,
        migrated.equipment,
        migrated.zone,
      );
      if (affected > 0) {
        throw new ConflictException(
          affected === 1
            ? 'Hay 1 turno reservado que quedaría fuera del horario nuevo.'
            : `Hay ${affected} turnos reservados que quedarían fuera del horario nuevo.`,
          { affectedBookings: affected },
        );
      }

      await this.scheduleRepo.retireTemplates(tx, resourceId, actor.id);
      const insert = (
        name: string,
        serviceConceptId: string | null,
        block: ScheduleBlock,
      ) =>
        this.scheduleRepo.insertTemplate(
          tx,
          {
            resourceId,
            name,
            serviceConceptId,
            slotMinutes: block.slotMinutes,
            windows: block.windows,
          },
          actor.id,
        );
      await insert(templateName({ level: 'GENERAL' }), null, schedule.general);
      for (const m of schedule.modalities) {
        await insert(
          templateName({ level: 'MODALITY', key: m.modalityCode }),
          MODALITY_CONCEPT[m.modalityCode],
          m.schedule,
        );
      }
      for (const s of schedule.studies) {
        await insert(
          templateName({ level: 'STUDY', key: s.studyCode }),
          offered.get(s.studyCode)?.study_concept_id ?? null,
          s.schedule,
        );
      }
      return this.reader.view(tx, await this.context.load(tx, unit));
    });
  }

  /** A modality's old own schedule becomes the own schedule of its devices without one. */
  private async migrateModalities(
    tx: EntityManager,
    ctx: CenterContext,
    modalities: CenterSchedule['modalities'],
    actorId: string,
  ): Promise<CenterContext> {
    const equipment = [...ctx.equipment];
    for (const m of modalities) {
      for (const device of devicesOf(equipment, m.modalityCode)) {
        if (device.schedule !== null) continue;
        const index = equipment.findIndex((e) => e.id === device.id);
        const resourceId = await this.devices.resourceOf(
          tx,
          ctx,
          device,
          actorId,
        );
        await this.scheduleRepo.insertTemplate(
          tx,
          {
            resourceId,
            name: templateName({ level: 'GENERAL' }),
            serviceConceptId: null,
            slotMinutes: m.schedule.slotMinutes,
            windows: m.schedule.windows,
          },
          actorId,
        );
        equipment[index] = { ...device, resourceId, schedule: m.schedule };
      }
    }
    return { ...ctx, equipment };
  }
}
