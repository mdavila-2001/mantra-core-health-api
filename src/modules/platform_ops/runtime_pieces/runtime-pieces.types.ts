/**
 * Contrato del descubrimiento de piezas ejecutables (`runtime_pieces`).
 *
 * Una «pieza» es cualquier cosa del código que puede estar corriendo: un proceso,
 * un tick programado, un consumidor de cola, un endpoint interno que dispara
 * trabajo, una comprobación de salud o un conector externo. Todo lo que el
 * escáner afirma lleva evidencia `archivo:línea` leída del código; nada se
 * infiere de nombres ni se inventa.
 */

export const PIECE_KINDS = [
  'PROCESO',
  'JOB_PROGRAMADO',
  'TEMPORIZADOR',
  'CONSUMIDOR_COLA',
  'JOB_NOMBRADO',
  'ENDPOINT_INTERNO',
  'SALUD',
  'CONECTOR',
] as const;
export type PieceKind = (typeof PIECE_KINDS)[number];

/** Estado de una pieza tras contrastar código, registro y latidos. */
export const PIECE_STATES = [
  'VIVA',
  'SIN_LATIDO',
  'NO_REGISTRADA',
  'HUERFANA',
  'DESHABILITADA',
  'NO_MEDIBLE',
] as const;
export type PieceState = (typeof PIECE_STATES)[number];

/** Dónde se leyó algo: ruta relativa a la raíz del repositorio y línea (1-based). */
export interface Evidence {
  readonly file: string;
  readonly line: number;
}

export type ScheduleType = 'interval' | 'cron' | 'timeout' | 'poll';

export interface Schedule {
  readonly type: ScheduleType;
  /** Intervalo resuelto en ms; `null` si el argumento no se pudo resolver. */
  readonly intervalMs: number | null;
  readonly cron: string | null;
  /** Texto literal del argumento, para que el humano vea qué no se resolvió. */
  readonly raw: string;
}

/** Cómo se enciende o se apaga la pieza; sólo NOMBRES de variables, nunca valores. */
export interface EnableInfo {
  /** Frase corta, legible, de cómo se activa. */
  readonly how: string;
  readonly envVars: readonly string[];
  /** Comando, perfil de compose o script que la arranca, con su evidencia. */
  readonly launchers: readonly (Evidence & { readonly what: string })[];
}

/**
 * Qué latido representa a la pieza.
 * - `PROCESS`: el proceso emite latido propio (`worker-<dominio>`).
 * - `SELF`: es la propia API, la que responde.
 * - `INHERITED`: vive dentro de un proceso que emite latido; hereda su vida.
 * - `NONE`: no hay mecanismo de latido para esta pieza.
 */
export type HeartbeatMode = 'PROCESS' | 'SELF' | 'INHERITED' | 'NONE';

export interface HeartbeatBinding {
  readonly mode: HeartbeatMode;
  /** Id de instancia de la sonda de vida (`worker-messaging`, `api`) o `null`. */
  readonly instanceId: string | null;
}

export type AttributeValue = string | number | boolean | null;

export interface DiscoveredPiece {
  /** `code` estable en `tool_registry`: `rtp.<tipo>.<…>`. Determinista. */
  readonly id: string;
  readonly kind: PieceKind;
  readonly name: string;
  /** Módulo de dominio al que pertenece (carpeta bajo `src/modules` o `worker`). */
  readonly module: string;
  /** Procesos que la hospedan (`api`, `worker-messaging`…); vacío si no se pudo resolver. */
  readonly hosts: readonly string[];
  readonly schedule: Schedule | null;
  readonly enable: EnableInfo;
  readonly evidence: Evidence;
  readonly related: readonly Evidence[];
  readonly heartbeat: HeartbeatBinding;
  /** `false` = declarada en el código pero ningún módulo la registra como proveedor. */
  readonly wired: boolean | null;
  readonly attributes: Readonly<Record<string, AttributeValue>>;
}

/**
 * De dónde sale el descubrimiento: `live` lee `src/` en el momento; `manifest`
 * lee el manifiesto que se generó al compilar (la imagen de producción sólo
 * trae `dist/`, no `src/`).
 */
export type ScanSource = 'live' | 'manifest';

export interface ScanResult {
  /** `false` cuando no hay código fuente ni manifiesto (p. ej. imagen sólo con `dist/` sin manifiesto). */
  readonly available: boolean;
  readonly source: ScanSource;
  /** Cuándo se generó el manifiesto; `null` si la lectura es en vivo. */
  readonly generatedAt: string | null;
  readonly reason: string | null;
  readonly root: string;
  readonly filesRead: number;
  readonly pieces: readonly DiscoveredPiece[];
  /** Avisos del escáner (un argumento sin resolver, un id repetido…). */
  readonly warnings: readonly string[];
}

/** Metadatos de procedencia que se guardan en el registro de herramientas. */
export interface Provenance {
  readonly source: string;
  readonly evidence: string;
  readonly discoveredAt: string;
  readonly fingerprint: string;
  readonly kind: string;
  readonly heartbeat: string;
}

export const PROVENANCE_SOURCE = 'descubrimiento-estatico';
export const REGISTRY_CODE_PREFIX = 'rtp.';
