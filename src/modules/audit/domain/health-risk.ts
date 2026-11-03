/**
 * Riesgo para la seguridad de la salud de un evento de bitácora. **No se guarda**: se deriva al
 * leer, de lo que el sello ya dice (acción, entidad, ruta, verbo), así que cambiar una regla
 * reclasifica también lo histórico y la bitácora WORM no se toca.
 *
 * Escala (identidad visual / informe de investigación del centro de datos):
 * - CRITICAL: exportación masiva de PHI, cambio de permisos, acceso de emergencia (*break-glass*);
 * - HIGH: escritura de PHI;
 * - MEDIUM: lectura de PHI de un paciente;
 * - LOW: sin PHI.
 */
export const HEALTH_RISKS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
export type HealthRisk = (typeof HEALTH_RISKS)[number];

/** Qué tabla de la bitácora originó el evento y cómo leerlo. */
export type AuditEventKind = 'MUTATION' | 'DATA_ACCESS';

/** Operación que el evento hizo sobre el dato. */
export type DataOperation = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT';

export interface RiskInput {
  kind: AuditEventKind;
  /** Texto del sello: acción de negocio o `HTTP <VERBO> <plantilla>`. */
  action: string;
  entity: string;
  /** Ruta de la que salió el sello, si se pudo derivar. */
  route: string | null;
  /** Verbo HTTP, si se pudo derivar. Un sello de mutación sin verbo conocido se trata como escritura. */
  method: string | null;
  /** Sólo `DATA_ACCESS`: la operación registrada. */
  operation?: DataOperation;
  /** Sólo `DATA_ACCESS`: el acceso identifica a un paciente. */
  hasPatient?: boolean;
}

/** Lo que revela que un evento trata datos de salud. Se aplica sobre ruta, entidad y acción. */
const PHI_PATTERN =
  /(patient|clinical|chart|encounter|medication|prescription|diagnos|allerg|condition|observation|laborator|lab_result|imaging|procedure|vital|care_plan|immuniz|medical|health_record)/i;

const EXPORT_PATTERN = /(export|bulk|dump)/i;
const BREAK_GLASS_PATTERN = /(break[_-]?glass|emergency[_-]?access)/i;
/** Cambios de quién puede qué: acciones de negocio y rutas de `authz`. */
const PERMISSION_CHANGE_PATTERN =
  /(^|[_\s/])(role|roles|permission|permissions|grant|grants|delegation|delegated)([_\s/]|$)/i;
const AUTHZ_ROUTE = /^\/authz(\/|$)/;

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function esLectura(i: RiskInput): boolean {
  if (i.kind === 'DATA_ACCESS') return (i.operation ?? 'READ') === 'READ';
  return i.method !== null && READ_METHODS.has(i.method.toUpperCase());
}

function trataSalud(i: RiskInput): boolean {
  return PHI_PATTERN.test(`${i.route ?? ''} ${i.entity} ${i.action}`);
}

/** Cambio de permisos: una mutación sobre `authz` o una acción de negocio que lo nombra. */
function cambiaPermisos(i: RiskInput): boolean {
  if (esLectura(i)) return false;
  return (
    AUTHZ_ROUTE.test(i.route ?? '') ||
    PERMISSION_CHANGE_PATTERN.test(`${i.action} ${i.entity}`)
  );
}

function esExportacion(i: RiskInput): boolean {
  return (
    i.operation === 'EXPORT' ||
    EXPORT_PATTERN.test(`${i.route ?? ''} ${i.action}`)
  );
}

/**
 * Riesgo de un evento. La primera condición que se cumple decide:
 * crítico (exporta, cambia permisos, emergencia) > alto (escribe PHI) > medio (lee PHI de un
 * paciente) > bajo.
 */
export function deriveHealthRisk(i: RiskInput): HealthRisk {
  if (
    BREAK_GLASS_PATTERN.test(`${i.route ?? ''} ${i.action}`) ||
    cambiaPermisos(i) ||
    (esExportacion(i) && (trataSalud(i) || i.hasPatient === true))
  )
    return 'CRITICAL';
  if (!esLectura(i) && trataSalud(i)) return 'HIGH';
  if (esLectura(i) && (i.hasPatient === true || trataSalud(i))) return 'MEDIUM';
  return 'LOW';
}
