import { jest } from '@jest/globals';

import { CommunityChatAutoReplyService } from './community-chat-auto-reply.service';
import { ChatAutoReplies, ConversationParticipants } from '../entities';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * Lo que estas pruebas fijan.
 *
 * **La regla entera**, que son cuatro condiciones y sólo tiene sentido probarlas
 * juntas: encendida, ausencia suficiente, descanso cumplido y fuera de la franja
 * horaria. Cada una por separado pasaría con una implementación que ignorara las
 * otras tres.
 *
 * Y las dos decisiones que se toman acá y no en el cliente: que **sin ninguna
 * lectura registrada no se supone ausencia** —una cuenta nueva no tiene
 * historial, y contestarle sola sería contestar por alguien que quizá está
 * mirando la pantalla— y que **la marca del descanso se pone en la misma
 * transacción**, para que un envío fallido no deje la conversación en silencio
 * hasta la próxima ventana.
 */
describe('CommunityChatAutoReplyService', () => {
  const DESTINATARIO = 'p-ausente';
  const CONVERSACION = 'conv-1';

  /** Una configuración encendida, con lo demás por defecto. */
  const config = (extra: Partial<ChatAutoReplies> = {}): ChatAutoReplies =>
    ({
      id: 'ar-1',
      publicProfileId: DESTINATARIO,
      isActive: true,
      inactivityMinutes: 30,
      bodyText: 'Vuelvo a las 18.',
      cooldownHours: 4,
      onlyOutsideBusinessHours: false,
      ...extra,
    }) as ChatAutoReplies;

  /** La participación del destinatario en la conversación donde llegó. */
  const participacion = (
    extra: Partial<ConversationParticipants> = {},
  ): ConversationParticipants =>
    ({
      id: 'part-1',
      conversationId: CONVERSACION,
      participantProfileId: DESTINATARIO,
      ...extra,
    }) as ConversationParticipants;

  /**
   * Arma el servicio con un `findOne` que responde según la entidad pedida.
   *
   * @param opciones.config - La configuración del destinatario, o `null`.
   * @param opciones.participacion - Su fila en esta conversación, o `null`.
   * @param opciones.ultimaActividad - Su participación más reciente, que es lo
   *   que mide la ausencia. `null` = nunca leyó nada.
   */
  const build = (opciones: {
    config?: ChatAutoReplies | null;
    participacion?: ConversationParticipants | null;
    /** Hace cuántos minutos leyó algo. `null` = nunca leyó nada. */
    ausenciaMinutos?: number | null;
    /** Hace cuántas horas se le avisó en ESTA conversación. */
    avisoHaceHoras?: number;
  }) => {
    // El instante que se está evaluando. Lo fija `responder()` antes de llamar,
    // y de él cuelgan la ausencia y el descanso.
    //
    // No se usa `Date.now()` para armarlos: las pruebas de franja horaria
    // evalúan una hora fija del día —«hoy a las 21:00»—, y con la actividad
    // anclada al reloj real el resultado dependía de a qué hora se corriera la
    // suite. Corrida a las 22:36, «hoy a las 21:00» caía ANTES de una actividad
    // de «hace dos horas» y la resta daba negativo: no había ausencia, y el
    // rojo culpaba a la franja horaria.
    let ahora = new Date();

    const filaConversacion =
      opciones.participacion === undefined
        ? participacion()
        : opciones.participacion;

    const em = {
      findOne: mockFn().mockImplementation(
        (entidad: unknown, _where: unknown, opts?: { orderBy?: unknown }) => {
          if (entidad === ChatAutoReplies) {
            return Promise.resolve(
              opciones.config === undefined ? config() : opciones.config,
            );
          }
          // La consulta ordenada es la de «última actividad»; la otra es la
          // participación en esta conversación.
          if (opts?.orderBy) {
            const minutos = opciones.ausenciaMinutos ?? 120;
            return Promise.resolve(
              opciones.ausenciaMinutos === null
                ? null
                : participacion({
                    updatedAt: new Date(ahora.getTime() - minutos * 60_000),
                  }),
            );
          }
          if (opciones.avisoHaceHoras !== undefined && filaConversacion) {
            filaConversacion.lastAutoReplyAt = new Date(
              ahora.getTime() - opciones.avisoHaceHoras * 3_600_000,
            );
          }
          return Promise.resolve(filaConversacion);
        },
      ),
    };
    const service = new CommunityChatAutoReplyService(em as never, {} as never);
    return {
      service,
      em,
      filaConversacion,
      fijarAhora: (cuando: Date) => {
        ahora = cuando;
      },
    };
  };

  const responder = (d: ReturnType<typeof build>, ahora = new Date()) => {
    d.fijarAhora(ahora);
    return d.service.textoParaResponder(
      d.em as never,
      CONVERSACION,
      DESTINATARIO,
      ahora,
    );
  };

  it('contesta cuando se cumplen las cuatro condiciones', async () => {
    const d = build({});
    await expect(responder(d)).resolves.toBe('Vuelvo a las 18.');
  });

  it('no contesta si está apagada', async () => {
    const d = build({ config: config({ isActive: false }) });
    await expect(responder(d)).resolves.toBeNull();
  });

  it('no contesta si el perfil nunca la configuró', async () => {
    const d = build({ config: null });
    await expect(responder(d)).resolves.toBeNull();
  });

  it('no contesta si el destinatario estuvo activo hace un rato', async () => {
    // Leyó hace diez minutos y pidió contestar a los treinta: está mirando.
    const d = build({ ausenciaMinutos: 10 });
    await expect(responder(d)).resolves.toBeNull();
  });

  it('sin ninguna lectura registrada no supone ausencia', async () => {
    const d = build({ ausenciaMinutos: null });
    await expect(responder(d)).resolves.toBeNull();
  });

  it('no repite el aviso dentro del descanso configurado', async () => {
    const d = build({ avisoHaceHoras: 1 });
    await expect(responder(d)).resolves.toBeNull();
  });

  it('vuelve a avisar pasado el descanso', async () => {
    const d = build({ avisoHaceHoras: 5 });
    await expect(responder(d)).resolves.toBe('Vuelvo a las 18.');
  });

  it('con franja horaria no contesta dentro del horario de atención', async () => {
    const d = build({
      config: config({
        onlyOutsideBusinessHours: true,
        businessHoursFrom: '08:00',
        businessHoursTo: '18:00',
      }),
    });
    const alMediodia = new Date();
    alMediodia.setHours(12, 0, 0, 0);
    await expect(responder(d, alMediodia)).resolves.toBeNull();
  });

  it('con franja horaria sí contesta fuera del horario', async () => {
    const d = build({
      config: config({
        onlyOutsideBusinessHours: true,
        businessHoursFrom: '08:00',
        businessHoursTo: '18:00',
      }),
    });
    const aLaNoche = new Date();
    aLaNoche.setHours(21, 0, 0, 0);
    await expect(responder(d, aLaNoche)).resolves.toBe('Vuelvo a las 18.');
  });

  it('una franja que cruza la medianoche es la de quien atiende de noche', async () => {
    // Un doble por evaluación, y no uno compartido: la primera llamada anota el
    // descanso, así que reusarlo mediría el cooldown en vez de la franja.
    const franjaNocturna = () =>
      build({
        config: config({
          onlyOutsideBusinessHours: true,
          businessHoursFrom: '22:00',
          businessHoursTo: '06:00',
        }),
      });

    const aLasTres = new Date();
    aLasTres.setHours(3, 0, 0, 0);
    // Dentro de la franja 22→06, del otro lado de la medianoche: no contesta.
    await expect(responder(franjaNocturna(), aLasTres)).resolves.toBeNull();

    const alMediodia = new Date();
    alMediodia.setHours(12, 0, 0, 0);
    await expect(responder(franjaNocturna(), alMediodia)).resolves.toBe(
      'Vuelvo a las 18.',
    );
  });

  it('anota el aviso en la misma transacción, no después', async () => {
    // Si el envío falla, la marca se revierte con la transacción y el próximo
    // mensaje vuelve a intentarlo, en vez de dejar la conversación muda.
    const d = build({});
    const ahora = new Date();

    await responder(d, ahora);

    expect(d.filaConversacion?.lastAutoReplyAt).toBe(ahora);
  });

  it('no anota nada cuando decide no contestar', async () => {
    const d = build({ config: config({ isActive: false }) });

    await responder(d);

    expect(d.filaConversacion?.lastAutoReplyAt).toBeUndefined();
  });

  it('no contesta si el destinatario ya no participa de la conversación', async () => {
    const d = build({ participacion: null });
    await expect(responder(d)).resolves.toBeNull();
  });
});
