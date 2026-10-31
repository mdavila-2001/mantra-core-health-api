import { atomMatchesPattern } from './support-permission-catalog';
import { grantsOverlap, type GrantTargetFacts } from './support-grant-targets';

/**
 * Qué átomos de administración tiene HOY una persona (SEG A-A5): UNA sola
 * función que usan la administración delegada (`/org/team/*`), las rutas de
 * gobierno (resumen, efectivo, explicar, reportes, campañas, exportaciones) y
 * la elegibilidad como jefe de servicio en cuatro ojos. Aplica, en este orden:
 *
 * 1. vigencia del vínculo (activo, membresía viva, recertificación al día): un
 *    vínculo suspendido o con la recertificación vencida no administra ni lee;
 * 2. solo concesiones `ALLOW` vivas;
 * 3. prohibiciones `DENY` explícitas del administrador de seguridad: un átomo
 *    prohibido sobre un objetivo que se cruza con el del permiso se descarta
 *    (fail-closed: una prohibición sobre `team.grants.assign` apaga el átomo);
 * 4. reglas `DENY_PERMISSION` de la organización (L1), de la plantilla de la
 *    persona o de todas.
 *
 * Las condiciones (`time`, `network`, …) no existen en átomos de
 * administración: el validador las rechaza al guardar (`isGovernanceAtom`).
 */

/** Concesión de la persona reducida a lo que esta función necesita. */
export interface AdminGrantInput<T> {
  /** Lo que el llamador quiere recuperar (la concesión original). */
  readonly ref: T;
  readonly target: GrantTargetFacts;
  /** Átomos que da (alias ya expandidos). */
  readonly atoms: readonly string[];
  readonly effect: 'ALLOW' | 'DENY';
  /** ¿Activa y dentro de su vigencia? */
  readonly live: boolean;
}

/** Regla `DENY_PERMISSION` de la organización. */
export interface AdminDenyRule {
  /** Plantilla a la que aplica; ausente = todas. */
  readonly roleTemplateCode?: string | null;
  readonly permissionPattern: string;
}

/**
 * ¿El átomo es de administración de accesos? Equipo (`team.*`) y las consultas
 * de gobierno (`audit.decisions.*`, `audit.reports.*`): ninguna de sus rutas
 * evalúa condiciones del permiso. La actividad (`audit.activity.*`) y los
 * reportes operativos (`reports.*`) tampoco se condicionan hoy, pero no son
 * átomos de administración: ver `isUnevaluatedConditionAtom`.
 */
export function isGovernanceAtom(atom: string): boolean {
  return (
    atom.startsWith('team.') ||
    atom.startsWith('audit.decisions.') ||
    atom.startsWith('audit.reports.')
  );
}

/**
 * ¿Ninguna ruta evalúa las condiciones de este átomo? (N-8). Los de
 * administración (`isGovernanceAtom`) más la actividad (`audit.activity.*`) y
 * los reportes operativos (`reports.*`): sus rutas no leen el `condition_json`
 * del permiso, así que guardarlo daría una falsa sensación de control. Se
 * rechaza al guardar hasta que exista un consumidor que las evalúe.
 */
export function isUnevaluatedConditionAtom(atom: string): boolean {
  return (
    isGovernanceAtom(atom) ||
    atom.startsWith('audit.activity.') ||
    atom.startsWith('reports.')
  );
}

/**
 * Concesiones que dan átomos de administración vivos, con los átomos que
 * sobreviven a las prohibiciones.
 *
 * @param input - Vínculo, concesiones y reglas.
 * @returns Una entrada por concesión `ALLOW` viva que conserva algún átomo.
 */
export function liveAdminAtoms<T>(input: {
  readonly engagementLive: boolean;
  readonly templateCode?: string | null;
  readonly grants: readonly AdminGrantInput<T>[];
  readonly denyRules?: readonly AdminDenyRule[];
}): Array<{ readonly ref: T; readonly atoms: string[] }> {
  if (!input.engagementLive) return [];
  const rules = (input.denyRules ?? []).filter(
    (r) => !r.roleTemplateCode || r.roleTemplateCode === input.templateCode,
  );
  const denies = input.grants.filter((g) => g.live && g.effect === 'DENY');
  const out: Array<{ ref: T; atoms: string[] }> = [];
  for (const g of input.grants) {
    if (!g.live || g.effect === 'DENY') continue;
    const atoms = g.atoms.filter(
      (atom) =>
        !rules.some((r) => atomMatchesPattern(atom, r.permissionPattern)) &&
        !denies.some(
          (d) => d.atoms.includes(atom) && grantsOverlap(g.target, d.target),
        ),
    );
    if (atoms.length > 0) out.push({ ref: g.ref, atoms });
  }
  return out;
}
