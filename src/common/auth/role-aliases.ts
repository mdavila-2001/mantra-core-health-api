/**
 * Roles que son el mismo concepto con dos nombres.
 *
 * Decisión X-6 (portal de observabilidad y gobierno, frente 04 D-1): `GOVERNANCE_ADMIN` lo siembra
 * `data_catalog` y lo exigen el catálogo y el gobierno de datos; `DATA_GOVERNANCE_ADMIN` lo siembra
 * `authz` y lo exigen `cross_store_consistency` y `graph_intelligence`. Eran dos roles para lo
 * mismo: quien tenía uno no pasaba en las rutas del otro.
 *
 * Se unifican **sin migrar datos ni romper tokens**: ambos códigos siguen existiendo como filas de
 * `authz.roles` (las asignaciones y los JWT vigentes no cambian) y {@link roleEquivalents} hace que
 * `RolesGuard`, el alcance plataforma y `@PlatformTenantOptional` traten a los dos como uno. El
 * nombre canónico es el primero de cada grupo.
 */
export const ROLE_ALIAS_GROUPS: readonly (readonly string[])[] = [
  ['GOVERNANCE_ADMIN', 'DATA_GOVERNANCE_ADMIN'],
];

const GRUPO_POR_ROL: ReadonlyMap<string, readonly string[]> = new Map(
  ROLE_ALIAS_GROUPS.flatMap((grupo) =>
    grupo.map((rol) => [rol, grupo] as const),
  ),
);

/** Los códigos que autorizan como `role` (él mismo y sus alias). */
export function roleEquivalents(role: string): readonly string[] {
  return GRUPO_POR_ROL.get(role) ?? [role];
}

/** Expande una lista de roles de ruta con sus alias, sin repetir. */
export function expandRoleAliases(roles: readonly string[]): string[] {
  return [...new Set(roles.flatMap((rol) => roleEquivalents(rol)))];
}
