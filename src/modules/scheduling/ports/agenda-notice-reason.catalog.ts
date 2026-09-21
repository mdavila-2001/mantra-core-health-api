/**
 * Catálogo de razones de no-entrega de `AgendaNoticePort`.
 *
 * ## Por qué existe
 *
 * El contrato `AgendaNoticePort v1.0.0` declara `skippedReason` como `string?`
 * y su propia ficha lo dice sin rodeos: es **texto libre, no un código
 * estable**, así que compararlo por contenido es frágil. La consecuencia no es
 * estética: hoy «falló la base, reintentá» y «este destinatario no tiene
 * cuenta, no insistas» vuelven por el mismo campo y con la misma forma. Nadie
 * —ni una persona leyendo un log ni un `if`— puede distinguirlas.
 *
 * Este catálogo **no cambia lo que el puerto devuelve**. Traduce lo que ya
 * devuelve a un código estable y a una clase, que es la única pregunta que un
 * consumidor necesita contestar: ¿esto se reintenta o no?
 *
 * ## La convención no se inventa acá
 *
 * `skippedReason` ya se usa como código estable en otros dos módulos del
 * repositorio: `AGENT_NOT_ACTIVE` en `context-collection.service.ts`, y
 * `SUITE_NOT_ACTIVE` / `NO_ACTIVE_CASES` en `qa-catalog.service.ts`. Los
 * puertos de avisos son la excepción, no la regla, y por eso los códigos van
 * en inglés y en mayúsculas: es lo que el repositorio ya hace.
 *
 * ## Lo que este catálogo NO decide
 *
 * `EMIT_FAILED` se clasifica como reintentable **a falta de información**, no
 * porque se sepa que lo es: el adaptador captura cualquier excepción en un solo
 * `catch`, y ahí caen por igual una base caída (transitoria) y un `channelId`
 * que no existe (permanente). Separarlas exige decidir Q-06 y distinguir el
 * error en origen. Hasta entonces, reintentar un fallo permanente cuesta un
 * intento y perder uno transitorio cuesta el aviso.
 */

/**
 * Qué debería hacer quien recibe la razón.
 *
 * - `retryable`: no salió por algo que puede no pasar la próxima vez.
 * - `terminal`: no salió por una condición del destinatario o de su
 *   preferencia. Reintentar no cambia nada; insistir es spam.
 * - `not-a-failure`: no salió **a propósito**. El rebote existe para esto.
 */
export type AgendaNoticeReasonClass =
  'retryable' | 'terminal' | 'not-a-failure';

/** Por qué canal se produjo la razón. */
export type AgendaNoticeReasonChannel = 'in-app' | 'email' | 'chat';

/** Una razón del catálogo. */
export interface AgendaNoticeReason {
  /** Código estable. Es lo que se compara; el texto no. */
  readonly code: string;
  /** Qué hacer con ella. */
  readonly reasonClass: AgendaNoticeReasonClass;
  /** Canal que la produce. */
  readonly channel: AgendaNoticeReasonChannel;
  /** El literal que hoy emite el código, palabra por palabra. */
  readonly text: string;
  /** Dónde se emite, para poder auditar el catálogo contra el código. */
  readonly source: string;
  /** Qué pasó, en una frase. */
  readonly meaning: string;
}

/**
 * Las diez razones que la relación `agenda → mensajería` produce hoy.
 *
 * Transcritas del código, no propuestas: cada `text` es el literal vivo y cada
 * `source` dice dónde se emite. Si el adaptador gana una razón nueva y no entra
 * acá, la prueba de este catálogo se pone en rojo.
 */
