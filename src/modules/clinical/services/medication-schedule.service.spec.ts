import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { MedicationScheduleService } from './medication-schedule.service';

const PACIENTE = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const NOW = new Date('2026-09-26T15:00:00Z');

function receta(over: Record<string, unknown> = {}): any {
  return {
    id: 'rx-1',
    patientProfileId: PACIENTE,
    prescriberProfileId: 'hp-1',
    timingAsNeeded: false,
    timingTimesOfDay: ['08:00', '20:00'],
    timingStartAt: new Date('2026-09-26T10:00:00Z'),
    ...over,
  };
}

function build(request: any = receta()) {
  const requestsRepo = { findById: mockFn(() => Promise.resolve(request)) };
  const clinicalRead = {
    assertPuedeLeerHistoria: mockFn(() => Promise.resolve()),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new MedicationScheduleService(
    {} as any,
    requestsRepo as any,
    clinicalRead as any,
    logger as any,
  );
  return { service, requestsRepo, clinicalRead, logger };
}

const paciente = { id: 'user-p', roles: ['PATIENT'] } as any;
const prescriptor = {
  id: 'user-m',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
} as any;

describe('MedicationScheduleService · exportación .ics', () => {
  describe('correcto', () => {
    it('el titular lo descarga tras la puerta del expediente; nombre de archivo genérico', async () => {
      const d = build();
      const file = await d.service.exportIcs('rx-1', paciente, undefined, NOW);
      expect(file.fileName).toBe('tomas-de-medicamento.ics');
      expect(file.content).toContain('BEGIN:VCALENDAR');
      expect(file.content).toContain('RRULE:FREQ=DAILY');
      expect(d.clinicalRead.assertPuedeLeerHistoria).toHaveBeenCalledWith(
        PACIENTE,
        paciente,
      );
      // Log con ids, sin contenido.
      const [payload] = d.logger.info.mock.calls[0] as any[];
      expect(payload).toEqual({
        operation: 'clinical.medication.schedule_ics',
        requestId: 'rx-1',
      });
    });

    it('el prescriptor pasa sin consultar la puerta del expediente', async () => {
      const d = build();
      await d.service.exportIcs('rx-1', prescriptor, undefined, NOW);
      expect(d.clinicalRead.assertPuedeLeerHistoria).not.toHaveBeenCalled();
    });

    it('tz sólo aplica si la receta no declara zona', async () => {
      const sinZona = build();
      const a = await sinZona.service.exportIcs(
        'rx-1',
        paciente,
        'America/Lima',
        NOW,
      );
      expect(a.content).toContain('TZID:America/Lima');

      const conZona = build(receta({ timingTimeZone: 'America/La_Paz' }));
      const b = await conZona.service.exportIcs(
        'rx-1',
        paciente,
        'America/Lima',
        NOW,
      );
      expect(b.content).toContain('TZID:America/La_Paz');
    });
  });

  describe('límite', () => {
    it('PRN → 422 con motivo AS_NEEDED', async () => {
      const d = build(
        receta({ timingAsNeeded: true, timingTimesOfDay: undefined }),
      );
      await expect(
        d.service.exportIcs('rx-1', paciente, undefined, NOW),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('duración 0 → 422', async () => {
      const d = build(receta({ timingDurationDays: 0 }));
      await expect(
        d.service.exportIcs('rx-1', paciente, undefined, NOW),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('receta sólo con texto libre → 422', async () => {
      const d = build(receta({ timingTimesOfDay: undefined }));
      await expect(
        d.service.exportIcs('rx-1', paciente, undefined, NOW),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('inválido', () => {
    it('tz inexistente → 400 antes de leer la receta', async () => {
      const d = build();
      await expect(
        d.service.exportIcs('rx-1', paciente, 'Marte/Olympus', NOW),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(d.requestsRepo.findById).not.toHaveBeenCalled();
    });

    it('receta inexistente → 404 antes de autorizar', async () => {
      const d = build(null);
      await expect(
        d.service.exportIcs('rx-1', paciente, undefined, NOW),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.clinicalRead.assertPuedeLeerHistoria).not.toHaveBeenCalled();
    });

    it('sin acceso a la historia → 403 sin calendario', async () => {
      const d = build();
      d.clinicalRead.assertPuedeLeerHistoria.mockRejectedValue(
        new ForbiddenException(),
      );
      await expect(
        d.service.exportIcs('rx-1', paciente, undefined, NOW),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('posología guardada incoherente → 422', async () => {
      const d = build(receta({ timingTimesOfDay: ['25:00'] }));
      await expect(
        d.service.exportIcs('rx-1', paciente, undefined, NOW),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
