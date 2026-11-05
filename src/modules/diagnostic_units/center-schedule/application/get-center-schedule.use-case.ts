import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { requireTenantId, ResourceNotFoundException } from '../../../../common';
import { DiagnosticUnitsErrorReason } from '../../diagnostic_units.error-reasons';
import { bookingsWithoutEquipment } from '../domain/availability';
import {
  CenterScheduleRepository,
  type UnitRow,
} from '../infrastructure/center-schedule.repository';
import { CenterBookingsRepository } from '../infrastructure/center-bookings.repository';
import type { CenterScheduleViewDto } from '../presentation/dto/center-schedule-view.dto';
import {
  CenterContextService,
  toOccupying,
  type CenterContext,
} from './center-context.service';

const OUT_OF_SCOPE =
  DiagnosticUnitsErrorReason.DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE;

/** How far ahead «bookings left without equipment» looks. */
const FUTURE_WINDOW_MS = 366 * 86_400_000;

/**
 * `GET /diagnostic-units/me/schedule` and `GET /diagnostic-units/:unitId/schedule`:
 * the center's schedule, studies and equipment, seen by its own staff.
 */
@Injectable()
export class GetCenterScheduleUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly scheduleRepo: CenterScheduleRepository,
    private readonly bookingsRepo: CenterBookingsRepository,
    private readonly context: CenterContextService,
  ) {}

  /** The unit of the active organization (one per tenant). */
  async myUnit(em: EntityManager): Promise<UnitRow> {
    const unit = await this.scheduleRepo.findUnitOfTenant(
      em,
      requireTenantId(),
    );
    if (!unit) {
      throw new ResourceNotFoundException(
        'Su organización no tiene un centro de diagnóstico con agenda.',
        undefined,
        OUT_OF_SCOPE,
      );
    }
    return unit;
  }

  /** A unit of the active tenant; another tenant's answers like a missing one. */
  async staffUnit(em: EntityManager, unitId: string): Promise<UnitRow> {
    const unit = await this.scheduleRepo.findUnit(em, unitId);
    if (!unit || unit.tenant_id !== requireTenantId()) {
      throw new ResourceNotFoundException(
        'Unidad no encontrada',
        undefined,
        OUT_OF_SCOPE,
      );
    }
    return unit;
  }

  async forMe(): Promise<CenterScheduleViewDto> {
    const em = this.em.fork();
    return this.view(em, await this.context.load(em, await this.myUnit(em)));
  }

  async forUnit(unitId: string): Promise<CenterScheduleViewDto> {
    const em = this.em.fork();
    const unit = await this.staffUnit(em, unitId);
    return this.view(em, await this.context.load(em, unit));
  }

  /** The wire view of a loaded center. */
  async view(
    em: EntityManager,
    ctx: CenterContext,
  ): Promise<CenterScheduleViewDto> {
    const now = new Date();
    const future = ctx.resourceId
      ? (
          await this.bookingsRepo.findOccupying(
            em,
            ctx.resourceId,
            now,
            new Date(now.getTime() + FUTURE_WINDOW_MS),
          )
        ).map(toOccupying)
      : [];
    return {
      unitId: ctx.unit.id,
      unitName: ctx.unit.name,
      kind: ctx.kind,
      schedule: ctx.schedule,
      studies: ctx.studies,
      equipment: ctx.equipment,
      updatedAt: ctx.updatedAt ? new Date(ctx.updatedAt).toISOString() : null,
      bookingsWithoutEquipment: bookingsWithoutEquipment(
        future,
        ctx.equipment,
        ctx.declaredCapacity,
      ),
    };
  }
}