export const AGENDA_NOTICE_REASONS: readonly AgendaNoticeReason[] = [
  {
    code: 'EMIT_FAILED',
    reasonClass: 'retryable',
    channel: 'in-app',
    text: 'La emisión del aviso falló; la operación no se revierte',
    source: 'messaging-agenda-notice.adapter.ts · catch de emit()',
    meaning:
      'Cayó una excepción dentro del adaptador. No distingue transitorio de ' +
      'permanente: es el único caso del catálogo cuya clase depende de Q-06.',
  },
  {
    code: 'NO_PORTAL_ACCOUNT',
    reasonClass: 'terminal',
    channel: 'in-app',
    text: 'El destinatario no tiene cuenta de portal',
    source:
      'messaging-agenda-notice.adapter.ts · entregar(), destinatario nulo',
    meaning:
      'No hay a quién escribirle una bandeja, y reintentar no crea la cuenta. ' +
      'Es además el caso de HALL-09: hoy no deja rastro en ninguna tabla.',
  },
  {
    code: 'IN_APP_SUPPRESSED',
    reasonClass: 'terminal',
    channel: 'in-app',
    text: 'El destinatario no acepta este aviso por el canal in-app',
    source: 'messaging-agenda-notice.adapter.ts · request.suppressed',
    meaning:
      'Preferencia en contra por (usuario, canal, categoría). El texto puede ' +
      'venir de la base (`suppressionReason`), así que un texto desconocido de ' +
      'este camino también es una supresión.',
  },
  {
    code: 'IN_APP_DEBOUNCED',
    reasonClass: 'not-a-failure',
    channel: 'in-app',
    text: 'Ya había un aviso igual sin entregar',
    source: 'messaging-agenda-notice.adapter.ts · request.debounced',
    meaning:
      'El rebote hizo su trabajo: reintentar duplicaría la bandeja, que es lo ' +
      'que evita. Ojo con HALL-03 — sin índice único en `debounce_key`, dos ' +
      'emisiones en paralelo lo esquivan.',
  },
  {
    code: 'IN_APP_DELIVERY_EMPTY',
    reasonClass: 'retryable',
    channel: 'in-app',
    text: 'La entrega no produjo bandeja in-app',
    source: 'messaging-agenda-notice.adapter.ts · deliverNotification sin id',
    meaning:
      'La entrega se registró pero no devolvió fila de bandeja. Es una anomalía ' +
      'del canal, no una decisión sobre el destinatario.',
  },
  {
    code: 'NO_EMAIL_ON_FILE',
    reasonClass: 'terminal',
    channel: 'email',
    text: 'La cuenta no declaró correo',
    source: 'messaging-agenda-notice.adapter.ts · encolarCorreo()',
    meaning: 'No hay dirección. Reintentar no la inventa.',
  },
  {
    code: 'EMAIL_SUPPRESSED',
    reasonClass: 'terminal',
    channel: 'email',
    text: 'El destinatario no acepta este aviso por correo',
    source: 'messaging-agenda-notice.adapter.ts · encolarCorreo(), suprimida',
    meaning: 'Preferencia en contra para el canal de correo.',
  },
  {
    code: 'EMAIL_DEBOUNCED',
    reasonClass: 'not-a-failure',
    channel: 'email',
    text: 'Ya había un correo igual sin enviar',
    source: 'messaging-agenda-notice.adapter.ts · encolarCorreo(), rebotada',
    meaning: 'El mismo rebote que el in-app, sobre el canal de correo.',
  },
  {
    code: 'EMAIL_ENQUEUE_FAILED',
    reasonClass: 'retryable',
    channel: 'email',
    text: 'No se pudo encolar el correo',
    source: 'messaging-agenda-notice.adapter.ts · encolarCorreo(), catch',
    meaning:
      'Falló el encolado. El in-app no se degrada por esto, y el correo se ' +
      'puede reintentar.',
  },
  {
    code: 'CHAT_DELIVERY_FAILED',
    reasonClass: 'retryable',
    channel: 'chat',
    text: 'No se pudo entregar el aviso por chat',
    source: 'support-admin-notice.adapter.ts · notify()',
    meaning:
      'El espejo al chat de SupportAdmin no salió. Nunca degrada el resultado ' +
      'del in-app.',
  },
];

/** Índice por texto. El catálogo es inmutable: se construye una sola vez. */
const POR_TEXTO = new Map<string, AgendaNoticeReason>(
  AGENDA_NOTICE_REASONS.map((razon) => [razon.text, razon]),
);

/** Índice por código, para quien ya lo tiene y quiere la ficha. */
const POR_CODIGO = new Map<string, AgendaNoticeReason>(
  AGENDA_NOTICE_REASONS.map((razon) => [razon.code, razon]),
);

/**
 * La razón que corresponde a un texto de `skippedReason`, o `null` si no está
 * en el catálogo.
 *
 * Devuelve `null` en vez de adivinar: un texto desconocido puede ser una
 * supresión escrita en la base (`suppressionReason`) o una razón nueva que
 * nadie catalogó, y tratarlas como lo mismo volvería a mezclar justo lo que
 * este catálogo separa.
 */
export function razonDeTexto(
  texto: string | undefined,
): AgendaNoticeReason | null {
  if (texto === undefined) return null;
  return POR_TEXTO.get(texto) ?? null;
}

/** La ficha de un código, o `null` si no existe. */
export function razonDeCodigo(codigo: string): AgendaNoticeReason | null {
  return POR_CODIGO.get(codigo) ?? null;
}

/**
 * Si conviene reintentar un resultado con esta razón.
 *
 * Un texto desconocido responde `false`: reintentar a ciegas lo que nadie
 * clasificó es cómo se construye un bucle que nadie pidió.
 */
export function esReintentable(texto: string | undefined): boolean {
  return razonDeTexto(texto)?.reasonClass === 'retryable';
}
