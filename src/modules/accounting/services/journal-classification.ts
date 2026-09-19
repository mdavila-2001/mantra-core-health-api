import { ACCT } from '../accounting.concepts';

/**
 * Motor de clasificación contable versionado (MCH-018).
 *
 * `classify` sólo llamaba a `transition(TXN_AUTO_CLASSIFIED)` sobre un
 * PLACEHOLDER declarado en el propio comentario: no ejecutaba ninguna regla de
 * imputación ni tocaba las líneas. El asiento quedaba marcado como
 * auto-clasificado y cualquier consumidor u operador podía atribuir a ese estado
 * una validación que nunca ocurrió.
 *
 * Acá la clasificación es una decisión explícita y reproducible:
 *
 * - Las reglas son datos versionados. La versión del juego forma parte del
 *   resultado, así que una clasificación histórica se vuelve a obtener
 *   evaluando el juego con el que se decidió, aunque el vigente haya cambiado.
 * - Sin regla aplicable no hay auto-clasificación: el asiento va a revisión
 *   humana. No se inventa tipo, cuenta ni segmento.
 * - Un empate entre reglas de la misma prioridad que llevan a tipos distintos es
 *   ambigüedad, y también va a revisión: elegir una por orden de declaración
 *   sería una decisión arbitraria disfrazada de automática.
 */

/** Resultado posible de evaluar el juego de reglas. */
export type DecisionClasificacion = 'CLASIFICADA' | 'SIN_REGLA' | 'AMBIGUA';

/** Datos del asiento sobre los que deciden las reglas. */
export interface EntradaClasificacion {
  /** Tipo de documento origen del asiento, si el borrador lo declaró. */
  sourceDocumentType?: string;
}

/** Regla de imputación: qué documento origen determina qué tipo de asiento. */
export interface ReglaClasificacion {
  /** Identificador estable de la regla; se registra con la decisión. */
  id: string;
  /** Menor gana. El empate con tipos distintos es ambigüedad. */
  prioridad: number;
  /** Tipo de documento origen que activa la regla (sin distinguir mayúsculas). */
  sourceDocumentType: string;
  /** Tipo de asiento que la regla determina. */
  transactionTypeConceptId: string;
  /** Por qué esta regla imputa así; viaja con la decisión. */
  explicacion: string;
}

/** Juego de reglas con su versión. */
export interface JuegoReglas {
  /** Versión del juego; identifica la decisión en el tiempo. */
  version: string;
  /** Reglas que lo componen. */
  reglas: readonly ReglaClasificacion[];
}

/** Decisión del motor, con su evidencia. */
export interface ResultadoClasificacion {
  /** Qué concluyó el motor. */
  decision: DecisionClasificacion;
  /** Versión del juego de reglas evaluado. */
  rulesetVersion: string;
  /** Regla que decidió, si hubo una sola con la máxima prioridad. */
  ruleId?: string;
  /** Tipo de asiento determinado; ausente si no hubo clasificación. */
  transactionTypeConceptId?: string;
  /** Explicación legible de la decisión. */
  reason: string;
}

