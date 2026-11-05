import type {
  InstanceEvaluation,
  InstanceState,
  LivenessCause,
} from '../../../ops_console/domain/instance-liveness';
import type { HeartbeatBinding, PieceState } from '../runtime-pieces.types';

/**
 * Contraste de una pieza entre tres fuentes: el CÓDIGO (lo que el escáner leyó),
 * el REGISTRO (`tool_registry`) y los LATIDOS (la sonda de vida existente).
 *
 * Función pura, sin I/O. Los umbrales NO viven acá: el latido ya llega evaluado
 * por `evaluateInstance` con las reglas de la sonda (`OPS_LIVENESS_*`), y esta
 * función sólo traduce su veredicto al vocabulario de las piezas. Mismo criterio
 * que la sonda: no saber no es estar bien.
 */

/** Causas propias de las piezas; el resto vienen tal cual de la sonda de vida. */
export type PieceOwnCause =
  | 'SELF'
  | 'HOST_ALIVE'
  | 'NOT_IN_REGISTRY'
  | 'NOT_IN_CODE'
  | 'REGISTRY_DISABLED'
  | 'CONFIG_FLAG_OFF'
  | 'NO_HEARTBEAT_MECHANISM'
  | 'HOST_UNRESOLVED'
  | 'CODE_UNAVAILABLE';
export type PieceCause = LivenessCause | PieceOwnCause;

/**
 * De dónde sale la prueba de vida:
 * - `PROPIO`: la propia instancia latió (proceso) o respondió (la API).
 * - `ANFITRION`: sólo se sabe del proceso que la contiene; que el tick de esta
 *   pieza concreta corra no se observa.
 * - `NINGUNO`: no hay prueba.
 */
export type EvidenceLevel = 'PROPIO' | 'ANFITRION' | 'NINGUNO';

export interface PieceVerdict {
  readonly state: PieceState;
  readonly cause: PieceCause;
  readonly causeDetail: string;
  readonly evidenceLevel: EvidenceLevel;
  /** Estado de la instancia que la aloja según la sonda de vida (sus 4 estados). */
  readonly instanceState: InstanceState | null;
}

export interface ContrastInput {
  /** `false` = el código fuente no está disponible: no se puede afirmar HUERFANA. */
  readonly codeScanAvailable: boolean;
  readonly inCode: boolean;
  readonly inRegistry: boolean;
  /** Estado de la fila del registro; `null` si no hay fila. */
  readonly registryActive: boolean | null;
  readonly heartbeat: HeartbeatBinding;
  /**
   * Veredicto de la sonda de vida para la instancia que representa a la pieza;
   * `null` si no se pudo resolver. Si la alojan varios procesos, ya viene elegida
   * la mejor de sus instancias (basta que una viva).
   */
  readonly liveness: InstanceEvaluation | null;
  /** Interruptor de configuración que está apagado en ESTE proceso, si se pudo verificar. */
  readonly flagOff: string | null;
}

const verdict = (
  state: PieceState,
  cause: PieceCause,
  causeDetail: string,
  evidenceLevel: EvidenceLevel = 'NINGUNO',
  instanceState: InstanceState | null = null,
): PieceVerdict => ({
  state,
  cause,
  causeDetail,
  evidenceLevel,
  instanceState,
});

export function contrastPiece(input: ContrastInput): PieceVerdict {
  if (input.codeScanAvailable && !input.inCode && input.inRegistry) {
    return verdict(
      'HUERFANA',
      'NOT_IN_CODE',
      'está en el registro de herramientas pero ya no existe en el código',
    );
  }
  if (input.inCode && !input.inRegistry) {
    return verdict(
      'NO_REGISTRADA',
      'NOT_IN_REGISTRY',
      'existe en el código y no está en el registro de herramientas',
    );
  }
  if (!input.inCode && !input.inRegistry) {
    return verdict('NO_MEDIBLE', 'CODE_UNAVAILABLE', 'sin código ni registro');
  }
  if (input.registryActive === false) {
    return verdict(
      'DESHABILITADA',
      'REGISTRY_DISABLED',
      'el registro la marca como deshabilitada',
    );
  }
  if (input.flagOff !== null) {
    return verdict(
      'DESHABILITADA',
      'CONFIG_FLAG_OFF',
      `apagada por configuración: ${input.flagOff}`,
    );
  }
  return byHeartbeat(input);
}

function byHeartbeat(input: ContrastInput): PieceVerdict {
  const { heartbeat, liveness } = input;
  if (heartbeat.mode === 'NONE') {
    return verdict(
      'NO_MEDIBLE',
      'NO_HEARTBEAT_MECHANISM',
      'esta clase de pieza no emite ni tiene latido; que exista no prueba que corra',
    );
  }
  if (liveness === null) {
    return verdict(
      'NO_MEDIBLE',
      'HOST_UNRESOLVED',
      heartbeat.instanceId === null
        ? 'no se pudo resolver en qué proceso corre (ningún módulo la registra)'
        : `la instancia "${heartbeat.instanceId}" no está en el registro de la sonda de vida`,
    );
  }
  const hostId = liveness.id;
  const level: EvidenceLevel =
    heartbeat.mode === 'PROCESS' || heartbeat.mode === 'SELF'
      ? 'PROPIO'
      : 'ANFITRION';
  const instanceState = liveness.state;
  if (liveness.state === 'VIVA' || liveness.state === 'DEGRADADA') {
    const lateOrDegraded = liveness.state === 'DEGRADADA';
    return verdict(
      'VIVA',
      lateOrDegraded
        ? liveness.cause
        : heartbeat.mode === 'SELF'
          ? 'SELF'
          : level === 'ANFITRION'
            ? 'HOST_ALIVE'
            : 'OK',
      lateOrDegraded
        ? `latido reciente pero degradado: ${liveness.causeDetail}`
        : level === 'ANFITRION'
          ? `vive en ${hostId}: ${liveness.causeDetail}`
          : liveness.causeDetail,
      level,
      instanceState,
    );
  }
  return verdict(
    'SIN_LATIDO',
    liveness.cause,
    `${hostId}: ${liveness.causeDetail}`,
    'NINGUNO',
    instanceState,
  );
}

const FALSE_VALUES = new Set(['false', '0', 'no', 'off']);
const TRUE_VALUES = new Set(['true', '1', 'yes', 'on']);

/**
 * ¿Algún interruptor de la pieza está apagado de forma EXPLÍCITA en este proceso?
 * Sólo se afirma lo que se leyó: una variable ausente no es «apagada» (el valor
 * por defecto lo decide el código del otro proceso, que acá no se ve).
 * Sólo tiene sentido para piezas que corren en el mismo proceso que consulta.
 */
export function explicitlyOff(
  envVars: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
): string | null {
  for (const name of envVars) {
    const value = (env[name] ?? '').trim().toLowerCase();
    if (value === '') continue;
    if (name.endsWith('_ENABLED') && FALSE_VALUES.has(value)) {
      return `${name}=${value}`;
    }
    if (name.endsWith('_DISABLED') && TRUE_VALUES.has(value)) {
      return `${name}=${value}`;
    }
  }
  return null;
}
