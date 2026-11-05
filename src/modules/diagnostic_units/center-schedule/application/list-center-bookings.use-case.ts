import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, PreconditionFailedException } from '../../../../common';
import { SCHED } from '../../../scheduling/domain/scheduling.concepts';
import { CenterBookingsRepository } from '../infrastructure/center-bookings.repository';
import type {
  CenterBookingsDto,
  CenterBookingsQueryDto,
} from '../presentation/dto/center-bookings.dto';
import { CenterContextService, resourceIdsOf } from './center-context.service';
import { GetCenterScheduleUseCase } from './get-center-schedule.use-case';

const STATUS: Readonly<Record<string, string>> = {
  [SCHED.BOOKING_REQUESTED]: 'REQUESTED',
  [SCHED.BOOKING_PENDING_CONFIRMATION]: 'PENDING_CONFIRMATION',
  [CONCEPTS.BOOKING_CONFIRMED]: 'CONFIRMED',
  [CONCEPTS.BOOKING_CHECKED_IN]: 'CHECKED_IN',
  [SCHED.BOOKING_IN_PROGRESS]: 'IN_PROGRESS',
  [SCHED.BOOKING_COMPLETED]: 'COMPLETED',
};

/** Widest window one request may ask for. */
const MAX_WINDOW_MS = 31 * 86_400_000;

/**
 * `GET /diagnostic-units/me/bookings?from&to`: the appointments booked at the
 * active organization's center, on its resource and on each device's, by
 * start. Cancelled ones are left out. It is PHI (patient names) for the
 * center's own staff: never logged.
 */
@Injectable()
export class ListCenterBookingsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: CenterBookingsRepository,
    private readonly context: CenterContextService,
    private readonly reader: GetCenterScheduleUseCase,
  ) {}

  async execute(query: CenterBookingsQueryDto): Promise<CenterBookingsDto> {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (
      to.getTime() <= from.getTime() ||
      to.getTime() - from.getTime() > MAX_WINDOW_MS
    ) {
      throw new PreconditionFailedException(
        'Pida una ventana de hasta 31 días, con «to» posterior a «from».',
        { from: from.toISOString(), to: to.toISOString() },
      );
    }
    const em = this.em.fork();
    const unit = await this.reader.myUnit(em);
    const ctx = await this.context.load(em, unit);
    const rows = await this.bookingsRepo.listForResources(
      em,
      resourceIdsOf(ctx),
      from,
      to,
    );
    const items = rows.map((row) => {
      const device = ctx.equipment.find(
        (e) => e.id === row.snapshot?.equipmentId,
      );
      return {
        bookingId: row.id,
        orderId: row.snapshot?.serviceRequestId ?? null,
        patientName: row.patient_name,
        studyName: row.snapshot?.studyName ?? null,
        startsAt: new Date(row.start_at).toISOString(),
        endsAt: new Date(row.end_at).toISOString(),
        siteName: row.snapshot?.siteName ?? ctx.site?.site_name ?? null,
        equipmentId: device?.id ?? row.snapshot?.equipmentId ?? null,
        equipmentName: device?.name ?? row.snapshot?.equipmentName ?? null,
        status: STATUS[row.status_concept_id] ?? 'CONFIRMED',
      };
    });
    return { items, count: items.length };
  }
}
