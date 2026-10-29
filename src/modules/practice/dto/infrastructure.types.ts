/**
 * Formas de respuesta de la estructura de infraestructura (CONTRATO-F0-F1 §3).
 *
 * Son `interface` y no clases con `@ApiProperty`: describen la respuesta que el
 * cliente arma (árbol plano, detalle, bloqueos) y no se usan para validar. Las
 * rutas las referencian en `@ApiOperation` y en el contrato publicado.
 */

/** Un concepto: código completo y texto para mostrar. */
export interface ConceptRef {
  /** Código completo (`LOC_FORM_ROOM`, `SPACE_FN_OPERATING_ROOM`…). */
  readonly code: string;
  /** Texto para personas. */
  readonly display: string;
}

/** Nodo del árbol físico (árbol plano con `parentId`; el cliente arma el árbol). */
export interface CareSpaceNode {
  readonly id: string;
  readonly parentId: string | null;
  readonly code: string;
  readonly name: string;
  readonly form: ConceptRef | null;
  readonly function: ConceptRef | null;
  readonly status: ConceptRef | null;
  readonly operationalStatus: ConceptRef | null;
  readonly clinicalUnitId: string | null;
  readonly capacity: number | null;
  readonly rowVersion: number;
  /** Hijos directos no clausurados. */
  readonly childCount: number;
}

/** Nodo del árbol organizativo. */
export interface ClinicalUnitNode {
  readonly id: string;
  readonly parentId: string | null;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: ConceptRef | null;
  readonly responsibleUserId: string | null;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly rowVersion: number;
}

/** Vínculo espacio ↔ unidad. */
export interface SpaceUnitAssignmentView {
  readonly id: string;
  readonly careSpaceId: string;
  readonly clinicalUnitId: string;
  readonly role: ConceptRef | null;
  readonly validFrom: string;
  readonly validTo: string | null;
}

/** Resumen del establecimiento en la estructura. */
export interface SiteSummary {
  readonly id: string;
  readonly practiceId: string;
  readonly branchId: string | null;
  readonly code: string;
  readonly name: string;
  readonly typology: ConceptRef | null;
  readonly rowVersion: number;
}

/** `GET /sites/:siteId/structure`. */
export interface SiteStructure {
  readonly site: SiteSummary;
  readonly spaces: CareSpaceNode[];
  readonly units: ClinicalUnitNode[];
  readonly assignments: SpaceUnitAssignmentView[];
  /** Instante de la lectura (ISO): el cliente muestra «datos de hace N min» (S7). */
  readonly asOf: string;
}

/** Un tramo de la ruta del espacio. */
export interface CareSpacePathItem {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly form: ConceptRef | null;
}

/** Recuentos derivados: nunca se escriben a mano (INV-20). */
export interface CareSpaceDerived {
  /** Camas activas en el subárbol. */
  readonly beds: number;
  /** Camas censables activas en el subárbol. */
  readonly censableBeds: number;
  /** Hijos directos activos. */
  readonly activeChildren: number;
}

/** `GET /care-spaces/:id` y respuesta de las altas. */
export interface CareSpaceDetail extends CareSpaceNode {
  readonly practiceSiteId: string;
  readonly description: string | null;
  readonly floorNumber: number | null;
  readonly areaM2: number | null;
  readonly asepsis: ConceptRef | null;
  readonly pressure: ConceptRef | null;
  readonly airChangesPerHour: number | null;
  readonly hvacValidatedOn: string | null;
  readonly sexRestriction: ConceptRef | null;
  readonly ageGroup: ConceptRef | null;
  readonly bedCategory: ConceptRef | null;
  readonly censable: boolean | null;
  readonly prepMinutes: number | null;
  readonly cleanupMinutes: number | null;
  readonly gln: string | null;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly path: CareSpacePathItem[];
  readonly children: CareSpaceNode[];
  readonly assignments: SpaceUnitAssignmentView[];
  readonly derived: CareSpaceDerived;
}

/** Tipos de bloqueo de clausura (CONTRATO-F0-F1 §3). */
export type RetireBlockerKind =
  | 'ACTIVE_CHILDREN'
  | 'ACTIVE_ENCOUNTER'
  | 'FUTURE_PROCEDURE'
  | 'FUTURE_BOOKING'
  | 'SCHEDULABLE_RESOURCE'
  | 'INVENTORY_LOCATION'
  | 'EQUIPMENT'
  | 'ACTIVE_UNIT_SPACES'
  | 'ACTIVE_UNIT_STAFF';

/** Un bloqueo de clausura: qué es, cuántos hay, ejemplos y qué hacer (S3). */
export interface RetireBlocker {
  /** Un `RetireBlockerKind`, o el tipo que registre otro módulo. */
  readonly kind: string;
  readonly count: number;
  /** Algunos ids para enlazar (no más de `RETIRE_SAMPLE_SIZE`). */
  readonly sampleIds: string[];
  /** Próxima acción que lo resuelve. */
  readonly nextAction: string;
}

/** `GET /care-spaces/:id/retire-check` y cuerpo del 409. */
export interface RetireCheck {
  readonly blockers: RetireBlocker[];
  /** Instante del cálculo (ISO): el `retire-check` previo es informativo (S7). */
  readonly asOf: string;
}

/** Una fila de `POST …/care-spaces/import`. */
export interface ImportRowResult {
  /** Número de línea del archivo (1 = primera fila de datos), el que mandó el cliente. */
  readonly line: number;
  readonly status: 'ok' | 'error';
  readonly errors: { field: string; reason: string }[];
}

/** Respuesta de `POST …/care-spaces/import`. */
export interface ImportResult {
  readonly ok: boolean;
  readonly rows: ImportRowResult[];
  /** Cuántos espacios se crearon; sólo con `dryRun=false` y `ok`. */
  readonly created?: number;
}
