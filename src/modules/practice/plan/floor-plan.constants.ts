/**
 * Constantes del plano de planta (CONTRATO-PLANO §3.1, §3.8, §1.6).
 *
 * Los valores numéricos son **de producto, no normas**: el contrato lo dice y el
 * catálogo los publica para que la web no los duplique.
 */

/** Límites publicados por `GET /practice/floor-plan-catalog`. */
export const PLAN_LIMITS = {
  maxVertices: 64,
  maxCoordinateM: 100_000,
  minRectSideM: 0.05,
  maxItemsPerPatch: 500,
  maxItemsPerReplace: 5000,
  maxPageSize: 2000,
  defaultPageSize: 500,
} as const;

/** Valores por defecto de un lienzo nuevo. */
export const PLAN_DEFAULTS = {
  gridSizeM: 0.5,
  snapToGrid: true,
  contactToleranceM: 0.01,
  northBearingDeg: 0,
  backgroundOpacity: 0.5,
} as const;

/** Rangos del lienzo (espejo de los `ck_floor_plans_*`). */
export const CANVAS_RANGES = {
  sizeM: { min: 1, max: 5000 },
  gridSizeM: { min: 0.01, max: 10 },
  contactToleranceM: { min: 0, max: 0.1 },
  elevationM: { min: -9999, max: 9999 },
} as const;

/** Formas del árbol que pueden anclar un lienzo (`PLAN_ANCHOR_FORM_INVALID`). */
export const ANCHOR_FORMS: readonly string[] = [
  'LOC_FORM_BUILDING',
  'LOC_FORM_WING',
  'LOC_FORM_LEVEL',
  'LOC_FORM_AREA',
  'LOC_FORM_WARD',
];

/** Tipos de elemento de lienzo y qué geometría llevan. */
export const ELEMENT_KINDS = [
  { code: 'WALL', geometry: 'POLYLINE', hosted: false, label: 'Muro' },
  { code: 'DOOR', geometry: 'HOSTED', hosted: true, label: 'Puerta' },
  { code: 'WINDOW', geometry: 'HOSTED', hosted: true, label: 'Ventana' },
  { code: 'OPENING', geometry: 'HOSTED', hosted: true, label: 'Abertura' },
  { code: 'STAIRS', geometry: 'POLYGON', hosted: false, label: 'Escalera' },
  { code: 'ELEVATOR', geometry: 'POLYGON', hosted: false, label: 'Ascensor' },
  {
    code: 'CIRCULATION',
    geometry: 'POLYGON',
    hosted: false,
    label: 'Circulación',
  },
  { code: 'COLUMN', geometry: 'POLYGON', hosted: false, label: 'Columna' },
  { code: 'ANNOTATION', geometry: 'POINT', hosted: false, label: 'Anotación' },
] as const;

/** Códigos de tipo de elemento. */
export type ElementKind = (typeof ELEMENT_KINDS)[number]['code'];

/** Tipos alojados en un muro. */
export const HOSTED_KINDS: readonly string[] = ['DOOR', 'WINDOW', 'OPENING'];
/** Tipos con polígono simple. */
export const POLYGON_KINDS: readonly string[] = [
  'STAIRS',
  'ELEVATOR',
  'CIRCULATION',
  'COLUMN',
];

/** Rangos de los elementos (espejo de `ck_plan_elements_*`). */
export const ELEMENT_RANGES = {
  thicknessM: { min: 0.02, max: 2 },
  hostedWidthM: { min: 0.3, max: 20 },
  zOrder: { min: -1000, max: 1000 },
  labelMax: 120,
  verticalLinkMax: 40,
  swing: ['LEFT', 'RIGHT', 'DOUBLE', 'SLIDING', 'NONE'],
  swingSide: ['A', 'B'],
} as const;

/** Orden de pintado por defecto al crear (CONTRATO-PLANO §5.5). */
export const DEFAULT_Z_ORDER: Readonly<Record<string, number>> = {
  CIRCULATION: 5,
  ZONE: 0,
  ROOM: 10,
  BED: 20,
  WALL: 30,
  STAIRS: 15,
  ELEVATOR: 15,
  WINDOW: 35,
  DOOR: 40,
  OPENING: 40,
  ANNOTATION: 60,
};

