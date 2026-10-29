/**
 * Sub-códigos de negocio estables del plano de planta (CONTRATO-PLANO §2 y §3.4).
 *
 * Van en el 3.er argumento (`reason`) de `DomainException` y, por elemento, en
 * `details.errors[].code` de `PLAN_LAYOUT_INVALID`. Un cliente ramifica sobre
 * ellos sin parsear `message`.
 */
export enum FloorPlanReason {
  // --- lienzo -------------------------------------------------------------
  /** El `code` del lienzo ya existe en la sede. */
  PLAN_CODE_TAKEN = 'PLAN_CODE_TAKEN',
  /** El ancla ya tiene un lienzo vigente. */
  PLAN_ANCHOR_TAKEN = 'PLAN_ANCHOR_TAKEN',
  /** La sede ya tiene un lienzo de campus vigente. */
  PLAN_CAMPUS_EXISTS = 'PLAN_CAMPUS_EXISTS',
  /** La forma del ancla no es `BUILDING·WING·LEVEL·AREA·WARD`. */
  PLAN_ANCHOR_FORM_INVALID = 'PLAN_ANCHOR_FORM_INVALID',
  /** El ancla está clausurada. */
  PLAN_ANCHOR_NOT_ACTIVE = 'PLAN_ANCHOR_NOT_ACTIVE',
  /** Achicar el lienzo dejaría figuras fuera. */
  PLAN_BOUNDS_EXCLUDE_CONTENT = 'PLAN_BOUNDS_EXCLUDE_CONTENT',
  /** La sede y el ancla de un lienzo no se cambian. */
  PLAN_ANCHOR_IMMUTABLE = 'PLAN_ANCHOR_IMMUTABLE',
  /** El lienzo no es válido (tamaño, grilla, tolerancia, norte). */
  PLAN_CANVAS_INVALID = 'PLAN_CANVAS_INVALID',
  /** El lienzo está clausurado: no admite cambios de dibujo. */
  PLAN_RETIRED = 'PLAN_RETIRED',
  /** Acción de ciclo de vida que no aplica desde el estado actual. */
  PLAN_LIFECYCLE_INVALID = 'PLAN_LIFECYCLE_INVALID',
  /** Clausurar/quitar con camas ocupadas dibujadas (INV-PL-12). */
  PLAN_SPACE_OCCUPIED = 'PLAN_SPACE_OCCUPIED',

  // --- dibujo -------------------------------------------------------------
  /** El guardado trae errores por elemento (`details.errors`). */
  PLAN_LAYOUT_INVALID = 'PLAN_LAYOUT_INVALID',
  /** El `layoutVersion` del `If-Match` no es el vigente. */
  PLAN_VERSION_MISMATCH = 'PLAN_VERSION_MISMATCH',
  /** Dos hermanos comparten superficie (INV-PL-04). */
  PLAN_SIBLING_OVERLAP = 'PLAN_SIBLING_OVERLAP',
  /** El espacio ya tiene lugar en otro lienzo (INV-PL-07). */
  PLAN_SPACE_ALREADY_PLACED = 'PLAN_SPACE_ALREADY_PLACED',
  /** Geometría inválida (INV-PL-02). */
  PLAN_GEOMETRY_INVALID = 'PLAN_GEOMETRY_INVALID',
  /** La figura sale del lienzo (INV-PL-03). */
  PLAN_OUT_OF_BOUNDS = 'PLAN_OUT_OF_BOUNDS',
  /** El padre del espacio no está dibujado en este lienzo (INV-PL-05). */
  PLAN_PARENT_NOT_PLACED = 'PLAN_PARENT_NOT_PLACED',
  /** El espacio no cabe dentro de su padre (INV-PL-05). */
  PLAN_CHILD_OUTSIDE_PARENT = 'PLAN_CHILD_OUTSIDE_PARENT',
  /** Quitar un padre con hijos dibujados (INV-PL-11). */
  PLAN_HAS_PLACED_CHILDREN = 'PLAN_HAS_PLACED_CHILDREN',
  /** El espacio está clausurado o no pertenece a la sede del lienzo. */
  PLAN_SPACE_NOT_PLACEABLE = 'PLAN_SPACE_NOT_PLACEABLE',
  /** Elemento inválido (campos que no corresponden a su tipo). */
  PLAN_ELEMENT_INVALID = 'PLAN_ELEMENT_INVALID',
  /** La puerta/ventana/abertura no está sobre un muro (INV-PL-08). */
  PLAN_HOST_NOT_WALL = 'PLAN_HOST_NOT_WALL',
  /** La abertura excede el largo del muro (INV-PL-08). */
  PLAN_OPENING_OUTSIDE_WALL = 'PLAN_OPENING_OUTSIDE_WALL',
  /** Más ítems que el máximo por guardado. */
  PLAN_TOO_MANY_ITEMS = 'PLAN_TOO_MANY_ITEMS',
  /** El reemplazo total quita algo y no trae `confirmRemoval`. */
  PLAN_REMOVAL_NOT_CONFIRMED = 'PLAN_REMOVAL_NOT_CONFIRMED',
  /** Falta (o sobra) el parámetro de foco. */
  PLAN_FOCUS_PARAM_INVALID = 'PLAN_FOCUS_PARAM_INVALID',
  /** Mover un espacio en el árbol rompería su dibujo (INV-PL-10). */
  SPACE_MOVE_BREAKS_PLAN = 'SPACE_MOVE_BREAKS_PLAN',

  // --- fondo --------------------------------------------------------------
  /** El archivo no sirve de fondo (tipo, tamaño, dimensiones, borrado). */
  BACKGROUND_FILE_INVALID = 'BACKGROUND_FILE_INVALID',
  /** La calibración no es válida. */
  BACKGROUND_CALIBRATION_INVALID = 'BACKGROUND_CALIBRATION_INVALID',
  /** La URL firmada del fondo no es válida o venció. */
  BACKGROUND_URL_INVALID = 'BACKGROUND_URL_INVALID',

  // --- permisos -----------------------------------------------------------
  /** El rol no tiene la acción (403, con `details.requiredRoles`). */
  INFRA_ACTION_NOT_ALLOWED = 'INFRA_ACTION_NOT_ALLOWED',
  /** El soporte de plataforma exige motivo para escribir. */
  SUPPORT_REASON_REQUIRED = 'SUPPORT_REASON_REQUIRED',
}
