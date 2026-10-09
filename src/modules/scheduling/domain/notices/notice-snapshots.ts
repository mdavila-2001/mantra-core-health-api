/**
 * Lecturas mínimas que los avisos de agenda necesitan (P8). Las produce
 * `SchedulingNoticeRepository` y las consumen las funciones puras de redacción.
 */

/** Lo que un aviso necesita saber de una cita. */
export interface BookingNoticeSnapshot {
  readonly bookingId: string;
  readonly tenantId: string;
  readonly patientProfileId: string;
  readonly resourceId?: string;
  readonly slotId: string;
  readonly startAt?: Date;
  readonly endAt?: Date;
  /** Cómo se llama la agenda: el profesional, si el recurso es de uno. */
  readonly resourceLabel: string;
  /**
   * Dónde se atiende, si el recurso declara sede.
   *
   * El propietario pide el aviso «en tal horario **en tal lugar**». Hasta acá
   * el horario estaba y el lugar no, y el comentario de `agenda-notices.ts`
   * decía que faltaba exponer la sede en la lectura de agenda. **Ya está
   * expuesta** —`ResourceSiteDto` en el listado de recursos—, así que lo único
   * que faltaba era traerla también acá.
   *
   * `undefined` es corriente y no es un error: un recurso sin sede declarada
   * existe, y el aviso se manda igual sin esa frase.
   */
  readonly siteLabel?: string;
}

/** Lo que un aviso necesita saber de un cupo liberado. */
export interface SlotNoticeSnapshot {
  readonly slotId: string;
  readonly resourceId: string;
  readonly startAt: Date;
  readonly endAt?: Date;
  readonly resourceLabel: string;
}

/** Entrada de lista de espera tal como la ve quien la pidió. */
export interface WaitlistEntrySnapshot {
  readonly id: string;
  readonly tenantId: string;
  readonly patientProfileId: string;
  readonly resourceId?: string;
  readonly resourceLabel: string;
  readonly desiredFrom?: Date;
  readonly desiredTo?: Date;
  readonly priority: number;
  readonly statusConceptId: string;
  readonly createdAt: Date;
  /** Quién espera. Sólo la lectura por agenda lo resuelve. */
  readonly patientName?: string;
}
