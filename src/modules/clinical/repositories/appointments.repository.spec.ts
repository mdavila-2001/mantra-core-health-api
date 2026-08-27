import { AppointmentsRepository } from './appointments.repository';
import { Appointments } from '../entities';

/**
 * El repositorio de citas clínicas — que lo que se le pasa, llegue.
 *
 * ## Por qué existe este archivo
 *
 * `create()` **no reenvía el objeto que recibe**: arma uno nuevo campo por
 * campo, así que cualquier dato que el llamador agregue y este método no
 * nombre **se descarta en silencio**. No falla, no avisa: la fila se escribe
 * sin él.
 *
 * Costó una verificación descubrirlo. Al sumar el canal de la atención
 * (teleconsulta), el spec del servicio pasaba —asevera sobre el mock del
 * repositorio, y el mock recibía el campo— pero la columna quedaba en NULL
 * contra la base viva. La prueba miraba el borde equivocado.
 *
 * Así que acá se prueba el borde que faltaba: que cada campo del contrato
 * sobrevive el traspaso. Es la clase de prueba que sólo vale si se agrega una
 * línea por cada campo nuevo — y por eso el fallo dice qué se perdió.
 */
describe('AppointmentsRepository', () => {
  /** Un `EntityManager` que sólo recuerda con qué lo llamaron. */
  function emQueRecuerda() {
    const llamadas: Record<string, unknown>[] = [];
    return {
      llamadas,
      em: {
        create: (_entidad: unknown, datos: Record<string, unknown>) => {
          llamadas.push(datos);
          return datos;
        },
      } as never,
    };
  }

  const base = {
    patientProfileId: 'pp-1',
    tenantId: 'ten-1',
    statusConceptId: 'appt-booked',
    startAt: new Date('2026-09-10T14:00:00Z'),
  };

  it('el canal de la atención llega a la fila', () => {
    // El que se perdía: el servicio lo mandaba y la columna quedaba NULL.
    const { em, llamadas } = emQueRecuerda();

    new AppointmentsRepository().create(em, {
      ...base,
      channelConceptId: 'concepto-teleconsulta',
    });

    expect(llamadas[0]['channelConceptId']).toBe('concepto-teleconsulta');
  });

  it('sin canal la columna queda sin valor: ausente no es presencial explícito', () => {
    const { em, llamadas } = emQueRecuerda();

    new AppointmentsRepository().create(em, base);

    expect(llamadas[0]['channelConceptId']).toBeUndefined();
  });

  it('ningún campo del contrato se pierde en el traspaso', () => {
    // La red que atrapa al PRÓXIMO campo que alguien agregue al contrato y
    // olvide nombrar en `create()`. Si esta prueba falla, el mensaje dice cuál.
    const { em, llamadas } = emQueRecuerda();
    const entrada = {
      ...base,
      practitionerProfileId: 'hp-1',
      endAt: new Date('2026-09-10T17:00:00Z'),
      reasonText: 'Cirugía de implante',
      channelConceptId: 'concepto-domicilio',
    };

    new AppointmentsRepository().create(em, entrada);

    const fila = llamadas[0];
    // `actorUserId` se traduce a dos columnas de auditoría y por eso se
    // comprueba aparte, no por su propio nombre.
    for (const [campo, valor] of Object.entries(entrada)) {
      expect({ campo, valor: fila[campo] }).toEqual({ campo, valor });
    }
  });

  it('el actor queda como autor y como último editor', () => {
    const { em, llamadas } = emQueRecuerda();

    new AppointmentsRepository().create(em, { ...base, actorUserId: 'user-9' });

    expect(llamadas[0]['createdByUserId']).toBe('user-9');
    expect(llamadas[0]['updatedByUserId']).toBe('user-9');
  });

  it('crea la entidad de citas y no otra', () => {
    const llamadas: unknown[] = [];
    const em = {
      create: (entidad: unknown, datos: unknown) => {
        llamadas.push(entidad);
        return datos;
      },
    } as never;

    new AppointmentsRepository().create(em, base);

    expect(llamadas[0]).toBe(Appointments);
  });
});
