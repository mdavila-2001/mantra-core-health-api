import { createHash } from 'node:crypto';
import {
  hasProtectedRole,
  isProtectedElementKey,
  type UiRuleEffect,
  type UiRuleSubjectType,
} from '../ui-visibility.constants';

/**
 * Resolutor PURO de visibilidad (CONTRATO.md §Resolución). No toca base ni reloj: recibe el
 * catálogo, las reglas, el sujeto y el instante, y devuelve la decisión de cada elemento.
 *
 * La visibilidad NO es autorización: este resultado decide qué se presenta; la API autoriza
 * cada petición por su cuenta.
 *
 * Precedencia, exacta:
 *  1. Sólo cuentan las reglas vigentes (no terminadas, `validFrom <= now < validTo`) que
 *     aplican al sujeto: su usuario, su organización, alguno de sus roles, el tipo de su
 *     organización, o ALL; y, si la regla está acotada a una organización, sólo cuando el
 *     sujeto actúa en ella.
 *  2. Gana la más específica: USER > TENANT > ROLE > ORG_TYPE > ALL.
 *  3. En un empate de especificidad, HIDE gana a SHOW (también entre varios ROLE del usuario).
 *  4. Sin regla aplicable manda `defaultVisible`.
 *  5. Cascada: si un ancestro queda oculto, el descendiente queda oculto aunque tenga un SHOW
 *     propio.
 *  6. Anti-bloqueo: los elementos protegidos (`UI_PROTECTED_KEY_PREFIXES`) quedan SIEMPRE visibles
 *     para quien ejerce SUPERADMIN o SECURITY_ADMIN: se ignoran los HIDE, el `defaultVisible=false`
 *     y la cascada de ancestros. Es protección operativa, no de seguridad.
 */

/** Cuanto mayor, más específica. */
export const SPECIFICITY: Readonly<Record<UiRuleSubjectType, number>> = {
  USER: 5,
  TENANT: 4,
  ROLE: 3,
  ORG_TYPE: 2,
  ALL: 1,
};

export interface ResolverElement {
  readonly key: string;
  readonly parentKey: string | null;
  readonly defaultVisible: boolean;
}

export interface ResolverRule {
  readonly id: string;
  readonly elementKey: string;
  readonly effect: UiRuleEffect;
  readonly subjectType: UiRuleSubjectType;
  readonly subjectId: string | null;
  readonly validFrom: Date | null;
  readonly validTo: Date | null;
  readonly endedAt: Date | null;
  /**
   * Organización que acota la regla (`scope_tenant_id`). Una regla acotada sólo aplica cuando el
   * sujeto actúa en esa organización; `null`/ausente = regla de plataforma.
   */
  readonly scopeTenantId?: string | null;
}

export interface ResolverSubject {
  readonly userId: string | null;
  readonly tenantId: string | null;
  /** Códigos de los roles que el sujeto ejerce en ese tenant. */
  readonly roles: readonly string[];
  /** Código del tipo de la organización (`directory.tenants.tenant_type_concept_id`). */
  readonly orgType: string | null;
}

export type ResolvedReason = 'RULE' | 'DEFAULT' | 'ANCESTOR_HIDDEN';

export interface ResolvedEntry {
  readonly elementKey: string;
  readonly hidden: boolean;
  /** Regla ganadora; `null` si lo decide `defaultVisible` o la cascada de un ancestro. */
  readonly winningRuleId: string | null;
  readonly reason: ResolvedReason;
  /** Con `ANCESTOR_HIDDEN`: el ancestro más alto cuya propia decisión lo oculta. */
  readonly ancestorKey: string | null;
}

/** ¿La regla está en vigor en `now`? Inicio inclusive, fin exclusive; una regla terminada nunca. */
export function isRuleInForce(
  rule: Pick<ResolverRule, 'validFrom' | 'validTo' | 'endedAt'>,
  now: Date,
): boolean {
  const t = now.getTime();
  if (rule.endedAt !== null && rule.endedAt.getTime() <= t) return false;
  if (rule.validFrom !== null && rule.validFrom.getTime() > t) return false;
  if (rule.validTo !== null && rule.validTo.getTime() <= t) return false;
  return true;
}

/** ¿La regla aplica al sujeto? ALL a todos; el resto, por igualdad exacta del `subjectId`; y respetando el ámbito. */
export function ruleAppliesTo(
  rule: ResolverRule,
  subject: ResolverSubject,
): boolean {
  if (rule.scopeTenantId && rule.scopeTenantId !== subject.tenantId)
    return false;
  switch (rule.subjectType) {
    case 'ALL':
      return true;
    case 'USER':
      return subject.userId !== null && rule.subjectId === subject.userId;
    case 'TENANT':
      return subject.tenantId !== null && rule.subjectId === subject.tenantId;
    case 'ROLE':
      return rule.subjectId !== null && subject.roles.includes(rule.subjectId);
    case 'ORG_TYPE':
      return subject.orgType !== null && rule.subjectId === subject.orgType;
    default:
      // Un tipo desconocido (dato corrupto) no aplica a nadie: jamás oculta ni muestra por error.
      return false;
  }
}

