import type {
  AgendaNotice,
  AgendaNoticeKind,
  AgendaNoticePort,
  AgendaNoticeResult,
} from '../../src/modules/scheduling/ports/agenda-notice.port';

/**
 * Doble **estricto** de {@link AgendaNoticePort} (carril B, relación
 * `agenda → mensajería`).
 *
 * ## Por qué estricto y no un `jest.fn()`
 *
 * El puerto declara que `emit` **no lanza** y que los fallos vuelven como
 * `{ delivered: false, skippedReason }`. Un doble permisivo que devuelva eso
 * ante una llamada que nadie previó produce un valor **indistinguible** de un
 * fallo operacional legítimo —sin cuenta de portal, preferencia en contra,
 * canal caído—, y la prueba pasa por el motivo equivocado. Es ADV-02.
 *
 * Por eso este doble sólo devuelve **resultados previstos**: cada escenario se
 * registra de antemano con el aviso que espera y el resultado que va a dar.
 *
 * ## La regla de fallo del harness, que es lo que lo hace honesto
 *
 * Una llamada no registrada es un **error del harness**, no un resultado. El
 * doble hace dos cosas, y las dos hacen falta:
 *
 * 1. **Lanza** {@link UnexpectedAgendaNoticeCall} en el punto de la llamada, y
 * 2. **anota el fallo** en una lista no consumida que {@link assertClean}
 *    revisa al cerrar.
 *
 * La segunda existe porque los cuatro consumidores del puerto emiten dentro de
 * código que **atrapa** —a propósito: un aviso roto no puede tumbar la agenda—,
 * así que una excepción a secas se la come la aplicación y el test termina en
 * verde. Con `assertClean()` en el `afterEach`, el cierre falla igual.
 *
 * **Kill-test:** «¿qué pasa si el código de aplicación atrapa la excepción de
 * una llamada no registrada?» → el test falla igual, en el cierre.
 */

/** Los cuatro `kind` del puerto, para validar la forma de lo que entra. */
const KINDS: readonly AgendaNoticeKind[] = [
  'SLOT_RELEASED',
  'PRACTITIONER_DELAY',
  'APPOINTMENT_REMINDER',
  'BOOKING_STATE_CHANGED',
];

/**
 * Los `kind` que el adaptador real manda además al chat de `SupportAdmin`.
 *
 * Espeja `MessagingAgendaNoticeAdapter.KINDS_CON_CHAT`, que es `private`. Si
 * esa lista cambia en el adaptador y acá no, el escenario 4 del catálogo lo
 * delata: un resultado con `chatDelivered` en un `kind` sin chat es rechazado.
 */
const KINDS_CON_CHAT: ReadonlySet<AgendaNoticeKind> = new Set([
  'BOOKING_STATE_CHANGED',
]);

/** Los 8 campos que el puerto declara. Un noveno es un contrato distinto. */
const CAMPOS_DEL_RESULTADO: readonly string[] = [
  'delivered',
  'inAppNotificationId',
  'notificationRequestId',
  'skippedReason',
  'emailRequestId',
  'emailSkippedReason',
  'chatDelivered',
  'chatSkippedReason',
];

/** Se lanza cuando al doble le piden algo que nadie registró. */
export class UnexpectedAgendaNoticeCall extends Error {
  constructor(motivo: string) {
    super(`Llamada no prevista al doble de AgendaNoticePort: ${motivo}`);
    this.name = 'UnexpectedAgendaNoticeCall';
  }
}

/** Un escenario registrado: qué avisos acepta y qué devuelve ante ellos. */
export interface EscenarioDeAviso {
  /** Nombre para que el fallo diga cuál escenario no casó. */
  readonly nombre: string;
  /** Condición sobre el aviso entrante. */
  readonly cuando: (notice: AgendaNotice) => boolean;
  /** El resultado previsto; se valida contra los 8 campos antes de devolverlo. */
  readonly entonces: AgendaNoticeResult;
  /** Cuántas veces puede usarse. `undefined` = sin tope. */
  readonly veces?: number;
}

/** Una llamada registrada, con su marca lógica. */
export interface LlamadaRegistrada {
  /** Contador monótono: no es reloj de pared, para que el orden sea reproducible. */
  readonly secuencia: number;
  readonly notice: AgendaNotice;
  readonly escenario: string;
}

export class StrictAgendaNoticePortDouble implements AgendaNoticePort {
  private readonly escenarios: EscenarioDeAviso[] = [];
  private readonly usos = new Map<string, number>();
  private readonly llamadas: LlamadaRegistrada[] = [];
  private readonly fallosNoConsumidos: string[] = [];
  private secuencia = 0;

  /** Registra un escenario. Sin escenarios, toda llamada es no prevista. */
  registrar(escenario: EscenarioDeAviso): this {
    this.escenarios.push(escenario);
    return this;
  }

  /** Lo que el doble recibió, en orden. */
  get registradas(): readonly LlamadaRegistrada[] {
    return this.llamadas;
  }