/** Juego vigente. Cambiarlo obliga a subir la versión, no a editar en sitio. */
export const JUEGO_REGLAS_VIGENTE: JuegoReglas = {
  version: 'acct-classif-v1',
  reglas: [
    {
      id: 'REVERSAL',
      prioridad: 10,
      sourceDocumentType: 'REVERSAL',
      transactionTypeConceptId: ACCT.TXN_TYPE_REVERSAL,
      explicacion: 'La reversa de un asiento se imputa como asiento de reversa',
    },
    {
      id: 'DEPRECIATION',
      prioridad: 10,
      sourceDocumentType: 'DEPRECIATION',
      transactionTypeConceptId: ACCT.TXN_TYPE_DEPRECIATION,
      explicacion: 'El cálculo de depreciación se imputa como depreciación',
    },
    {
      id: 'ACCRUAL',
      prioridad: 10,
      sourceDocumentType: 'ACCRUAL',
      transactionTypeConceptId: ACCT.TXN_TYPE_ACCRUAL,
      explicacion: 'El devengo se imputa como asiento de devengo',
    },
    {
      id: 'ASSET_ACQUISITION',
      prioridad: 10,
      sourceDocumentType: 'ASSET_ACQUISITION',
      transactionTypeConceptId: ACCT.TXN_TYPE_ASSET_ACQUISITION,
      explicacion: 'La compra de un activo se imputa como adquisición',
    },
    {
      id: 'PAYMENT_TRANSACTION',
      prioridad: 10,
      sourceDocumentType: 'PAYMENT_TRANSACTION',
      transactionTypeConceptId: ACCT.TXN_TYPE_LIABILITY_PAYMENT,
      explicacion:
        'El cobro confirmado por el proveedor cancela una obligación',
    },
    {
      id: 'GATEWAY_SETTLEMENT',
      prioridad: 10,
      sourceDocumentType: 'GATEWAY_SETTLEMENT',
      transactionTypeConceptId: ACCT.TXN_TYPE_CLEARING,
      explicacion: 'La liquidación del gateway se imputa a la cuenta puente',
    },
    // Los tres orígenes que hoy emite el módulo (`createDraft`,
    // `practitioner/entries`) son partida doble ordinaria: el tipo estándar es
    // la imputación correcta, y queda dicho por regla y no por omisión.
    {
      id: 'INVOICE',
      prioridad: 20,
      sourceDocumentType: 'INVOICE',
      transactionTypeConceptId: ACCT.TXN_TYPE_STANDARD,
      explicacion: 'El cobro de una consulta facturada es un asiento estándar',
    },
    {
      id: 'EXPENSE',
      prioridad: 20,
      sourceDocumentType: 'EXPENSE',
      transactionTypeConceptId: ACCT.TXN_TYPE_STANDARD,
      explicacion:
        'El gasto registrado por el profesional es un asiento estándar',
    },
    {
      id: 'OTHER_INCOME',
      prioridad: 20,
      sourceDocumentType: 'OTHER_INCOME',
      transactionTypeConceptId: ACCT.TXN_TYPE_STANDARD,
      explicacion: 'El ingreso distinto de consultas es un asiento estándar',
    },
  ],
};

/**
 * Evalúa el juego de reglas sobre un asiento.
 *
 * @param entrada - Datos del asiento a clasificar.
 * @param juego - Juego de reglas; por defecto el vigente. Pasar el juego
 *   histórico reproduce una clasificación anterior.
 * @returns La decisión con su evidencia.
 */
export function clasificar(
  entrada: EntradaClasificacion,
  juego: JuegoReglas = JUEGO_REGLAS_VIGENTE,
): ResultadoClasificacion {
  const origen = entrada.sourceDocumentType?.trim().toUpperCase();
  if (!origen) {
    return {
      decision: 'SIN_REGLA',
      rulesetVersion: juego.version,
      reason:
        'El asiento no declara documento origen: no hay regla que evaluar',
    };
  }

  const candidatas = juego.reglas
    .filter((r) => r.sourceDocumentType.toUpperCase() === origen)
    .sort((a, b) => a.prioridad - b.prioridad);

  if (candidatas.length === 0) {
    return {
      decision: 'SIN_REGLA',
      rulesetVersion: juego.version,
      reason: `Ninguna regla del juego ${juego.version} cubre el origen ${origen}`,
    };
  }

  const mejores = candidatas.filter(
    (r) => r.prioridad === candidatas[0].prioridad,
  );
  const tipos = new Set(mejores.map((r) => r.transactionTypeConceptId));
  if (tipos.size > 1) {
    return {
      decision: 'AMBIGUA',
      rulesetVersion: juego.version,
      reason: `Reglas en conflicto para el origen ${origen}: ${mejores
        .map((r) => r.id)
        .join(', ')}`,
    };
  }

  const elegida = mejores[0];
  return {
    decision: 'CLASIFICADA',
    rulesetVersion: juego.version,
    ruleId: elegida.id,
    transactionTypeConceptId: elegida.transactionTypeConceptId,
    reason: elegida.explicacion,
  };
}
