import {
  SENSITIVITIES,
  SENSITIVITY_RANK,
  type Sensitivity,
} from './catalog.constants';

/**
 * Lecturas de gobierno sobre el catálogo vivo: qué columnas son datos personales y qué reglas de
 * calidad del propio catálogo incumplen. Todo se **deriva al leer** de `catalog_annotations`; nada de
 * esto se guarda ni se infiere de valores de datos (el catálogo no lee filas, sólo metadatos).
 */

/** Desde este nivel una columna se considera dato personal en las listas por defecto. */
export const DEFAULT_MIN_PII_SENSITIVITY: Sensitivity = 'PERSONAL';

/** Niveles que se pueden pedir como mínimo: `UNKNOWN` no es un nivel y `ANONYMIZED`/`PUBLIC` no son personales. */
export const PII_MIN_SENSITIVITIES: readonly Sensitivity[] =
  SENSITIVITIES.filter(
    (nivel) => SENSITIVITY_RANK[nivel] >= SENSITIVITY_RANK.PSEUDONYMIZED,
  );

/**
 * `CASE` que traduce la sensibilidad guardada a su posición en la escala. Se arma con la
 * constante del dominio —nunca con entrada del cliente— para que la escala viva en un sólo lugar.
 */
export function rankSql(columna: string): string {
  const casos = SENSITIVITIES.map(
    (nivel) => `when '${nivel}' then ${SENSITIVITY_RANK[nivel]}`,
  ).join(' ');
  return `(case coalesce(${columna}, 'UNKNOWN') ${casos} else 0 end)`;
}

/** Cómo se ordena la lista de columnas personales. Lista blanca: nada se interpola desde el cliente. */
export const PII_SORTS = ['name', 'sensitivity'] as const;
export type PiiSort = (typeof PII_SORTS)[number];

// ---- reglas de calidad del catálogo --------------------------------------------------------

export const QUALITY_SEVERITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;
export type QualitySeverity = (typeof QUALITY_SEVERITIES)[number];

export interface QualityRule {
  code: string;
  name: string;
  description: string;
  severity: QualitySeverity;
  /** Qué mira la regla: la columna o el objeto completo. */
  target: 'COLUMN' | 'OBJECT';
  /** Cómo se resuelve: la incidencia no se cierra a mano, desaparece al corregir la ficha. */
  resolution: string;
}

/**
 * Las reglas son una tabla declarativa: agregar una es agregar una fila aquí y su `select` en el
 * repositorio. Una prueba comprueba que ambos lados coinciden.
 */
export const QUALITY_RULES: readonly QualityRule[] = [
  {
    code: 'CAT-PII-UNREVIEWED',
    name: 'Columna personal sin ficha aprobada',
    description:
      'La sensibilidad de la columna es PERSONAL o superior, pero su ficha no está aprobada con la revisión vigente (detección automática, borrador, en revisión o rechazada).',
    severity: 'HIGH',
    target: 'COLUMN',
    resolution:
      'Una persona revisa la clasificación y aprueba la ficha (POST /admin/catalog/annotations/:id/review).',
  },
  {
    code: 'CAT-PII-NO-OWNER',
    name: 'Objeto con columnas personales sin responsable',
    description:
      'El objeto tiene columnas PERSONAL o superior y su ficha no nombra responsable de negocio ni custodio del dato.',
    severity: 'MEDIUM',
    target: 'OBJECT',
    resolution:
      'Se completa businessOwner o dataSteward en la ficha del objeto (PUT /admin/catalog/objects/:id/annotation).',
  },
  {
    code: 'CAT-OBJECT-NOT-OBSERVED',
    name: 'Ficha de un objeto que ya no existe en la base',
    description:
      'El objeto tiene ficha pero el último escaneo no lo observó: la documentación describe algo que ya no está.',
    severity: 'MEDIUM',
    target: 'OBJECT',
    resolution:
      'Se confirma el retiro del objeto o se pide un escaneo (POST /admin/catalog/scans).',
  },
  {
    code: 'CAT-OBJECT-NO-ANNOTATION',
    name: 'Objeto observado sin ficha',
    description: 'El objeto existe en la base y nadie ha documentado qué es.',
    severity: 'LOW',
    target: 'OBJECT',
    resolution:
      'Se crea la ficha del objeto (PUT /admin/catalog/objects/:id/annotation).',
  },
] as const;

export const QUALITY_RULE_CODES: readonly string[] = QUALITY_RULES.map(
  (r) => r.code,
);
