import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import {
  CreateMedicationRequestDto,
  EditMedicationRequestDraftDto,
} from './medication.dto';

/**
 * Posología estructurada de la receta (patch v4.2.35), validada con las mismas
 * opciones que el `ValidationPipe` global (`whitelist` +
 * `forbidNonWhitelisted`).
 */

const TENANT = '11111111-1111-4111-8111-111111111111';
const PATIENT = '22222222-2222-4222-8222-222222222222';
const MEDICATION = '33333333-3333-4333-8333-333333333333';

/** Rutas `timing.<campo>` con error, sin repetidos. */
function errores(list: readonly ValidationError[], prefix = ''): string[] {
  const out = new Set<string>();
  for (const error of list) {
    const path = prefix ? `${prefix}.${error.property}` : error.property;
    if (error.constraints) out.add(path);
    for (const child of errores(error.children ?? [], path)) out.add(child);
  }
  return [...out].sort();
}

/** Valida un alta de receta con `timing`. */
async function alta(timing: unknown): Promise<string[]> {
  const dto = plainToInstance(CreateMedicationRequestDto, {
    custodianTenantId: TENANT,
    patientProfileId: PATIENT,
    medicationConceptId: MEDICATION,
    frequencyText: 'cada 8 horas',
    timing,
  });
  return errores(
    await validate(dto, { whitelist: true, forbidNonWhitelisted: true }),
  );
}

describe('MedicationTimingDto · posología estructurada', () => {
  describe('correcto', () => {
    it('frecuencia por período', async () => {
      expect(
        await alta({
          frequency: 3,
          period: 1,
          periodUnit: 'd',
          startAt: '2026-09-26T12:00:00Z',
          durationDays: 7,
          timeZone: 'America/La_Paz',
        }),
      ).toEqual([]);
    });

    it('horas del día', async () => {
      expect(await alta({ timesOfDay: ['08:00', '20:00'] })).toEqual([]);
    });

    it('PRN solo, y la receta sin timing sigue valiendo', async () => {
      expect(await alta({ asNeeded: true })).toEqual([]);
      expect(await alta(undefined)).toEqual([]);
    });

    it('la edición de borrador también la acepta', async () => {
      const dto = plainToInstance(EditMedicationRequestDraftDto, {
        timing: { timesOfDay: ['09:30'] },
      });
      expect(
        errores(
          await validate(dto, { whitelist: true, forbidNonWhitelisted: true }),
        ),
      ).toEqual([]);
    });
  });

  describe('límite', () => {
    it('duración 0, 00:00 y 23:59 son válidos', async () => {
      expect(
        await alta({ timesOfDay: ['00:00', '23:59'], durationDays: 0 }),
      ).toEqual([]);
    });

    it('12 horas del día pasan; 13 no', async () => {
      const doce = Array.from(
        { length: 12 },
        (_, i) => `${String(i).padStart(2, '0')}:00`,
      );
      expect(await alta({ timesOfDay: doce })).toEqual([]);
      expect(await alta({ timesOfDay: [...doce, '13:00'] })).toEqual([
        'timing.timesOfDay',
      ]);
    });
  });

  describe('inválido', () => {
    it('hora 25:00', async () => {
      expect(await alta({ timesOfDay: ['25:00'] })).toEqual([
        'timing.timesOfDay',
      ]);
    });

    it('zona inexistente', async () => {
      expect(
        await alta({ timesOfDay: ['08:00'], timeZone: 'America/Atlantida' }),
      ).toEqual(['timing.timeZone']);
    });

    it('frecuencia sin período ni unidad', async () => {
      expect(await alta({ frequency: 3 })).toEqual(['timing.frequency']);
    });

    it('período 0 y unidad desconocida', async () => {
      expect(await alta({ frequency: 1, period: 0, periodUnit: 'mo' })).toEqual(
        ['timing.period', 'timing.periodUnit'],
      );
    });

    it('PRN excluye frecuencia y horas del día', async () => {
      expect(await alta({ asNeeded: true, timesOfDay: ['08:00'] })).toEqual([
        'timing.timesOfDay',
      ]);
      expect(
        await alta({
          asNeeded: true,
          frequency: 1,
          period: 1,
          periodUnit: 'd',
        }),
      ).toEqual(['timing.frequency']);
    });

    it('horas del día y frecuencia son excluyentes', async () => {
      expect(
        await alta({
          timesOfDay: ['08:00'],
          frequency: 1,
          period: 1,
          periodUnit: 'd',
        }),
      ).toEqual(['timing.frequency', 'timing.timesOfDay']);
    });

    it('duración negativa y propiedad no declarada', async () => {
      expect(
        await alta({ timesOfDay: ['08:00'], durationDays: -1, dosis: 2 }),
      ).toEqual(['timing.dosis', 'timing.durationDays']);
    });
  });
});
