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
import { CenterContextService } from './center-context.service';
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
    const resource = await this.scheduleRepo.findResource(em, unit.id);
    if (!resource) return { items: [], count: 0 };
    const [[site], ctx] = await Promise.all([
      this.scheduleRepo.findMainSites(em, [unit.id]),
      this.context.load(em, unit),
    ]);
    const rows = await this.bookingsRepo.listForResource(
      em,
      resource.id,
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
    const items = rows.map((row) => ({
      bookingId: row.id,
      orderId: row.snapshot?.serviceRequestId ?? null,
      patientName: row.patient_name,
      studyName: row.snapshot?.studyName ?? null,
      startsAt: new Date(row.start_at).toISOString(),
      endsAt: new Date(row.end_at).toISOString(),
      siteName: row.snapshot?.siteName ?? site?.site_name ?? null,
      status: STATUS[row.status_concept_id] ?? 'CONFIRMED',
      equipmentId: lineOf.get(row.id) ?? null,
    }));
    return { items, count: items.length };
  }
}