/** Elige la regla ganadora entre las aplicables a un mismo elemento; `null` si no hay ninguna. */
export function pickWinningRule(
  applicable: readonly ResolverRule[],
): ResolverRule | null {
  let best: ResolverRule | null = null;
  for (const rule of applicable) {
    if (best === null || beats(rule, best)) best = rule;
  }
  return best;
}

/** `a` gana a `b`: más específica; a igual especificidad HIDE; a igual todo, el id menor (determinista). */
function beats(a: ResolverRule, b: ResolverRule): boolean {
  const sa = SPECIFICITY[a.subjectType] ?? 0;
  const sb = SPECIFICITY[b.subjectType] ?? 0;
  if (sa !== sb) return sa > sb;
  if (a.effect !== b.effect) return a.effect === 'HIDE';
  return a.id < b.id;
}

/**
 * Resuelve cada elemento del catálogo. Devuelve una entrada por elemento, ordenada por clave.
 * Las reglas de claves desconocidas se ignoran; un `parentKey` ausente corta la cadena; un ciclo
 * en la jerarquía (que la alta y el sync impiden) no cuelga el cálculo.
 */
export function resolveVisibility(
  elements: readonly ResolverElement[],
  rules: readonly ResolverRule[],
  subject: ResolverSubject,
  now: Date,
): ResolvedEntry[] {
  const byKey = new Map(elements.map((e) => [e.key, e]));
  const isAdmin = hasProtectedRole(subject.roles);
  const shielded = (key: string): boolean =>
    isAdmin && isProtectedElementKey(key);

  const applicableByKey = new Map<string, ResolverRule[]>();
  for (const rule of rules) {
    if (!byKey.has(rule.elementKey)) continue;
    if (!isRuleInForce(rule, now) || !ruleAppliesTo(rule, subject)) continue;
    const list = applicableByKey.get(rule.elementKey);
    if (list) list.push(rule);
    else applicableByKey.set(rule.elementKey, [rule]);
  }

  // Decisión propia de cada elemento, antes de la cascada.
  const own = new Map<string, { hidden: boolean; rule: ResolverRule | null }>();
  for (const element of elements) {
    if (shielded(element.key)) {
      // Se ignoran los HIDE: sólo un SHOW (o nada) puede decidir, y nunca oculta.
      const winner = pickWinningRule(
        (applicableByKey.get(element.key) ?? []).filter(
          (r) => r.effect === 'SHOW',
        ),
      );
      own.set(element.key, { hidden: false, rule: winner });
      continue;
    }
    const winner = pickWinningRule(applicableByKey.get(element.key) ?? []);
    own.set(
      element.key,
      winner
        ? { hidden: winner.effect === 'HIDE', rule: winner }
        : { hidden: !element.defaultVisible, rule: null },
    );
  }

  // Ancestro más alto oculto por decisión propia, con memoria por elemento.
  const topHiddenAncestor = new Map<string, string | null>();
  const ancestorOf = (key: string): string | null => {
    if (topHiddenAncestor.has(key)) return topHiddenAncestor.get(key) ?? null;
    const chain: string[] = [];
    const seen = new Set<string>([key]);
    let cursor = byKey.get(key)?.parentKey ?? null;
    while (cursor !== null && byKey.has(cursor) && !seen.has(cursor)) {
      chain.push(cursor);
      seen.add(cursor);
      cursor = byKey.get(cursor)?.parentKey ?? null;
    }
    // `chain` va del padre hacia la raíz: el último oculto es el más alto.
    let top: string | null = null;
    for (const ancestor of chain) {
      if (own.get(ancestor)?.hidden) top = ancestor;
    }
    topHiddenAncestor.set(key, top);
    return top;
  };

  return elements
    .map((element): ResolvedEntry => {
      const decision = own.get(element.key)!;
      if (decision.hidden) {
        return {
          elementKey: element.key,
          hidden: true,
          winningRuleId: decision.rule?.id ?? null,
          reason: decision.rule ? 'RULE' : 'DEFAULT',
          ancestorKey: null,
        };
      }
      const ancestor = shielded(element.key) ? null : ancestorOf(element.key);
      if (ancestor !== null) {
        return {
          elementKey: element.key,
          hidden: true,
          winningRuleId: null,
          reason: 'ANCESTOR_HIDDEN',
          ancestorKey: ancestor,
        };
      }
      return {
        elementKey: element.key,
        hidden: false,
        winningRuleId: decision.rule?.id ?? null,
        reason: decision.rule ? 'RULE' : 'DEFAULT',
        ancestorKey: null,
      };
    })
    .sort((a, b) =>
      a.elementKey < b.elementKey ? -1 : a.elementKey > b.elementKey ? 1 : 0,
    );
}

/** Claves ocultas, ordenadas (es lo único que viaja a `GET /me/ui-visibility`). */
export function hiddenKeysOf(entries: readonly ResolvedEntry[]): string[] {
  return entries
    .filter((e) => e.hidden)
    .map((e) => e.elementKey)
    .sort();
}

/**
 * Versión del conjunto oculto: huella estable de las claves ocultas ordenadas. Dos resoluciones
 * con el mismo conjunto dan la misma versión, así que el front puede cachear por ella.
 */
export function visibilityVersion(hiddenKeys: readonly string[]): string {
  return createHash('sha256')
    .update([...hiddenKeys].sort().join('\n'), 'utf8')
    .digest('hex')
    .slice(0, 16);
}