  /** Los fallos del harness que nadie vio porque la aplicación los atrapó. */
  get fallosPendientes(): readonly string[] {
    return this.fallosNoConsumidos;
  }

  /** Deja el doble como recién creado. Va en el `afterEach` (caso 7). */
  reset(): void {
    this.escenarios.length = 0;
    this.llamadas.length = 0;
    this.fallosNoConsumidos.length = 0;
    this.usos.clear();
    this.secuencia = 0;
  }

  /**
   * Falla la prueba si quedó algún fallo del harness sin consumir.
   *
   * **Ésta es la mitad que la aplicación no puede tapar.** Va en el `afterEach`
   * y corre aunque el código bajo prueba haya atrapado la excepción.
   */
  assertClean(): void {
    if (this.fallosNoConsumidos.length === 0) return;
    const detalle = this.fallosNoConsumidos.join('\n  - ');
    this.fallosNoConsumidos.length = 0;
    throw new Error(
      'El doble de AgendaNoticePort registró fallos del harness que la ' +
        'aplicación atrapó y nadie vio:\n  - ' +
        detalle,
    );
  }

  async emit(notice: AgendaNotice): Promise<AgendaNoticeResult> {
    const problemaDeForma = this.validarForma(notice);
    if (problemaDeForma !== null) {
      return this.rechazar(problemaDeForma);
    }

    const escenario = this.escenarios.find((e) => {
      if (!e.cuando(notice)) return false;
      if (e.veces === undefined) return true;
      return (this.usos.get(e.nombre) ?? 0) < e.veces;
    });

    if (escenario === undefined) {
      return this.rechazar(
        `ningún escenario registrado acepta un aviso ${notice.kind} para ` +
          `${notice.relatedResourceType}/${notice.relatedResourceId ?? '<sin id>'}`,
      );
    }

    const problemaDeResultado = this.validarResultado(notice, escenario);
    if (problemaDeResultado !== null) {
      return this.rechazar(problemaDeResultado);
    }

    this.usos.set(escenario.nombre, (this.usos.get(escenario.nombre) ?? 0) + 1);
    this.secuencia += 1;
    this.llamadas.push({
      secuencia: this.secuencia,
      notice,
      escenario: escenario.nombre,
    });
    return escenario.entonces;
  }

  /** Emite un lote, en serie, igual que el adaptador real. */
  async emitMany(
    notices: readonly AgendaNotice[],
  ): Promise<AgendaNoticeResult[]> {
    const resultados: AgendaNoticeResult[] = [];
    for (const notice of notices) {
      resultados.push(await this.emit(notice));
    }
    return resultados;
  }

  /**
   * Anota el fallo **y** lanza.
   *
   * Nunca devuelve `{ delivered: false }`: ése es el resultado de un fallo
   * operacional legítimo y confundirlos es exactamente lo que este doble
   * existe para impedir.
   */
  private rechazar(motivo: string): never {
    this.fallosNoConsumidos.push(motivo);
    throw new UnexpectedAgendaNoticeCall(motivo);
  }

  /** Forma del aviso entrante, según lo que el puerto declara. */
  private validarForma(notice: AgendaNotice): string | null {
    if (!KINDS.includes(notice.kind)) {
      return `kind desconocido: ${String(notice.kind)}`;
    }
    if (notice.subject.trim() === '') return 'subject vacío';
    if (notice.bodyText.trim() === '') return 'bodyText vacío';
    if (notice.relatedResourceType.trim() === '') {
      return 'relatedResourceType vacío';
    }
    const { patientProfileId, userId } = notice.recipient;
    const destinatarios = [patientProfileId, userId].filter(
      (v) => v !== undefined,
    ).length;
    if (destinatarios !== 1) {
      return (
        'el puerto exige exactamente un destinatario ' +
        `(patientProfileId | userId); vinieron ${destinatarios}`
      );
    }
    return null;
  }

  /** El resultado previsto tiene que ser un resultado que el puerto admita. */
  private validarResultado(
    notice: AgendaNotice,
    escenario: EscenarioDeAviso,
  ): string | null {
    const ajenos = Object.keys(escenario.entonces).filter(
      (k) => !CAMPOS_DEL_RESULTADO.includes(k),
    );
    if (ajenos.length > 0) {
      return (
        `el escenario "${escenario.nombre}" declara campos que el puerto no ` +
        `tiene: ${ajenos.join(', ')}`
      );
    }
    if (typeof escenario.entonces.delivered !== 'boolean') {
      return `el escenario "${escenario.nombre}" no declara delivered:boolean`;
    }
    if (!KINDS_CON_CHAT.has(notice.kind)) {
      const chateaDeMas =
        escenario.entonces.chatDelivered !== undefined ||
        escenario.entonces.chatSkippedReason !== undefined;
      if (chateaDeMas) {
        return (
          `el escenario "${escenario.nombre}" devuelve chatDelivered para ` +
          `${notice.kind}, que el adaptador real no manda por chat`
        );
      }
    }
    return null;
  }
}
