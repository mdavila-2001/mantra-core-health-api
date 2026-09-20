import { randomUUID } from 'node:crypto';
import { AgendaNoticeCapabilityLab } from '../lab/agenda-notice-capability.lab';
import type {
  AgendaNotice,
  AgendaNoticeKind,
} from '../../src/modules/scheduling/ports/agenda-notice.port';

/**
 * H6 (carril de Pablo) · regresión del área de avisos de agenda, ejercitada
 * contra el **contrato** en sus tres niveles, independiente del arranque de
 * la app.
 *
 * ## Por qué existe esta suite y no se usa la regresión de integración
 *
 * La regresión que cubre este camino (`fx1`/`fx2`/`fx3`/`fx8`/`fx9`) no se
 * puede correr: `bootstrapTestApp()` aborta con
 * `MetadataError: Metadata for entity X not found` — un defecto sistémico del
 * descubrimiento de entidades de MikroORM, ajeno a P8, reproducible también
 * en `dev`, con cuatro hipótesis probadas y descartadas (ver el `ACTIONLOG.md`
 * del carril, §3).
 *
 * La regla 65 del estándar es explícita: un bloqueo ajeno **no** cierra una
 * microtarea como `BLOQUEADO` mientras el contrato de lo que falta se pueda
 * escribir. Acá se puede: el contrato es `AgendaNoticePort`. Así que el área
 * se reverifica contra ese contrato, en sus tres niveles, sin depender del
 * `AppModule`.
 *
 * ## Qué prueba y qué NO prueba
 *
 * Prueba las **promesas observables del puerto** contra Postgres real:
 * que `emit` nunca lance, que un lote siga después de un elemento que falla,
 * que la forma del resultado sea la declarada, y que las violaciones de las
 * reglas que el compilador NO impone queden registradas en vez de pasar
 * desapercibidas.
 *
 * **NO** prueba la implementación real (`MessagingAgendaNoticeAdapter`): eso
 * exige el arranque de la app y sigue pendiente. Tampoco decide la semántica
 * en disputa (`Q-06` durabilidad, `debounceKey` sin ventana definida): esas
 * son de Ender y de negocio, y acá sólo se documenta qué hace hoy el doble.
 */
