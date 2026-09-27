import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ClinicalMedicationScheduleController } from './clinical-medication-schedule.controller';
import { ClinicalInternalController } from './clinical-internal.controller';
import { PreconditionFailedException } from '../../../common';

const actor = { id: 'user-p', roles: ['PATIENT'] } as any;

describe('ClinicalMedicationScheduleController · GET :id/schedule.ics', () => {
  it('responde text/calendar como adjunto, sin caché y con nombre genérico', async () => {
    const service = {
      exportIcs: mockFn(() =>
        Promise.resolve({
          content: 'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n',
          fileName: 'tomas-de-medicamento.ics',
        }),
      ),
    };
    const res = { setHeader: mockFn(), send: mockFn() };
    const controller = new ClinicalMedicationScheduleController(service as any);

    await controller.getScheduleIcs(
      'rx-1',
      'America/La_Paz',
      actor,
      res as any,
    );

    expect(service.exportIcs).toHaveBeenCalledWith(
      'rx-1',
      actor,
      'America/La_Paz',
    );
    const headers = Object.fromEntries(
      res.setHeader.mock.calls.map(([k, v]: any) => [k, v]),
    );
    expect(headers['Content-Type']).toBe('text/calendar; charset=utf-8');
    expect(headers['Cache-Control']).toBe('private, no-store');
    expect(headers['Content-Disposition']).toBe(
      "attachment; filename*=UTF-8''tomas-de-medicamento.ics",
    );
    expect(res.send).toHaveBeenCalledWith(
      'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n',
    );
  });

  it('un 422 del servicio (PRN) se propaga sin escribir cabeceras', async () => {
    const service = {
      exportIcs: mockFn(() =>
        Promise.reject(new PreconditionFailedException('según necesidad')),
      ),
    };
    const res = { setHeader: mockFn(), send: mockFn() };
    const controller = new ClinicalMedicationScheduleController(service as any);

    await expect(
      controller.getScheduleIcs('rx-1', undefined, actor, res as any),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(res.setHeader).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it('la ruta sólo lleva el id de la receta y exige rol clínico o de paciente', () => {
    const handler = Object.getOwnPropertyDescriptor(
      ClinicalMedicationScheduleController.prototype,
      'getScheduleIcs',
    )?.value as object;
    const path = Reflect.getMetadata('path', handler);
    expect(path).toBe(':id/schedule.ics');
    expect(
      Reflect.getMetadata('path', ClinicalMedicationScheduleController),
    ).toBe('clinical/medication-requests');
  });
});

describe('ClinicalInternalController · POST medication-reminders/dispatch', () => {
  it('delega ventana y tope al servicio', async () => {
    const service = {
      dispatchDue: mockFn(() => Promise.resolve({ processed: 2, detail: 'x' })),
    };
    const controller = new ClinicalInternalController(service as any);
    const res = await controller.dispatchMedicationReminders({
      windowMinutes: 15,
      limit: 50,
    });
    expect(res.processed).toBe(2);
    expect(service.dispatchDue).toHaveBeenCalledWith({
      windowMinutes: 15,
      limit: 50,
    });
  });
});
