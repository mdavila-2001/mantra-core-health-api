import { Inject, Injectable } from '@nestjs/common';
import {
  persistenceSessionToken,
  type PersistenceSession,
  type ReadContext,
  type WriteContext,
} from '../../../persistence';
import { touch } from '../../../common';
import { AppointmentReminders, WaitlistEntries } from '../entities';
import { SchedulingBookingsRepository } from '../repositories';
import { SchedulingNoticeRepository } from '../repositories/scheduling-notice.repository';
import { SCHEDULING_MODULE } from '../scheduling.tokens';
import type {
  BookingScheduleSnapshot,
  DueReminderSnapshot,
  EnrollWaitlistInput,
  ScheduleRemindersInput,
  SlotCapacitySnapshot,
  WaitlistCandidateSnapshot,
  WaitlistEntryView,
  WaitlistReadPort,
  WaitlistWritePort,
} from '../ports/waitlist.port';

/**
 * Adaptador PostgreSQL de los puertos de la lista de espera.
 *
 * Reutiliza `SchedulingBookingsRepository` en vez de reescribir sus consultas.
 * Es deliberado: el repositorio ya está probado y la migración no busca cambiar
 * cómo se consulta, sino **quién decide la conexión** y **qué tipos cruzan la
 * frontera**. Reescribir aquí las consultas añadiría riesgo de regresión sin
 * aportar nada a ninguno de los dos objetivos.
 *
 * Lo que sí ocurre aquí y no ocurría antes: el mapeo de entidad a modelo de
 * lectura. El servicio deja de recibir entidades gestionadas por MikroORM.
 */
