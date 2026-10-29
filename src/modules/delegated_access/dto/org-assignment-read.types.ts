/** Referencia legible a un nodo del alcance (para pantallas: nunca un UUID suelto). */
export interface AssignmentNodeRef {
  readonly id: string;
  readonly code: string | null;
  readonly name: string;
}

/** Una asignación con su alcance resuelto. */
export interface OrgAssignmentView {
  readonly id: string;
  readonly tenantMembershipId: string;
  /** Código del rol (`NURSE`, `HOUSEKEEPING`, `UNIT_HEAD`…). */
  readonly role: string;
  /** Código del alcance (`TENANT`, `PRACTICE`, `SITE`, `UNIT`, `SPACE`). */
  readonly accessScope: string;
  readonly status: 'ACTIVE' | 'SUSPENDED' | 'OTHER';
  readonly practice: AssignmentNodeRef | null;
  readonly site: AssignmentNodeRef | null;
  readonly unit: AssignmentNodeRef | null;
  readonly space: AssignmentNodeRef | null;
  readonly supervisorUserId: string | null;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly rowVersion: number;
}

/** Un rol que se puede asignar, con los alcances en los que vale. */
export interface AssignmentRoleView {
  readonly code: string;
  readonly label: string;
  /** Rol operativo de la infraestructura hospitalaria (lo evalúa `InfrastructureAccessService`). */
  readonly operational: boolean;
  readonly allowedScopes: readonly string[];
}

/** Un alcance que se puede elegir y el objetivo que exige. */
export interface AssignmentScopeView {
  readonly code: string;
  readonly label: string;
  /** Campo del cuerpo con el objetivo (`null` para TENANT). */
  readonly target: string | null;
}

/** Catálogo para los selectores de la pantalla de asignaciones. */
export interface AssignmentCatalogView {
  readonly roles: readonly AssignmentRoleView[];
  readonly scopes: readonly AssignmentScopeView[];
}

/** Un candidato de los selectores encadenados sede → unidad → espacio. */
export interface AssignmentTargetView {
  readonly id: string;
  readonly code: string | null;
  readonly name: string;
  /** Sede a la que pertenece (en una sede es ella misma). */
  readonly siteId: string | null;
  /** Espacio padre, para armar el árbol del selector. */
  readonly parentId: string | null;
  /** Función del espacio (`SPACE_FN_…`), si aplica. */
  readonly functionCode: string | null;
}
