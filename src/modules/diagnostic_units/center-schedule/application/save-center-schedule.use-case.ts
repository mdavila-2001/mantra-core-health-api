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
import { templateName, validateSchedule } from '../domain/schedule-rules';
import { CenterBookingsRepository } from '../infrastructure/center-bookings.repository';
import { CenterScheduleRepository } from '../infrastructure/center-schedule.repository';
import type { SaveCenterScheduleDto } from '../presentation/dto/center-schedule.dto';
import type { CenterScheduleViewDto } from '../presentation/dto/center-schedule-view.dto';
import { CenterContextService, toOccupying } from './center-context.service';
import { GetCenterScheduleUseCase } from './get-center-schedule.use-case';

const FUTURE_WINDOW_MS = 366 * 86_400_000;

/**
 * `PUT /diagnostic-units/:unitId/schedule`: publishes the whole schedule.
 * The previous templates are retired, not deleted. 409 when a booked future
 * appointment would fall outside the new schedule: the server never cancels
 * a patient's appointment on its own.
 */
@Injectable()
export class SaveCenterScheduleUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly scheduleRepo: CenterScheduleRepository,
    private readonly bookingsRepo: CenterBookingsRepository,
    private readonly context: CenterContextService,
    private readonly reader: GetCenterScheduleUseCase,
  ) {}

  execute(
    unitId: string,
    dto: SaveCenterScheduleDto,
    actor: AuthenticatedUser,
  ): Promise<CenterScheduleViewDto> {
    return this.em.transactional(async (tx) => {
      const unit = await this.reader.staffUnit(tx, unitId);
      const ctx = await this.context.load(tx, unit);
      // Like the frontend rules: a block for a study the center no longer
      // offers, or a repeated modality, is dropped instead of failing.
      const offered = new Map(ctx.studyRows.map((s) => [s.study_code, s]));
      const schedule: CenterSchedule = {
        general: dto.general,
        modalities: dto.modalities.filter(
          (m, i) =>
            dto.modalities.findIndex(
              (x) => x.modalityCode === m.modalityCode,
            ) === i,
        ),
        studies: dto.studies.filter(
          (s, i) =>
            offered.has(s.studyCode) &&
            dto.studies.findIndex((x) => x.studyCode === s.studyCode) === i,
        ),
        // Only devices of this center, once each.
        equipment: (dto.equipment ?? []).filter(
          (e, i, all) =>
            ctx.equipment.some((x) => x.id === e.equipmentId) &&
            all.findIndex((x) => x.equipmentId === e.equipmentId) === i,
        ),
      };
      const problems = validateSchedule(schedule);
      if (problems.length > 0) {
        throw new PreconditionFailedException(
          'El horario tiene datos incompletos.',
          { problems },
        );
      }

      const resourceId =
        ctx.resourceId ??
        (await this.scheduleRepo.createResource(tx, unit, ctx.zone, actor.id));
      await this.bookingsRepo.lockResource(tx, resourceId);
      const now = new Date();
      const future = (
        await this.bookingsRepo.findOccupying(
          tx,
          resourceId,
          now,
          new Date(now.getTime() + FUTURE_WINDOW_MS),
        )
      )
        .map(toOccupying)
        .filter((b) => b.startAt.getTime() > now.getTime());
      const affected = bookingsOutsideSchedule(schedule, future, ctx.zone);
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
      for (const e of schedule.equipment) {
        await insert(
          templateName({ level: 'EQUIPMENT', key: e.equipmentId }),
          null,
          e.schedule,
        );
      }
      return this.reader.view(tx, await this.context.load(tx, unit));
    });
  }
}
