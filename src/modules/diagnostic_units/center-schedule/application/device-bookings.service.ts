import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { planAdoption, type OccupyingBooking } from '../domain/availability';
import type { CenterDevice } from '../domain/center-schedule.model';
import { CenterBookingsRepository } from '../infrastructure/center-bookings.repository';
import { DeviceResourcesRepository } from '../infrastructure/device-resources.repository';
import {
  resourceIdsOf,
  toOccupying,
  type CenterContext,
} from './center-context.service';

/** How far ahead bookings are looked at when a schedule or a device changes. */
export const FUTURE_WINDOW_MS = 366 * 86_400_000;

/**
 * The bookings of a center seen per device, and the one-time adoption of the
 * bookings taken before devices were production lines: those live on the
 * center's resource, and every write of the center moves the ones an
 * operational device can attend. What no device can take stays where it is
 * and surfaces as «without equipment»: the server never cancels a patient's
 * appointment on its own.
 */
@Injectable()
export class DeviceBookingsService {
  constructor(
    private readonly bookingsRepo: CenterBookingsRepository,
    private readonly devicesRepo: DeviceResourcesRepository,
  ) {}

  /** Future bookings of the center and its devices, from now on. */
  async future(
    em: EntityManager,
    ctx: CenterContext,
  ): Promise<OccupyingBooking[]> {
    const now = new Date();
    const rows = await this.bookingsRepo.findOccupying(
      em,
      resourceIdsOf(ctx),
      now,
      new Date(now.getTime() + FUTURE_WINDOW_MS),
    );
    return rows
      .map(toOccupying)
      .filter((b) => b.startAt.getTime() > now.getTime());
  }

  /** The resource of a device, created on first need. */
  async resourceOf(
    em: EntityManager,
    ctx: CenterContext,
    device: CenterDevice,
    actorId: string,
  ): Promise<string> {
    if (device.resourceId) return device.resourceId;
    return this.devicesRepo.createResource(
      em,
      ctx.unit,
      device,
      ctx.zone,
      actorId,
    );
  }

  /**
   * Moves the legacy bookings a device can attend onto that device. Returns
   * the context with the resources it had to create, so the caller keeps
   * working on fresh data without reloading.
   */
  async adoptLegacy(
    em: EntityManager,
    ctx: CenterContext,
    actorId: string,
  ): Promise<CenterContext> {
    if (ctx.resourceId === null || ctx.equipment.length === 0) return ctx;
    const future = await this.future(em, ctx);
    const legacy = future.filter((b) => b.equipmentId === null);
    const taken = future.filter((b) => b.equipmentId !== null);
    const plan = planAdoption(
      ctx.schedule,
      legacy,
      ctx.equipment,
      taken,
      ctx.zone,
    );
    if (plan.length === 0) return ctx;
    const equipment = [...ctx.equipment];
    for (const { booking, device } of plan) {
      const index = equipment.findIndex((e) => e.id === device.id);
      const resourceId = await this.resourceOf(
        em,
        ctx,
        equipment[index],
        actorId,
      );
      equipment[index] = { ...equipment[index], resourceId };
      await this.bookingsRepo.moveToDevice(
        em,
        {
          id: booking.id,
          slot_id: booking.slotId,
          resource_id: booking.resourceId,
          start_at: booking.startAt,
          end_at: booking.endAt,
          modality_code: booking.modalityCode,
          study_code: booking.studyCode,
          equipment_id: null,
        },
        { id: device.id, name: device.name, resourceId },
        actorId,
      );
    }
    return { ...ctx, equipment };
  }
}
