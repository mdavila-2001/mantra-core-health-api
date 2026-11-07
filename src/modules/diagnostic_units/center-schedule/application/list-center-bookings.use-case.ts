import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, PreconditionFailedException } from '../../../../common';
import { SCHED } from '../../../scheduling/domain/scheduling.concepts';
import { CenterBookingsRepository } from '../infrastructure/center-bookings.repository';
import { assignToLines } from '../domain/equipment-lines';
import {
  MODALITY_CODES,
  type ModalityCode,
} from '../domain/center-schedule.model';
import { CenterScheduleRepository } from '../infrastructure/center-schedule.repository';
import type {
  CenterBookingsDto,
  CenterBookingsQueryDto,
} from '../presentation/dto/center-bookings.dto';
import {
  CenterContextService,
  type CenterContext,
} from './center-context.service';
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
 * active organization's center, by start. Cancelled ones are left out. It is
 * PHI (patient names) for the center's own staff: never logged.
 *
 * Each booking says which device (production line) attends it, laid first
 * come first served on the lines open for its slot (`assignToLines`);
 * `equipmentId` is `null` when no open line can take it or its modality has
 * no registered device.
 */
@Injectable()
export class ListCenterBookingsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly scheduleRepo: CenterScheduleRepository,
    private readonly bookingsRepo: CenterBookingsRepository,
    private readonly reader: GetCenterScheduleUseCase,
    private readonly context: CenterContextService,
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
    const main = await this.context.load(em, unit, query.siteId ?? null);
    // One site when asked; otherwise every site, each on its own resource.
    const contexts = query.siteId
      ? [main]
      : await Promise.all(
          main.sites
            .slice(1)
            .map((s) => this.context.load(em, unit, s.site_id)),
        ).then((rest) => [main, ...rest]);
    const items: CenterBookingsDto['items'] = [];
    for (const ctx of contexts) {
      if (ctx.resourceId)
        items.push(...(await this.forSite(em, ctx, from, to)));
    }
    items.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return { items, count: items.length };
  }

  /** One site's bookings, each laid on the device (line) that attends it. */
  private async forSite(
    em: EntityManager,
    ctx: CenterContext,
    from: Date,
    to: Date,
  ): Promise<CenterBookingsDto['items']> {
    const rows = await this.bookingsRepo.listForResource(
      em,
      ctx.resourceId!,
      from,
      to,
    );
    const modalityOf = (code: string | undefined): ModalityCode | null =>
      code !== undefined && MODALITY_CODES.includes(code as ModalityCode)
        ? (code as ModalityCode)
        : null;
    const { byEquipment } = assignToLines(
      ctx.schedule,
      ctx.equipment,
      rows.map((row) => ({
        id: row.id,
        startAt: new Date(row.start_at),
        endAt: new Date(row.end_at),
        modalityCode: modalityOf(row.snapshot?.modalityCode),
      })),
      ctx.zone,
    );
    const lineOf = new Map<string, string>();
    for (const [equipmentId, ids] of byEquipment) {
      for (const id of ids) lineOf.set(id, equipmentId);
    }
    return rows.map((row) => ({
      bookingId: row.id,
      orderId: row.snapshot?.serviceRequestId ?? null,
      patientName: row.patient_name,
      studyName: row.snapshot?.studyName ?? null,
      startsAt: new Date(row.start_at).toISOString(),
      endsAt: new Date(row.end_at).toISOString(),
      siteName: row.snapshot?.siteName ?? ctx.site?.site_name ?? null,
      status: STATUS[row.status_concept_id] ?? 'CONFIRMED',
      equipmentId: lineOf.get(row.id) ?? null,
    }));
  }
}
