import { jest } from '@jest/globals';

// Fábrica de dobles laxa, igual que en los specs de servicio del módulo.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import {
  AppointmentBookings,
  BookableSlots,
  BookingReschedules,
  ScheduleTemplates,
  SlotHolds,
} from '../../entities';
import { SchedulingCatalogRepository } from './scheduling-catalog.repository';

/**
 * Retirar un horario — qué cupos se sueltan y cuáles se conservan.
 *
 * Defecto destapado al verificar M4 · B10 contra una base real: un cupo del que
 * se REPROGRAMÓ una cita queda sin cita (la cita se fue a otro cupo), pero
 * `scheduling.booking_reschedules.from_slot_id` lo sigue referenciando. El
 * retiro lo contaba como «libre», intentaba borrarlo y Postgres respondía
 * `fk_booking_reschedules_from_slot_id` → la API devolvía 422 «la petición
 * referencia un recurso que no existe». Pasaba con o sin citas vivas: bastaba
 * con que alguna vez se hubiera reprogramado una cita de ese horario.
 *
 * El historial de reprogramaciones es historia igual que una cita: su cupo se
 * conserva.
 */
describe('SchedulingCatalogRepository · retireTemplate', () => {
  function withBase(options: {
    slots: string[];
    withAppointment?: string[];
    reschedules?: Array<{ fromSlotId: string; toSlotId: string }>;
  }) {
    const template = { id: 'tpl-1', statusConceptId: 'TPL_PUBLISHED' };
    const em = {
      find: mockFn(async (entity: unknown, where: any) => {
        if (entity === BookableSlots) {
          return options.slots.map((id) => ({ id }));
        }
        if (entity === AppointmentBookings) {
          return (options.withAppointment ?? []).map((bookableSlotId) => ({
            bookableSlotId,
          }));
        }
        if (entity === BookingReschedules) {
          const ids: string[] = where.$or[0].fromSlotId.$in;
          return (options.reschedules ?? []).filter(
            (r) => ids.includes(r.fromSlotId) || ids.includes(r.toSlotId),
          );
        }
        return [];
      }),
      nativeDelete: mockFn(
        async (_entity: unknown, where: any) => where.id?.$in?.length ?? 0,
      ),
      findOne: mockFn(async (entity: unknown) =>
        entity === ScheduleTemplates ? template : null,
      ),
    };
    return { em, template: template, repo: new SchedulingCatalogRepository() };
  }

  /** Los ids de cupo que se mandaron a borrar. */
  function deleted(em: any): string[] {
    const call = em.nativeDelete.mock.calls.find(
      ([entity]: [unknown]) => entity === BookableSlots,
    );
    return call ? call[1].id.$in : [];
  }

  it('conserva el cupo del que se reprogramó una cita, aunque ya no tenga cita', async () => {
    const { em, repo } = withBase({
      slots: ['s-origen', 's-libre', 's-con-cita'],
      withAppointment: ['s-con-cita'],
      reschedules: [{ fromSlotId: 's-origen', toSlotId: 's-otro' }],
    });

    const res = await repo.retireTemplate(
      em as any,
      'tpl-1',
      'TPL_RETIRED',
      'u-1',
    );

    expect(deleted(em)).toEqual(['s-libre']);
    expect(res).toEqual({ releasedSlots: 1, keptSlots: 2 });
  });

  it('conserva también el cupo DESTINO de una reprogramación', async () => {
    const { em, repo } = withBase({
      slots: ['s-destino', 's-libre'],
      reschedules: [{ fromSlotId: 's-afuera', toSlotId: 's-destino' }],
    });

    await repo.retireTemplate(em as any, 'tpl-1', 'TPL_RETIRED', 'u-1');

    expect(deleted(em)).toEqual(['s-libre']);
  });

  it('sin citas ni reprogramaciones suelta todos los cupos y sus holds', async () => {
    const { em, template, repo } = withBase({ slots: ['s-1', 's-2'] });

    const res = await repo.retireTemplate(
      em as any,
      'tpl-1',
      'TPL_RETIRED',
      'u-1',
    );

    expect(em.nativeDelete).toHaveBeenCalledWith(SlotHolds, {
      bookableSlotId: { $in: ['s-1', 's-2'] },
    });
    expect(deleted(em)).toEqual(['s-1', 's-2']);
    expect(res).toEqual({ releasedSlots: 2, keptSlots: 0 });
    expect(template.statusConceptId).toBe('TPL_RETIRED');
  });

  it('si todos los cupos tienen historia no borra nada', async () => {
    const { em, repo } = withBase({
      slots: ['s-1', 's-2'],
      withAppointment: ['s-1'],
      reschedules: [{ fromSlotId: 's-2', toSlotId: 's-9' }],
    });

    const res = await repo.retireTemplate(
      em as any,
      'tpl-1',
      'TPL_RETIRED',
      'u-1',
    );

    expect(em.nativeDelete).not.toHaveBeenCalled();
    expect(res).toEqual({ releasedSlots: 0, keptSlots: 2 });
  });
});
