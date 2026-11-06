import { deterministicId } from '../../common/constants/concepts';

/**
 * Conceptos del gobierno de accesos (parche v4.2.78 de la base): estados de la
 * aprobación de cuatro ojos, de la tarea de revisión y de la anomalía, y la
 * clase de revisor/aprobador.
 *
 * El parche los siembra con `code = 'delegated_access:<CLAVE>'` y
 * `id = deterministicId(code)`, la misma derivación de `defineModuleConcepts`.
 * Se calculan acá en vez de consultar `terminology.catalog_concepts` por código
 * para que las lecturas filtren por id (con índice) y no dependan de un join.
 * `delegated_access.governance-concepts.spec.ts` ancla la derivación al id que
 * el DDL fija como valor por omisión de `access_review_items.decision_concept_id`.
 */
const PREFIX = 'delegated_access:';

/** El código completo de un concepto del módulo. */
export const governanceConceptCode = (key: string): string => `${PREFIX}${key}`;

const id = (key: string): string => deterministicId(governanceConceptCode(key));

export const GOVERNANCE = {
  /** `four_eyes_requests.status_concept_id`: esperando a quien decide. */
  FOUR_EYES_PENDING: id('FOUR_EYES_PENDING'),
  /** `access_review_items.decision_concept_id`: todavía sin decidir. */
  REVIEW_ITEM_PENDING: id('REVIEW_ITEM_PENDING'),
  /** `access_anomalies.status_concept_id`: abierta, nadie la atendió. */
  ANOMALY_OPEN: id('ANOMALY_OPEN'),
  /** `*_kind_concept_id`: el doctor dueño de la agenda decide. */
  REVIEWER_KIND_DOCTOR_OWNER: id('REVIEWER_KIND_DOCTOR_OWNER'),
} as const;

/**
 * El nombre corto de un concepto para la pantalla: sin el prefijo del módulo
 * ni el de su vocabulario (`delegated_access:FOUR_EYES_KIND_ACTION` → `ACTION`).
 * Los tipos de anomalía conservan su `ANOMALY_` porque así los nombra la pantalla.
 */
export function governanceShortName(code: string): string {
  return code
    .replace(PREFIX, '')
    .replace(/^(FOUR_EYES_KIND_|REVIEWER_KIND_|FOUR_EYES_)/, '');
}
