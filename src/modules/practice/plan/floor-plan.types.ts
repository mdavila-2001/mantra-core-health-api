/**
 * Formas del plano de planta (CONTRATO-PLANO §3). Son `interface`: describen la
 * respuesta y el modelo de trabajo, no validan entradas (eso es de
 * `floor-plan.dto.ts` y del validador de dibujo).
 */
import type { Bbox, Pt } from '../domain/plan-geometry';

/** `{code, display}` de un concepto. */
export interface PlanConceptRef {
  readonly code: string;
  readonly display: string;
}

/** Ancla de un lienzo (el espacio al que se asocia); `null` es el campus. */
export interface PlanAnchor {
  readonly spaceId: string;
  readonly code: string;
  readonly name: string;
  readonly form: string | null;
}

/** Fondo importado de un lienzo (sin el id del archivo: el cliente nunca lo ve). */
export interface PlanBackground {
  readonly scaleMPerPx: number;
  readonly offsetXM: number;
  readonly offsetYM: number;
  readonly rotationDeg: number;
  readonly opacity: number;
  /** URL firmada de vida corta (la API la entrega; nunca el id público del archivo). */
  readonly url: string;
  readonly urlExpiresAt: string;
}

/** Qué puede hacer quien mira (reflejo: la API vuelve a autorizar cada petición). */
export interface ViewerCaps {
  readonly canEditPlan: boolean;
  readonly canSeeState: boolean;
  readonly canSeePatient: boolean;
  readonly canOpenSpaceFile: boolean;
  readonly scope: 'ALL' | 'UNITS' | 'NONE';
  readonly unitIds?: string[];
}

