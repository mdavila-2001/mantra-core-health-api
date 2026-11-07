import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  getCurrentTenantId,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';
import { DiagnosticUnitsErrorReason } from '../../diagnostic_units.error-reasons';
import { AVAILABILITY_DAYS } from '../domain/center-schedule.model';
import {
  CenterScheduleRepository,
  isPublished,
} from '../infrastructure/center-schedule.repository';
import type {
  StudyAvailabilityDto,
  StudyAvailabilityQueryDto,
} from '../presentation/dto/study-availability.dto';
import { CenterAvailabilityService } from './center-availability.service';
import { CenterContextService } from './center-context.service';

const DAY_MS = 86_400_000;
/** Widest window one request may ask for. */
const MAX_WINDOW_DAYS = 62;

/**
 * `GET /diagnostic-units/:unitId/study-availability`: free starts of a study.
 * It is directory data (when the center attends, how many places are left),
 * never anyone's appointment, so any session reads it for a published center;
 * an unpublished one is visible only to its own organization.
 */
@Injectable()
export class GetStudyAvailabilityUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly scheduleRepo: CenterScheduleRepository,
    private readonly context: CenterContextService,
    private readonly availability: CenterAvailabilityService,
  ) {}

  async execute(
    unitId: string,
    query: StudyAvailabilityQueryDto,
  ): Promise<StudyAvailabilityDto> {
    const em = this.em.fork();
    const unit = await this.scheduleRepo.findUnit(em, unitId);
    if (
      !unit ||
      (!isPublished(unit) && unit.tenant_id !== getCurrentTenantId())
    ) {
      throw new ResourceNotFoundException(
        'Centro no encontrado',
        undefined,
        DiagnosticUnitsErrorReason.DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE,
      );
    }
    const ctx = await this.context.load(em, unit, query.siteId ?? null);
    const study = ctx.studies.find((s) => s.code === query.studyCode);
    if (!study) {
      throw new ResourceNotFoundException('El centro no hace ese estudio', {
        studyCode: query.studyCode,
      });
    }
    const from = query.from ? new Date(query.from) : new Date();
    const to = query.to
      ? new Date(query.to)
      : new Date(from.getTime() + AVAILABILITY_DAYS * DAY_MS);
    if (
      to.getTime() < from.getTime() ||
      to.getTime() - from.getTime() > MAX_WINDOW_DAYS * DAY_MS
    ) {
      throw new PreconditionFailedException(
        `Pida una ventana de hasta ${MAX_WINDOW_DAYS} días, con «to» posterior a «from».`,
        { from: from.toISOString(), to: to.toISOString() },
      );
    }
    const { origin, items } = await this.availability.startsFor(
      em,
      ctx,
      study.code,
      study.modalityCode,
      from,
      to,
    );
    return {
      unitId: unit.id,
      siteId: ctx.site?.site_id ?? null,
      studyCode: study.code,
      origin,
      items,
    };
  }
}