describe('H6 · regresión del contrato de avisos de agenda (tres niveles)', () => {
  const runId = `h6-contrato-${randomUUID()}`;
  /** Los cuatro valores que el puerto declara. No hay un quinto. */
  const LOS_CUATRO_KINDS: readonly AgendaNoticeKind[] = [
    'SLOT_RELEASED',
    'PRACTITIONER_DELAY',
    'APPOINTMENT_REMINDER',
    'BOOKING_STATE_CHANGED',
  ];

  let lab: AgendaNoticeCapabilityLab;

  const base: Omit<AgendaNotice, 'kind' | 'recipient'> = {
    subject: 'Aviso de regresión de contrato',
    bodyText: 'cuerpo determinista',
    relatedResourceType: 'scheduling.bookings',
    relatedResourceId: '00000000-0000-0000-0000-0000000000b1',
  };
  const soloPaciente = {
    patientProfileId: '00000000-0000-0000-0000-000000000001',
  };

  beforeAll(async () => {
    lab = await AgendaNoticeCapabilityLab.start({
      runId,
      // Los cuatro del contrato: cualquier otro es una violación registrada.
      registeredKinds: LOS_CUATRO_KINDS,
      clock: () => new Date('2026-09-20T00:00:00.000Z'),
    });
  });

  afterEach(async () => {
    await lab.reset();
  });

  afterAll(async () => {
    await lab.reset();
    await lab.disconnect();
  });

  // ------------------------------------------------------------- 1. ACEPTADO
  describe('nivel ACEPTADO — lo que el contrato promete que funciona', () => {
    it.each(LOS_CUATRO_KINDS)(
      'emite %s y devuelve la forma declarada del resultado',
      async (kind) => {
        const resultado = await lab.emit({
          ...base,
          kind,
          recipient: soloPaciente,
        });

        expect(resultado.delivered).toBe(true);
        expect(resultado.notificationRequestId).toEqual(expect.any(String));
        expect(resultado.inAppNotificationId).toEqual(expect.any(String));

        const filas = await lab.listRequests();
        expect(filas).toHaveLength(1);
        expect(filas[0]).toMatchObject({ kind, registered: true });
      },
    );

    it('emitMany procesa el lote completo y conserva el orden de llegada', async () => {
      const resultados = await lab.emitMany(
        LOS_CUATRO_KINDS.map((kind) => ({
          ...base,
          kind,
          recipient: soloPaciente,
        })),
      );

      expect(resultados).toHaveLength(4);
      expect(resultados.every((r) => r.delivered)).toBe(true);

      const filas = await lab.listRequests();
      expect(filas.map((f) => f.kind)).toEqual([...LOS_CUATRO_KINDS]);
    });
  });

  // --------------------------------------------------------------- 2. LÍMITE
  describe('nivel LÍMITE — los bordes que el contrato deja abiertos', () => {
    it('acepta el destinatario por cuenta (userId) igual que por perfil', async () => {
      const resultado = await lab.emit({
        ...base,
        kind: 'PRACTITIONER_DELAY',
        recipient: { userId: '00000000-0000-0000-0000-0000000000u1' },
      });

      expect(resultado.delivered).toBe(true);
      const [fila] = await lab.listRequests();
      expect(fila.recipient).toEqual({
        userId: '00000000-0000-0000-0000-0000000000u1',
      });
    });

    it('acepta un aviso sin tenantId — el contrato lo declara opcional (hallazgo SEC-PORT-1 de Ender)', async () => {
      // `tenantId` es opcional en un puerto cuya bandeja separa por
      // organización. No se corrige acá: se fija el comportamiento de hoy
      // para que un cambio futuro se note.
      const resultado = await lab.emit({
        ...base,
        kind: 'SLOT_RELEASED',
        recipient: soloPaciente,
      });
      expect(resultado.delivered).toBe(true);
    });

    it('un lote vacío no rompe y no registra nada', async () => {
      const resultados = await lab.emitMany([]);
      expect(resultados).toEqual([]);
      expect(await lab.listRequests()).toHaveLength(0);
    });

    it('dos avisos con la misma debounceKey se registran los dos: el puerto no define ventana', async () => {
      // El comentario del puerto dice «no se duplican mientras el primero siga
      // vivo», pero NO define qué es «vivo». El doble no inventa una ventana:
      // registra ambos y deja el hecho visible. Es la contraparte del hallazgo
      // HALL-03 de Justin, medido allá contra la implementación real.
      const aviso = {
        ...base,
        kind: 'APPOINTMENT_REMINDER' as const,
        recipient: soloPaciente,
        debounceKey: 'misma-clave',
      };
      await lab.emit(aviso);
      await lab.emit(aviso);

      const filas = await lab.listRequests();
      expect(filas).toHaveLength(2);
      expect(filas.every((f) => f.debounceKey === 'misma-clave')).toBe(true);
    });
  });

  // -------------------------------------------------------------- 3. INVÁLIDO
  describe('nivel INVÁLIDO — lo que el contrato NO impone y hay que ver igual', () => {
    it('un recipient con CERO campos no lanza, pero queda registrado', async () => {
      // La regla «uno de los dos, no los dos» vive en un comentario, no en el
      // tipo: ambos campos son opcionales. El contrato promete que `emit`
      // nunca lanza, así que la violación no puede detectarse lanzando.
      let excepcion: unknown = null;
      let resultado;
      try {
        resultado = await lab.emit({
          ...base,
          kind: 'SLOT_RELEASED',
          recipient: {},
        });
      } catch (err) {
        excepcion = err;
      }

      expect(excepcion).toBeNull();
      expect(resultado).toBeDefined();
      const [fila] = await lab.listRequests();
      expect(fila.recipient).toEqual({});
    });

    it('un recipient con LOS DOS campos no lanza, pero queda registrado', async () => {
      let excepcion: unknown = null;
      try {
        await lab.emit({
          ...base,
          kind: 'SLOT_RELEASED',
          recipient: {
            patientProfileId: '00000000-0000-0000-0000-000000000001',
            userId: '00000000-0000-0000-0000-0000000000u1',
          },
        });
      } catch (err) {
        excepcion = err;
      }

      expect(excepcion).toBeNull();
      const [fila] = await lab.listRequests();
      expect(Object.keys(fila.recipient ?? {}).sort()).toEqual([
        'patientProfileId',
        'userId',
      ]);
    });

    it('un kind fuera de los cuatro no lanza en la llamada, pero hace fallar el cierre', async () => {
      let excepcion: unknown = null;
      try {
        await lab.emit({
          ...base,
          // Fuera del contrato a propósito: el tipo lo impide, el runtime no.
          kind: 'UN_KIND_QUE_NO_EXISTE' as AgendaNoticeKind,
          recipient: soloPaciente,
        });
      } catch (err) {
        excepcion = err;
      }

      expect(excepcion).toBeNull();
      await expect(lab.close()).rejects.toThrow(/no registrada/i);
    });

    it('un lote con un elemento inválido no cancela los demás', async () => {
      const resultados = await lab.emitMany([
        { ...base, kind: 'SLOT_RELEASED', recipient: soloPaciente },
        {
          ...base,
          kind: 'OTRO_KIND_INVALIDO' as AgendaNoticeKind,
          recipient: soloPaciente,
        },
        { ...base, kind: 'PRACTITIONER_DELAY', recipient: soloPaciente },
      ]);

      // La promesa del contrato: «un aviso que falla no cancela los demás».
      expect(resultados).toHaveLength(3);
      expect(await lab.listRequests()).toHaveLength(3);

      // El inválido queda marcado, no disfrazado de éxito.
      const filas = await lab.listRequests();
      expect(filas.map((f) => f.registered)).toEqual([true, false, true]);

      await expect(lab.close()).rejects.toThrow(/no registrada/i);
    });
  });
});