@Injectable()
export class PostgresWaitlistAdapter
  implements WaitlistReadPort, WaitlistWritePort
{
  constructor(
    @Inject(persistenceSessionToken(SCHEDULING_MODULE))
    private readonly session: PersistenceSession,
    private readonly repository: SchedulingBookingsRepository,
    // P8: la lectura de la lista de espera necesita además resolver el nombre
    // de la agenda, que vive en `profiles`. Es mapeo de entidad a modelo de
    // lectura, que es exactamente lo que este adaptador hace.
    private readonly noticeRepository: SchedulingNoticeRepository,
  ) {}

  // ---------------------------------------------------------------- lectura

  findSlotsWithActiveCandidates(
    statusConceptId: string,
    limit: number,
    now: Date,
    context: ReadContext = {},
  ): Promise<string[]> {
    return this.session.read(
      'waitlist.findSlotsWithActiveCandidates',
      (em) =>
        this.repository.findSlotsWithWaitlistCandidates(
          em,
          statusConceptId,
          limit,
          now,
        ),
      // Descubrimiento de trabajo para un worker: tolera retraso de réplica.
      // Declararlo `eventual` es lo que permite que esta consulta -de las más
      // pesadas del módulo- salga de la primaria el día que haya réplica.
      { ...context, consistency: context.consistency ?? 'eventual' },
    );
  }

  findEntriesForPatient(
    patientProfileId: string,
    statusConceptIds: readonly string[] | undefined,
    limit: number,
    context: ReadContext = {},
  ): Promise<readonly WaitlistEntryView[]> {
    return this.session.read(
      'waitlist.findEntriesForPatient',
      (em) =>
        this.noticeRepository.findWaitlistByPatient(
          em,
          patientProfileId,
          statusConceptIds,
          limit,
        ),
      context,
    );
  }

  // -------------------------------------------------------------- escritura

  async enroll(
    input: EnrollWaitlistInput,
    context: WriteContext,
  ): Promise<{ id: string }> {
    return this.session.write(
      'waitlist.enroll',
      async (em) => {
        const entry = this.repository.createWaitlistEntry(em, {
          tenantId: input.tenantId,
          patientProfileId: input.patientProfileId,
          resourceId: input.resourceId,
          desiredFrom: input.desiredFrom,
          desiredTo: input.desiredTo,
          priority: input.priority,
          statusConceptId: input.statusConceptId,
          actorUserId: input.actorUserId,
        });
        // `flush` explícito: `em.create` solo encola. Dentro de una transacción
        // el `flush` final lo haría igualmente, pero adelantarlo aquí es lo que
        // permite devolver un `id` ya materializado por la base.
        await em.flush();
        return { id: entry.id };
      },
      context,
    );
  }

  async findSlotCapacity(
    slotId: string,
    context: WriteContext,
  ): Promise<SlotCapacitySnapshot | null> {
    return this.session.write(
      'waitlist.findSlotCapacity',
      async (em) => {
        const slot = await this.repository.findSlotById(em, slotId);
        return slot
          ? {
              id: slot.id,
              resourceId: slot.resourceId,
              remainingCapacity: slot.remainingCapacity,
            }
          : null;
      },
      context,
    );
  }

  async findActiveCandidates(
    resourceId: string,
    statusConceptId: string,
    limit: number,
    context: WriteContext,
  ): Promise<WaitlistCandidateSnapshot[]> {
    return this.session.write(
      'waitlist.findActiveCandidates',
      async (em) => {
        const candidates = await this.repository.findWaitlistCandidates(
          em,
          resourceId,
          statusConceptId,
          limit,
        );
        return candidates.map((candidate) => ({
          id: candidate.id,
          priority: candidate.priority,
        }));
      },
      context,
    );
  }

  async markCandidatesFulfilled(
    ids: readonly string[],
    statusConceptId: string,
    context: WriteContext,
  ): Promise<number> {
    if (ids.length === 0) return 0;
    return this.session.write(
      'waitlist.markCandidatesFulfilled',
      async (em) => {
        const rows = await em.find(WaitlistEntries, { id: { $in: [...ids] } });
        for (const row of rows) {
          row.statusConceptId = statusConceptId;
          touch(row, context.actorUserId);
        }
        await em.flush();
        return rows.length;
      },
      context,
    );
  }

  async findBookingScheduleForUpdate(
    bookingId: string,
    context: WriteContext,
  ): Promise<BookingScheduleSnapshot | null> {
    return this.session.write(
      'waitlist.findBookingScheduleForUpdate',
      async (em) => {
        const booking = await this.repository.findBookingByIdForUpdate(
          em,
          bookingId,
        );
        if (!booking) return null;
        const slot = await this.repository.findSlotById(
          em,
          booking.bookableSlotId,
        );
        if (!slot) return null;
        return { bookingId: booking.id, slotStartAt: slot.startAt };
      },
      context,
    );
  }

  async scheduleReminders(
    input: ScheduleRemindersInput,
    context: WriteContext,
  ): Promise<number> {
    return this.session.write(
      'waitlist.scheduleReminders',
      async (em) => {
        for (const offset of input.offsetsMinutes) {
          this.repository.createReminder(em, {
            bookingId: input.bookingId,
            channelConceptId: input.channelConceptId,
            offsetMinutes: offset,
            scheduledAt: new Date(
              input.slotStartAt.getTime() - offset * 60_000,
            ),
            statusConceptId: input.statusConceptId,
            actorUserId: input.actorUserId,
          });
        }
        await em.flush();
        return input.offsetsMinutes.length;
      },
      context,
    );
  }

  async findDueReminders(
    statusConceptId: string,
    now: Date,
    limit: number,
    context: WriteContext,
  ): Promise<DueReminderSnapshot[]> {
    return this.session.write(
      'waitlist.findDueReminders',
      async (em) => {
        const due = await this.repository.findDueReminders(
          em,
          statusConceptId,
          now,
          limit,
        );
        return due.map((reminder) => ({ id: reminder.id }));
      },
      context,
    );
  }

  async markRemindersSent(
    ids: readonly string[],
    statusConceptId: string,
    sentAt: Date,
    context: WriteContext,
  ): Promise<number> {
    if (ids.length === 0) return 0;
    return this.session.write(
      'waitlist.markRemindersSent',
      async (em) => {
        const reminders = await em.find(AppointmentReminders, {
          id: { $in: [...ids] },
        });
        for (const reminder of reminders) {
          reminder.statusConceptId = statusConceptId;
          reminder.sentAt = sentAt;
          touch(reminder, context.actorUserId);
        }
        await em.flush();
        return reminders.length;
      },
      context,
    );
  }
}