/** Metadatos de un lienzo. */
export interface FloorPlanMeta {
  readonly id: string;
  readonly siteId: string;
  readonly code: string;
  readonly name: string;
  readonly anchor: PlanAnchor | null;
  readonly widthM: number;
  readonly heightM: number;
  readonly elevationM: number | null;
  readonly northBearingDeg: number;
  readonly gridSizeM: number;
  readonly snapToGrid: boolean;
  readonly contactToleranceM: number;
  readonly background: PlanBackground | null;
  readonly layoutVersion: number;
  readonly layoutChangedAt: string | null;
  readonly rowVersion: number;
  readonly validFrom: string;
  readonly validTo: string | null;
  readonly retired: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** `GET /sites/:siteId/floor-plans`. */
export interface FloorPlanSummary {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly anchor: PlanAnchor | null;
  readonly widthM: number;
  readonly heightM: number;
  readonly elevationM: number | null;
  readonly layoutVersion: number;
  readonly validFrom: string;
  readonly validTo: string | null;
  readonly counts: {
    readonly placed: number;
    readonly unplaced: number;
    readonly elements: number;
  };
}

/** Geometría de un espacio, como viaja. */
export type PlacementGeometry =
  | {
      readonly kind: 'RECT';
      readonly centerXM: number;
      readonly centerYM: number;
      readonly widthM: number;
      readonly depthM: number;
      readonly rotationDeg: number;
    }
  | { readonly kind: 'POLYGON'; readonly vertices: [number, number][] };

/** Datos estáticos de la tarjeta de detalle (`detail=full`). */
export interface PlacementCard {
  readonly formDisplay: string;
  readonly functionDisplay: string;
  readonly lifecycle: PlanConceptRef;
  readonly ownerUnit: { id: string; code: string; name: string } | null;
  readonly capacity: number | null;
  readonly bedCount: number | null;
  readonly censableBeds: number | null;
  readonly areaDeclaredM2: number | null;
  readonly technical?: {
    asepsis?: string;
    pressure?: string;
    airChangesPerHour?: number;
    hvacValidatedOn?: string;
    sexRestriction?: string;
    ageGroup?: string;
    bedCategory?: string;
  };
  readonly path: { id: string; code: string; name: string; form: string }[];
}

/** Un espacio dibujado. Fuera de alcance (`inScope:false`) sólo silueta. */
export interface SpacePlacementDTO {
  readonly placementId: string;
  readonly spaceId: string;
  readonly rowVersion: number;
  readonly zOrder: number;
  readonly locked: boolean;
  readonly geometry: PlacementGeometry;
  readonly bbox: Bbox;
  readonly areaCalcM2: number;
  readonly inScope: boolean;
  readonly inFocus?: boolean;
  readonly code?: string;
  readonly name?: string;
  readonly parentId?: string | null;
  readonly form?: { code: string };
  readonly function?: { code: string };
  readonly retired?: boolean;
  readonly card?: PlacementCard;
}

/** Un elemento del lienzo. */
export interface PlanElementDTO {
  readonly id: string;
  readonly kind: string;
  readonly rowVersion: number;
  readonly zOrder: number;
  readonly vertices?: [number, number][];
  readonly thicknessM?: number;
  readonly hostElementId?: string;
  readonly offsetM?: number;
  readonly widthM?: number;
  readonly swing?: string;
  readonly swingSide?: string;
  readonly label?: string;
  readonly verticalLinkCode?: string;
  readonly connectsSpaceAId?: string;
  readonly connectsSpaceBId?: string;
  /** Caja envolvente de los no alojados. */
  readonly bbox?: Bbox;
  /** Posición calculada de una abertura sobre su muro (`x`, `y`, `angleDeg`). */
  readonly position?: { x: number; y: number; angleDeg: number };
}

/** `GET /floor-plans/:id/layout`. */
export interface LayoutResponse {
  readonly floorPlan: FloorPlanMeta;
  readonly layoutVersion: number;
  readonly asOf: string;
  readonly spaces: SpacePlacementDTO[];
  readonly elements: PlanElementDTO[];
  readonly page: { nextCursor: string | null; total: number };
  readonly focus?: { spaceIds: string[]; bbox: Bbox | null };
  readonly viewer: ViewerCaps;
}

/** Advertencia no bloqueante de un guardado (INV-PL-14). */
export interface AreaMismatchWarning {
  readonly code: 'AREA_MISMATCH';
  readonly spaceId: string;
  readonly declaredM2: number;
  readonly calculatedM2: number;
  readonly deviationPct: number;
  readonly tolerancePct: number;
}

/** Respuesta de un guardado de layout. */
export interface LayoutWriteResult {
  readonly layoutVersion: number;
  readonly applied: {
    readonly placed: number;
    readonly moved: number;
    readonly removed: number;
    readonly elementsUpserted: number;
    readonly elementsRemoved: number;
  };
  readonly warnings: AreaMismatchWarning[];
  readonly requestId: string | null;
  /** Sólo con `dryRun=true`: nada se escribió. */
  readonly dryRun?: boolean;
}

/** Un error por elemento de `PLAN_LAYOUT_INVALID` (S3 con próxima acción). */
export interface PlanLayoutError {
  readonly kind: 'SPACE' | 'ELEMENT' | 'CANVAS';
  readonly id: string;
  readonly code: string;
  readonly field?: 'geometry' | 'parent' | 'host' | 'size';
  readonly message: string;
  readonly conflictsWith?: {
    kind: 'SPACE' | 'ELEMENT';
    id: string;
    code: string;
    name: string;
    overlapAreaM2?: number;
  }[];
  readonly nextAction?: { label: string; hint: string };
}

/** Un problema de `GET /floor-plans/:id/validation`. */
export interface PlanValidationIssue {
  readonly severity: 'ERROR' | 'WARNING';
  readonly code: string;
  readonly subjectId: string;
  readonly otherId?: string;
  readonly detail: string;
}

/** Un espacio sin dibujar (paleta del editor). */
export interface UnplacedSpace {
  readonly spaceId: string;
  readonly code: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly depth: number;
  readonly form: PlanConceptRef | null;
  readonly function: PlanConceptRef | null;
  readonly lifecycle: PlanConceptRef | null;
  readonly placeable: boolean;
  readonly reason?: string;
}

/** Estado operativo de un espacio (= celda del tablero sin identidad). */
export interface SpaceState {
  readonly lifecycle: { code: string };
  readonly availability?: {
    code: string;
    reasonCode?: string;
    reasonText?: string;
    expectedUntil?: string;
    since: string;
  };
  readonly occupancy?: {
    code: 'OCC_FREE' | 'OCC_RESERVED' | 'OCC_OCCUPIED';
    since: string;
    patient?: { initials: string; sexCode: string; ageYears: number };
  };
  readonly hygiene?: { code: string; since: string; terminalRequired: boolean };
  readonly isolation?: { code: string; organism?: string; since: string };
  readonly v2Code: 'C' | 'H' | 'I' | 'K' | 'O' | 'U' | 'R';
  readonly assignable: boolean;
  readonly openCleaningOrderId?: string;
  readonly lastEventAt: string;
  readonly opsVersion: number;
}

/** Recuentos por contenedor. */
export interface PlanRollup {
  beds: number;
  censable: number;
  occupied: number;
  reserved: number;
  assignable: number;
  blocked: number;
  maintenance: number;
  dirty: number;
  cleaning: number;
  isolation: number;
  contaminated: number;
}

/** `GET /floor-plans/:id/state`. */
export interface PlanStateResponse {
  readonly asOf: string;
  readonly lastEventAt: string | null;
  readonly layoutVersion: number;
  readonly spaces: Record<string, SpaceState>;
  readonly rollups: Record<string, PlanRollup>;
  readonly counts: {
    total: number;
    assignable: number;
    occupied: number;
    reserved: number;
    blocked: number;
    maintenance: number;
    dirty: number;
    cleaning: number;
    isolation: number;
    contaminated: number;
  };
  readonly viewer: ViewerCaps;
}

/** `GET /care-spaces/:id/plan-card`. */
export interface PlanCardResponse {
  readonly asOf: string;
  readonly patient?: {
    displayName: string;
    initials: string;
    sexCode: string;
    ageYears: number;
    encounterId: string;
    admittedAt: string;
    losDays: number;
    expectedDischargeAt?: string;
  };
  readonly openBlocks: {
    id: string;
    kind: string;
    reasonCode: string | null;
    reasonText: string | null;
    startsAt: string;
    expectedEndAt: string | null;
  }[];
  readonly openCleaningOrder?: {
    id: string;
    type: string;
    status: string;
    priority: string;
    requestedAt: string;
  };
  readonly viewer: ViewerCaps;
}

/** Punto `[x, y]` mutable para respuestas. */
export type PointTuple = [number, number];

/** Convierte vértices de solo lectura a la forma de respuesta. */
export function toTuples(vertices: readonly Pt[]): PointTuple[] {
  return vertices.map(([x, y]) => [x, y]);
}
