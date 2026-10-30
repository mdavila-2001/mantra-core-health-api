/**
 * Deriva de permisos: lo que las rutas **exigen** (`@Roles(...)`) contra lo que existe para
 * asignarse (los roles que la API siembra desde sus `*.roles.ts` y los que ya están en
 * `authz.roles`).
 *
 * Es lógica pura, sin Nest ni base: la usa el servicio de la consola
 * (`GET /admin/catalog/permission-drift`) y puede usarla un script de CI con las mismas entradas.
 * Tres hallazgos:
 * - **usedNotSeeded**: una ruta exige un rol que nadie siembra. Mientras no exista en
 *   `authz.roles`, sólo `SUPERADMIN` (por comodín) puede ejercer esa ruta.
 * - **seededNotUsed**: un rol sembrado que ninguna ruta exige: se asigna y no autoriza nada.
 * - **routesWithoutRoles**: rutas autenticadas que no declaran `@Roles` ni son públicas: las pasa
 *   cualquier sesión.
 */

/** Lo que la deriva necesita saber de una ruta. */
export interface DriftRoute {
  method: string;
  template: string;
  controller: string;
  handler: string;
  roles: readonly string[] | null;
  isPublic: boolean;
}

export interface DriftInput {
  routes: readonly DriftRoute[];
  /** Códigos que la API siembra en `authz.roles` (`SYSTEM_ROLE_SEED`, de los `*.roles.ts`). */
  seededRoleCodes: readonly string[];
  /** Códigos que no se siembran en `authz.roles` pero existen: roles globales de `iam` y `SYSTEM`. */
  platformRoleCodes: readonly string[];
  /** Códigos presentes hoy en `authz.roles`; `null` si no se consultó la base. */
  databaseRoleCodes: readonly string[] | null;
}

export interface RouteRef {
  method: string;
  template: string;
  controller: string;
  handler: string;
}

export interface UsedNotSeeded {
  role: string;
  /** Cuántas rutas lo exigen. */
  routeCount: number;
  /** `true`/`false` si hay fila en `authz.roles`; `null` si no se consultó la base. */
  inDatabase: boolean | null;
  /** Hasta {@link SAMPLE_SIZE} rutas que lo exigen. */
  sample: RouteRef[];
}

export interface PermissionDriftReport {
  routes: {
    total: number;
    public: number;
    withRoles: number;
    /** Autenticadas sin `@Roles`: las pasa cualquier sesión. */
    withoutRoles: number;
  };
  usedNotSeeded: UsedNotSeeded[];
  seededNotUsed: string[];
  routesWithoutRoles: RouteRef[];
}

/** Cuántas rutas de ejemplo trae cada rol usado sin sembrar. */
export const SAMPLE_SIZE = 5;

const refOf = (r: DriftRoute): RouteRef => ({
  method: r.method,
  template: r.template,
  controller: r.controller,
  handler: r.handler,
});

const porRuta = (a: RouteRef, b: RouteRef): number =>
  a.template.localeCompare(b.template) || a.method.localeCompare(b.method);

/** Calcula la deriva. Determinista: listas ordenadas, mismas entradas, mismo informe. */
export function computePermissionDrift(
  input: DriftInput,
): PermissionDriftReport {
  const sembrados = new Set(input.seededRoleCodes);
  const deSistema = new Set(input.platformRoleCodes);
  const enBase = input.databaseRoleCodes
    ? new Set(input.databaseRoleCodes)
    : null;

  const porRol = new Map<string, DriftRoute[]>();
  const sinRoles: RouteRef[] = [];
  let publicas = 0;
  let conRoles = 0;
  for (const ruta of input.routes) {
    if (ruta.isPublic) {
      publicas += 1;
      continue;
    }
    if (!ruta.roles?.length) {
      sinRoles.push(refOf(ruta));
      continue;
    }
    conRoles += 1;
    for (const rol of new Set(ruta.roles))
      porRol.set(rol, [...(porRol.get(rol) ?? []), ruta]);
  }

  const usadosSinSembrar: UsedNotSeeded[] = [...porRol]
    .filter(([rol]) => !sembrados.has(rol) && !deSistema.has(rol))
    .map(([rol, rutas]) => ({
      role: rol,
      routeCount: rutas.length,
      inDatabase: enBase ? enBase.has(rol) : null,
      sample: rutas.map(refOf).sort(porRuta).slice(0, SAMPLE_SIZE),
    }))
    .sort(
      (a, b) => b.routeCount - a.routeCount || a.role.localeCompare(b.role),
    );

  const sembradosSinUso = [...sembrados]
    .filter((rol) => !porRol.has(rol))
    .sort();

  return {
    routes: {
      total: input.routes.length,
      public: publicas,
      withRoles: conRoles,
      withoutRoles: sinRoles.length,
    },
    usedNotSeeded: usadosSinSembrar,
    seededNotUsed: sembradosSinUso,
    routesWithoutRoles: sinRoles.sort(porRuta),
  };
}

/** Clave `VERBO /plantilla` de una ruta, la que usa una lista de excepciones aceptadas. */
export const routeKey = (r: RouteRef): string => `${r.method} ${r.template}`;

