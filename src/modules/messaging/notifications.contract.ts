/* ============================================================================
    Contrato de emisión in-app · carril P1

    Esto es lo ÚNICO que otro módulo necesita conocer para que un hecho suyo
    —una receta emitida, un cupo liberado, un mensaje nuevo— aparezca en la
    campana. Vive en un archivo aparte, sin dependencias de Nest ni del ORM, a
    propósito: los carriles P2, P7, P8 y P9 lo importan para escribir su
    emisión mientras P1 todavía está construyendo la campana, y un contrato que
    arrastra la implementación no se puede importar antes que ella.

    ## Las tres promesas del contrato

    1. **Emitir nunca rompe el caso de uso que emite.** `emitInApp` no lanza:
       devuelve el resultado, incluida la supresión. Una receta que se guardó no
       puede deshacerse porque la notificación falló.
    2. **La categoría es la unidad de preferencia.** Silenciar «social» silencia
       todo lo social, y nada clínico. Por eso la categoría es un enum cerrado y
       no texto libre: una categoría inventada sería una que nadie puede
       silenciar.
    3. **Toda notificación navega a algo.** El destino viaja como
       `(tipo, id)` y el front lo resuelve a una ruta. Una notificación que no
       lleva a ningún lado es un cartel, no un aviso.
    ========================================================================== */

import { CONCEPTS } from '../../common';

/**
 * Las cuatro familias de aviso del producto.
 *
 * Son cuatro y no una por disparador porque quien configura sus preferencias
 * razona en estos términos —«no me avises de lo social»—, no en «no me avises
 * de reacciones a comentarios en publicaciones de grupos».
 */
export type NotificationCategory =
  /** Receta, encuentro cerrado, resultado disponible. */
  | 'CLINICAL'
  /** Turnos: cupo liberado, demora, recordatorio, cambio de cita. */
  | 'SCHEDULING'
  /** Mensajería directa entre personas. */
  | 'MESSAGES'
  /** Muro, reacciones, comentarios, grupos. */
  | 'SOCIAL';

/** Las cuatro categorías, para iterar sin repetir la lista. */
export const NOTIFICATION_CATEGORIES: readonly NotificationCategory[] = [
  'CLINICAL',
  'SCHEDULING',
  'MESSAGES',
  'SOCIAL',
];

/** Concepto de terminología que respalda cada categoría. */
export const NOTIFICATION_CATEGORY_CONCEPT: Readonly<
  Record<NotificationCategory, string>
> = {
  CLINICAL: CONCEPTS.NOTIF_CATEGORY_CLINICAL,
  SCHEDULING: CONCEPTS.NOTIF_CATEGORY_SCHEDULING,
  MESSAGES: CONCEPTS.NOTIF_CATEGORY_MESSAGES,
  SOCIAL: CONCEPTS.NOTIF_CATEGORY_SOCIAL,
};

/** El camino de vuelta: del concepto al nombre de la categoría. */
export const NOTIFICATION_CATEGORY_BY_CONCEPT: ReadonlyMap<
  string,
  NotificationCategory
> = new Map(
  NOTIFICATION_CATEGORIES.map((category) => [
    NOTIFICATION_CATEGORY_CONCEPT[category],
    category,
  ]),
);

/**
 * Qué clase de cosa abre la notificación.
 *
 * Se guarda en `related_resource_type`, que es `varchar` y aceptaría cualquier
 * cadena; el enum existe para que el front pueda tener un `switch` exhaustivo
 * y no un mapa con rama por defecto que manda a la nada.
 */
export type NotificationDestinationType =
  /** Una receta del expediente. */
  | 'PRESCRIPTION'
  /** Un encuentro/consulta cerrado. */
  | 'ENCOUNTER'
  /** Un hilo de mensajería directa. */
  | 'CONVERSATION'
  /** Un turno de la agenda. */
  | 'APPOINTMENT'
  /** Una publicación del muro. */
  | 'POST'
  /** Un resultado de diagnóstico. */
  | 'DIAGNOSTIC_REPORT'
  /**
   * Un pedido de farmacia del paciente (FAR-E1/E2). Aditivo: en el backend el
   * union es puramente de tipos (se guarda en `related_resource_type`,
   * varchar); el `switch` exhaustivo del front debe sumar su ruta al conectar.
   */
  | 'PHARMACY_ORDER';

/**
 * A dónde lleva la notificación al abrirla.
 *
 * @remarks El front traduce el par a una ruta; el backend no conoce rutas.
 */
export interface NotificationDestination {
  /** Clase de objeto que se abre. */
  readonly type: NotificationDestinationType;
  /** Identificador de ese objeto. */
  readonly id: string;
}

/** Lo que un módulo aporta para que se emita una notificación in-app. */
export interface EmitInAppInput {
  /** Cuenta que la recibe. Sin destinatario interno no hay bandeja. */
  readonly recipientUserId: string;

  /** Familia del aviso, que es lo que la preferencia silencia. */
  readonly category: NotificationCategory;

  /** Título corto: es lo que se lee en el panel de la campana. */
  readonly subject: string;

  /** Cuerpo de una o dos líneas. */
  readonly bodyText?: string;

  /** A dónde navega al abrirla. */
  readonly destination?: NotificationDestination;

  /** Organización en cuyo contexto ocurrió el hecho. */
  readonly tenantId?: string;

  /**
   * Colapsa repeticiones lógicas del mismo aviso.
   *
   * Diez mensajes seguidos en el mismo hilo no son diez campanazos: con la
   * misma clave, mientras la primera siga sin entregarse, la segunda devuelve
   * aquella en vez de crear otra.
   */
  readonly debounceKey?: string;

  /** Datos extra que la pantalla de destino quiera aprovechar. */
  readonly payloadJson?: unknown;

  /**
   * Quién provocó el hecho. Se usa como autor de la fila de auditoría; si no
   * viene, firma la cuenta de servicio.
   */
  readonly actorUserId?: string;
}

/** Qué pasó con la emisión. */
export interface EmitInAppResult {
  /** La solicitud, que existe incluso suprimida: es la evidencia. */
  readonly requestId?: string;

  /** La fila de la bandeja, sólo si efectivamente se entregó. */
  readonly inAppNotificationId?: string;

  /** `true` si la preferencia del destinatario la detuvo. */
  readonly suppressed: boolean;

  /** Por qué se suprimió, en lenguaje llano. */
  readonly suppressionReason?: string;

  /**
   * `true` si emitir falló y se decidió no romper el caso de uso que emitía.
   *
   * Quien emite puede ignorarlo —para eso existe—, pero está en el resultado
   * para que una prueba pueda afirmar que la emisión salió y no que se comió
   * un error en silencio.
   */
  readonly failed?: boolean;
}

/**
 * La interfaz que implementa `NotificationsService`.
 *
 * Se declara acá y no en el servicio para que un módulo pueda depender del
 * contrato en sus pruebas sin instanciar el módulo de mensajería entero.
 */
export interface InAppNotificationEmitter {
  /**
   * Emite una notificación in-app. **No lanza**: informa.
   *
   * @param input - Destinatario, categoría, texto y destino navegable.
   * @returns Qué se creó, o por qué no se creó nada.
   */
  emitInApp(input: EmitInAppInput): Promise<EmitInAppResult>;
}
