import type {
  AgendaNotice,
  AgendaNoticePort,
  AgendaNoticeResult,
} from '../../src/modules/scheduling/ports/agenda-notice.port';

/**
 * Prueba de la corrección de H4: un adaptador que depende **sólo del puerto**.
 *
 * ## Qué demuestra
 *
 * La prueba de ausencia de Itzan dejó tres dependencias residuales de
 * `scheduling`, y las dos primeras entran por el mismo lugar:
 *
 * - `messaging`, vía `MessagingAgendaNoticeAdapter` →
 *   `import { NotificationsService } from '../../messaging/services'`
 *   (`adapters/messaging-agenda-notice.adapter.ts:6`)
 * - `community`, vía `SupportAdminNoticeAdapter` →
 *   `import … from '../../community/services'`
 *   (`adapters/support-admin-notice.adapter.ts:9-10`)
 *
 * El acoplamiento **no es del puerto**: es de los adaptadores concretos, que
 * importan los servicios de los vecinos. Este archivo lo prueba por
 * construcción: implementa el mismo `AgendaNoticePort` sin importar **nada**
 * de `messaging` ni de `community` — su única dependencia es un `Emisor`
 * inyectado, que es una función.
 *
 * Cambiar el binding de `AGENDA_NOTICE_PORT` a un adaptador de esta forma es
 * la corrección mínima que saca a `messaging` y `community` del grafo de
 * `scheduling`. **Acá no se aplica ese cambio**: `scheduling.module.ts` es
 * archivo reservado de Itzan, y qué debe hacer el emisor real ante un fallo
 * depende de `Q-06`, que es decisión de negocio. Lo que este archivo entrega
 * es la prueba de que la corrección funciona y de qué forma tiene.
 *
 * ## Qué NO demuestra
 *
 * Que la entrega real de avisos siga funcionando: eso exige el emisor de
 * verdad (el de P1, cuando exista) y el arranque de la app. Este adaptador
 * es un doble declarado, no un reemplazo de producción.
 */

/**
 * Lo único que este adaptador necesita del mundo exterior.
 *
 * Nótese que no es `NotificationsService` ni ningún tipo de `messaging`: es
 * una función. Cualquier implementación —la de P1, la de mensajería actual
 * envuelta, o un doble de prueba— la satisface sin arrastrar su módulo.
 */
export type Emisor = (notice: AgendaNotice) => Promise<{
  /** Si llegó a la bandeja. */
  readonly entregado: boolean;
  /** Identificador de la fila creada, cuando hubo. */
  readonly id?: string;
  /** Por qué no se entregó, cuando no. */
  readonly motivo?: string;
}>;

/** Los cuatro valores que el puerto declara. No hay un quinto. */
const KINDS_DEL_CONTRATO = new Set([
  'SLOT_RELEASED',
  'PRACTITIONER_DELAY',
  'APPOINTMENT_REMINDER',
  'BOOKING_STATE_CHANGED',
]);

/**
 * Adaptador de avisos de agenda que no conoce a `messaging` ni a `community`.
 *
 * Respeta las dos promesas duras del puerto:
 * 1. **`emit` nunca lanza** — cualquier fallo, incluido el del emisor
 *    inyectado, vuelve como `{ delivered: false, skippedReason }`.
 * 2. **Un aviso que falla no cancela el lote** en `emitMany`.
 */
export class PortOnlyNoticeAdapter implements AgendaNoticePort {
  constructor(private readonly emisor: Emisor) {}

  async emit(notice: AgendaNotice): Promise<AgendaNoticeResult> {
    // La regla «uno de los dos, no los dos» vive en un comentario del puerto,
    // no en el tipo. Acá se comprueba en runtime, que es donde el contrato
    // puede hacerse cumplir de verdad — pero sin lanzar, porque el puerto
    // promete que `emit` no lanza.
    const destinatarios = [
      notice.recipient?.patientProfileId,
      notice.recipient?.userId,
    ].filter(Boolean);
    if (destinatarios.length !== 1) {
      return {
        delivered: false,
        skippedReason:
          destinatarios.length === 0
            ? 'recipient_sin_destinatario'
            : 'recipient_ambiguo',
      };
    }
    if (!KINDS_DEL_CONTRATO.has(notice.kind)) {
      return { delivered: false, skippedReason: 'kind_fuera_del_contrato' };
    }

    try {
      const salida = await this.emisor(notice);
      return salida.entregado
        ? { delivered: true, notificationRequestId: salida.id }
        : {
            delivered: false,
            notificationRequestId: salida.id,
            skippedReason: salida.motivo ?? 'emisor_no_entrego',
          };
    } catch {
      // Emitir no puede romper la agenda: el fallo del emisor se traga acá y
      // vuelve como resultado, nunca como excepción.
      return { delivered: false, skippedReason: 'emisor_fallo' };
    }
  }

  async emitMany(
    notices: readonly AgendaNotice[],
  ): Promise<AgendaNoticeResult[]> {
    const resultados: AgendaNoticeResult[] = [];
    for (const notice of notices) {
      resultados.push(await this.emit(notice));
    }
    return resultados;
  }
}