/**
 * Un grupo de rutas sin `@Roles` cuya autorización se revisó y se decide en otro lugar (el servicio,
 * un guard propio, el sujeto de la sesión). Una ruta sin `@Roles` la pasa cualquier sesión
 * autenticada; que figure acá dice **quién** la autoriza de verdad y dónde se comprueba.
 */
export interface ReviewedRoutes {
  /** Por qué la ruta no necesita `@Roles`: qué la autoriza en su lugar. */
  reason: string;
  /** Dónde se comprueba (`ruta/del/archivo.ts#símbolo`), para poder auditar la afirmación. */
  evidence: readonly string[];
  /** Rutas del grupo (`VERBO /plantilla`). */
  routes: readonly string[];
}

export interface DriftAllowlist {
  /** Roles usados sin sembrar que se aceptan por ahora. */
  roles?: readonly string[];
  /**
   * Rutas sin `@Roles` que **no se revisaron** (`VERBO /plantilla`): deriva heredada, sin motivo.
   * Una ruta revisada pasa a {@link DriftAllowlist.reviewed}; la que se corrige sale de la lista.
   */
  routes?: readonly string[];
  /** Rutas sin `@Roles` revisadas, con el motivo y la evidencia de quién las autoriza. */
  reviewed?: readonly ReviewedRoutes[];
}

/** Longitud mínima del motivo de un grupo revisado: una palabra suelta no es un motivo. */
export const MIN_REASON_LENGTH = 20;

/** Todas las rutas aceptadas sin `@Roles`, revisadas o no. */
function acceptedRoutes(allow: DriftAllowlist): string[] {
  return [
    ...(allow.routes ?? []),
    ...(allow.reviewed ?? []).flatMap((group) => group.routes),
  ];
}

/**
 * Defectos de la propia lista de excepciones: un grupo revisado sin motivo o sin evidencia no
 * revisó nada, y una ruta repetida (o a la vez revisada y sin revisar) esconde cuál de las dos
 * afirmaciones vale.
 */
export function invalidAllowlist(allow: DriftAllowlist = {}): string[] {
  const problemas: string[] = [];
  for (const [i, group] of (allow.reviewed ?? []).entries()) {
    if (!group.reason || group.reason.trim().length < MIN_REASON_LENGTH)
      problemas.push(
        `grupo revisado #${i + 1} sin motivo (mínimo ${MIN_REASON_LENGTH} caracteres)`,
      );
    if (!group.evidence?.length || group.evidence.some((e) => !e.trim()))
      problemas.push(
        `grupo revisado #${i + 1} sin evidencia: ${group.reason?.slice(0, 40) ?? ''}`,
      );
    if (!group.routes?.length)
      problemas.push(`grupo revisado #${i + 1} sin rutas`);
  }
  const vistas = new Set<string>();
  for (const ruta of acceptedRoutes(allow)) {
    if (vistas.has(ruta)) problemas.push(`ruta repetida en la lista: ${ruta}`);
    vistas.add(ruta);
  }
  return problemas;
}

/**
 * Lo que un gate de CI debería rechazar: deriva que no figura en la lista de excepciones. Vacío
 * significa que no hay deriva nueva. Los sembrados sin uso no bloquean: un rol puede existir antes
 * de la ruta que lo exige.
 */
export function blockingDrift(
  report: PermissionDriftReport,
  allow: DriftAllowlist = {},
): string[] {
  const rolesOk = new Set(allow.roles ?? []);
  const rutasOk = new Set(acceptedRoutes(allow));
  return [
    ...report.usedNotSeeded
      .filter((u) => !rolesOk.has(u.role))
      .map((u) => `rol usado sin sembrar: ${u.role} (${u.routeCount} rutas)`),
    ...report.routesWithoutRoles
      .filter((r) => !rutasOk.has(routeKey(r)))
      .map((r) => `ruta sin @Roles ni @Public: ${routeKey(r)}`),
  ];
}

/**
 * Excepciones que ya no hacen falta: figuran en la lista pero la deriva que aceptaban desapareció
 * (se sembró el rol, la ruta declaró `@Roles`). Un gate las rechaza para que la lista sólo pueda
 * encogerse: una excepción olvidada aceptaría de antemano la deriva que vuelva a aparecer.
 */
export function staleAllowlist(
  report: PermissionDriftReport,
  allow: DriftAllowlist = {},
): string[] {
  const rolesConDeriva = new Set(report.usedNotSeeded.map((u) => u.role));
  const rutasConDeriva = new Set(report.routesWithoutRoles.map(routeKey));
  return [
    ...(allow.roles ?? [])
      .filter((rol) => !rolesConDeriva.has(rol))
      .map(
        (rol) => `excepción obsoleta, el rol ya no está sin sembrar: ${rol}`,
      ),
    ...acceptedRoutes(allow)
      .filter((ruta) => !rutasConDeriva.has(ruta))
      .map(
        (ruta) =>
          `excepción obsoleta, la ruta ya declara @Roles o @Public: ${ruta}`,
      ),
  ];
}
