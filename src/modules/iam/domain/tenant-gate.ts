/** Lo que el token declara de la autoridad de la persona, antes de aplicar las políticas. */
export interface SessionAuthority {
  /** Códigos de rol del claim `roles`. */
  readonly roles: readonly string[];
  /** Roles con ámbito de organización (`scopedRoles`). */
  readonly scopedRoles: Readonly<Record<string, readonly string[]>>;
  /** Organizaciones activas (`tenants`). */
  readonly tenants: readonly string[];
}

/**
 * Quita de la autoridad de la persona las organizaciones que NO la dejan actuar
 * ahora (franja, red, segundo factor): salen de `tenants` y de `scopedRoles`.
 *
 * Un rol que solo regía en una organización quitada también sale de `roles`.
 * No es un detalle: `roleAuthorizesInTenant` trata como excepción GLOBAL todo
 * código de `roles` que no figura en ningún ámbito, así que dejarlo mientras se
 * quita su ámbito lo volvería válido en todas las organizaciones que quedan.
 *
 * @param authority - Autoridad completa de la persona.
 * @param deniedTenantIds - Organizaciones que niegan.
 * @returns La autoridad sin esas organizaciones.
 */
export function withoutTenants(
  authority: SessionAuthority,
  deniedTenantIds: readonly string[],
): {
  roles: string[];
  scopedRoles: Record<string, string[]>;
  tenants: string[];
} {
  const gone = new Set(deniedTenantIds);
  const tenants = authority.tenants.filter((id) => !gone.has(id));
  const scopedRoles: Record<string, string[]> = {};
  const removedCodes = new Set<string>();
  for (const [tenantId, codes] of Object.entries(authority.scopedRoles)) {
    if (gone.has(tenantId)) {
      for (const code of codes) removedCodes.add(code);
    } else {
      scopedRoles[tenantId] = [...codes];
    }
  }
  const stillScoped = new Set(Object.values(scopedRoles).flat());
  const roles = authority.roles.filter(
    (role) => !removedCodes.has(role) || stillScoped.has(role),
  );
  return { roles, scopedRoles, tenants };
}

/**
 * ¿Quedan organizaciones a las que la persona pueda entrar? Si no queda
 * ninguna —todas niegan o la única niega— el acceso se rechaza como siempre:
 * no hay otra organización a la que dejarla entrar.
 *
 * @param tenantIds - Organizaciones activas de la persona.
 * @param denied - Organizaciones que niegan, con su motivo.
 * @returns `true` si hay organizaciones y todas niegan.
 */
export function everyTenantDenied(
  tenantIds: readonly string[],
  denied: Readonly<Record<string, string>>,
): boolean {
  return tenantIds.length > 0 && tenantIds.every((id) => id in denied);
}