/** Capas de estado que el plano sabe colorear. */
export const STATE_LAYERS = [
  'LIFECYCLE',
  'AVAILABILITY',
  'OCCUPANCY',
  'HYGIENE',
  'ISOLATION',
  'V2',
  'UNIT',
  'FUNCTION',
] as const;

/** Ejes del estado operativo que admite el parámetro `axis`. */
export const STATE_AXES = [
  'availability',
  'occupancy',
  'hygiene',
  'isolation',
] as const;

/** Reglas del fondo importado (CONTRATO-PLANO §1.6). Tamaños: valores de producto, no normas. */
export const BACKGROUND_RULES = {
  mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  svgExcluded: true,
  defaultMaxBytes: 10 * 1024 * 1024,
  defaultMaxPx: 8192,
  /** Vida de la URL firmada del fondo, en segundos. */
  signedUrlTtlSeconds: 300,
} as const;

/** Claves de `practice_settings` que lee el plano. */
export const PLAN_SETTING_KEYS = {
  areaTolerancePct: 'infra.plan.area_tolerance_pct',
  roomTemplates: 'infra.plan.room_templates',
  backgroundMaxBytes: 'infra.plan.background.max_bytes',
  backgroundMaxPx: 'infra.plan.background.max_px',
  inspectionRequired: 'infra.inspection_required',
} as const;

/** Eventos de outbox (`asyncapi/fragments/plano.yaml`). */
export const PLAN_EVENTS = {
  created: 'practice.floor_plan.created',
  updated: 'practice.floor_plan.updated',
  lifecycleChanged: 'practice.floor_plan.lifecycle_changed',
  backgroundChanged: 'practice.floor_plan.background_changed',
  layoutChanged: 'practice.floor_plan.layout_changed',
} as const;

/** Tope de ids por lista en `layout_changed` (`truncated: true` si había más). */
export const LAYOUT_EVENT_ID_CAP = 200;

/** Acción de auditoría de leer el nombre de un paciente desde el plano. */
export const OCCUPANT_VIEWED = 'PLAN_OCCUPANT_VIEWED';
/** Ventana de deduplicación de esa lectura, en segundos. */
export const OCCUPANT_VIEWED_DEDUPE_SECONDS = 60;

/** Plantillas de habitación de arranque (valores de producto, no normas). */
export interface RoomTemplate {
  readonly code: string;
  readonly name: string;
  readonly widthM: number;
  readonly depthM: number;
  /** Camas dentro del local: posición del centro relativa al centro del local y tamaño. */
  readonly beds: readonly {
    readonly dxM: number;
    readonly dyM: number;
    readonly widthM: number;
    readonly depthM: number;
  }[];
  /** Posición de la puerta sobre el muro sur, desde su primer vértice. */
  readonly doorOffsetM: number;
  readonly doorWidthM: number;
}

/** Plantillas que devuelve el catálogo si la práctica no configuró las suyas. */
export const DEFAULT_ROOM_TEMPLATES: readonly RoomTemplate[] = [
  {
    code: 'ROOM_1_BED',
    name: 'Habitación de 1 cama',
    widthM: 4,
    depthM: 4,
    beds: [{ dxM: 0, dyM: -0.5, widthM: 1, depthM: 2 }],
    doorOffsetM: 0.5,
    doorWidthM: 0.9,
  },
  {
    code: 'ROOM_2_BEDS',
    name: 'Habitación de 2 camas',
    widthM: 5,
    depthM: 4.5,
    beds: [
      { dxM: -1.2, dyM: -0.5, widthM: 1, depthM: 2 },
      { dxM: 1.2, dyM: -0.5, widthM: 1, depthM: 2 },
    ],
    doorOffsetM: 0.5,
    doorWidthM: 0.9,
  },
  {
    code: 'CONSULTING_ROOM',
    name: 'Consultorio',
    widthM: 3.5,
    depthM: 4,
    beds: [],
    doorOffsetM: 0.5,
    doorWidthM: 0.9,
  },
  {
    code: 'ICU_BAY',
    name: 'Puesto de terapia',
    widthM: 4,
    depthM: 4,
    beds: [{ dxM: 0, dyM: -0.3, widthM: 1.1, depthM: 2.2 }],
    doorOffsetM: 1,
    doorWidthM: 1.2,
  },
];
