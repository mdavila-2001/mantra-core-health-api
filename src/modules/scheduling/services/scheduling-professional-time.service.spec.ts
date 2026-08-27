import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { SchedulingProfessionalTimeService } from './scheduling-professional-time.service';
import { PreconditionFailedException } from '../../../common';

const HP = 'aaaaaaaa-0000-0000-0000-0000000000hp';

/** Un compromiso confirmado, con lo que la consulta devuelve. */
function compromiso(over: Record<string, unknown> = {}) {
  return {
    id: 'bk-1',
    startAt: new Date('2026-09-03T14:00:00Z'),
    endAt: new Date('2026-09-03T14:30:00Z'),
    statusConceptId: 'confirmada',
    resourceName: 'Consultorio Centro',
    timeZone: 'America/La_Paz',
    patientProfileId: 'pp-ana',
    ...over,
  };
}

/**
 * Arma el servicio con su repositorio doble.
 *
 * @returns El servicio y el doble, para programar y observar.
 */
function build() {
  const bookingsRepo = {
    findProfessionalCommitmentsOverlapping: mockFn(async () => []),
    findPatientNames: mockFn(async () => new Map([['pp-ana', 'Ana Quispe']])),
  };
  const service = new SchedulingProfessionalTimeService(bookingsRepo as any);
  return { service, bookingsRepo };
}

describe('SchedulingProfessionalTimeService — la regla madre (AG-1)', () => {
  it('con el rango libre no dice nada', async () => {
    const d = build();

    await d.service.assertRangoLibre(
      {} as any,
      HP,
      new Date('2026-09-03T15:00:00Z'),
      new Date('2026-09-03T15:30:00Z'),
    );

    expect(d.bookingsRepo.findPatientNames).not.toHaveBeenCalled();
  });

  it('un compromiso en OTRA sede bloquea igual: el escaso es el médico', async () => {
    // El caso que se comprobó roto ejecutando: confirmada 14:00–14:30 en el
    // consultorio A, y el sistema dejaba confirmar 14:15–14:45 en el B.
    const d = build();
    d.bookingsRepo.findProfessionalCommitmentsOverlapping.mockResolvedValue([
      compromiso(),
    ]);

    await expect(
      d.service.assertRangoLibre(
        {} as any,
        HP,
        new Date('2026-09-03T14:15:00Z'),
        new Date('2026-09-03T14:45:00Z'),
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('el mensaje dice QUÉ, CUÁNDO y DÓNDE, en la hora de la sede', async () => {
    // Con multi-sede el dónde es la mitad de la información. Y la hora va en la
    // zona de la sede: 14:00 UTC en La Paz son las 10:00 — decir «18:00» por una
    // consulta de las 14:00 haría buscar un choque que no se ve.
    const d = build();
    d.bookingsRepo.findProfessionalCommitmentsOverlapping.mockResolvedValue([
      compromiso(),
    ]);

    await expect(
      d.service.assertRangoLibre(
        {} as any,
        HP,
        new Date('2026-09-03T14:00:00Z'),
        new Date('2026-09-03T15:00:00Z'),
      ),
    ).rejects.toThrow(/Ana Quispe.*10:00.*10:30.*Consultorio Centro/);
  });

  it('sin nombre del paciente el mensaje degrada, no se rompe', async () => {
    const d = build();
    d.bookingsRepo.findProfessionalCommitmentsOverlapping.mockResolvedValue([
      compromiso({ patientProfileId: 'pp-sin-nombre' }),
    ]);
    d.bookingsRepo.findPatientNames.mockResolvedValue(new Map());

    await expect(
      d.service.assertRangoLibre(
        {} as any,
        HP,
        new Date('2026-09-03T14:00:00Z'),
        new Date('2026-09-03T15:00:00Z'),
      ),
    ).rejects.toThrow(/una cita/);
  });

  it('el propio compromiso no choca consigo mismo al reprogramarse', async () => {
    // `excepto` viaja hasta la consulta: sin él, mover una cita chocaría contra
    // su propia versión anterior.
    const d = build();

    await d.service.assertRangoLibre(
      {} as any,
      HP,
      new Date('2026-09-03T14:00:00Z'),
      new Date('2026-09-03T14:30:00Z'),
      'bk-propia',
    );

    const llamada =
      d.bookingsRepo.findProfessionalCommitmentsOverlapping.mock.calls[0];
    expect(llamada[5]).toBe('bk-propia');
  });

  it('solo cuentan confirmada y con paciente adentro, no lo pendiente', async () => {
    // Lo pendiente es una pregunta sin responder: la política de #186 lo
    // desplaza, no lo protege. Contarlo como compromiso bloquearía la agenda
    // con pedidos que quizá nadie acepte.
    const d = build();

    await d.service.compromisos(
      {} as any,
      HP,
      new Date('2026-09-03T14:00:00Z'),
      new Date('2026-09-03T15:00:00Z'),
    );

    const estados =
      d.bookingsRepo.findProfessionalCommitmentsOverlapping.mock.calls[0][4];
    expect(estados).toHaveLength(2);
  });
});
