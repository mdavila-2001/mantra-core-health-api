/**
 * Contratos TypeScript de las columnas jsonb de `appointment_bookings`.
 *
 * Viven en un archivo propio, no en la entidad: el cuerpo de la entidad lo
 * regenera `salud-db/gen_entities.py` (ADR-0022) y todo lo que no sea la clase
 * se perdería en la siguiente corrida. El barrel los re-exporta, así los
 * consumidores siguen importando de '../entities'.
 */

/**
 * Snapshot congelado de la política de cancelación vigente al confirmar la reserva
 * (CAN-APT-001). Se guarda para que un cambio posterior de `booking_policies` NO
 * altere las condiciones que el paciente ya aceptó: la cancelación/cargo se evalúan
 * con estos valores, nunca con la política actual.
 */
export interface CancellationPolicySnapshot {
  /** Política de origen; ausente si se aplicó el default del sistema. */
  policyId?: string;
  /** `row_version` de la política congelada: traza qué versión aceptó el paciente. */
  policyRowVersion?: number;
  /** Ventana de cancelación congelada, en minutos. Default 24h (1440) si no había política. */
  cancellationWindowMinutes: number;
  /** Cargo por inasistencia/cancelación tardía congelado. */
  noShowFeeAmount?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Zona horaria del recurso congelada (CAN-TIME-001). Es informativa: el plazo se
   * evalúa sobre instantes absolutos UTC (`timestamptz`), así que no altera el cálculo.
   */
  timeZone?: string;
  /** Instante de captura del snapshot (ISO-8601). */
  capturedAt: string;
}

/**
 * Mapea la entidad persistente asociada a `appointment_bookings`.
 */
