import {
  resolveVisibility,
  type ResolvedEntry,
  type ResolverRule,
  type ResolverSubject,
} from '../resolver/ui-visibility.resolver';
import type {
  RuleRecord,
  UiVisibilityStore,
} from '../repositories/ui-visibility.store';

export function toResolverRule(
  r: RuleRecord,
  elementKey: string,
): ResolverRule {
  return {
    id: r.id,
    elementKey,
    effect: r.effect,
    subjectType: r.subjectType,
    subjectId: r.subjectId,
    validFrom: r.validFrom,
    validTo: r.validTo,
    endedAt: r.endedAt,
    scopeTenantId: r.scopeTenantId,
  };
}

/**
 * Carga el catálogo y las reglas que podrían aplicar al sujeto y las pasa por el resolutor puro.
 * Es el único camino de resolución: `GET /me/ui-visibility` y la vista previa del administrador
 * lo comparten, así que «ver como» no puede divergir de lo que de verdad ve la persona.
 *
 * Los elementos RETIRED también entran: así un elemento retirado por error no se vuelve visible
 * para todos de un día para otro, y la cascada de sus descendientes se conserva.
 */
export async function resolveForSubject(
  store: UiVisibilityStore,
  subject: ResolverSubject,
  now: Date,
): Promise<ResolvedEntry[]> {
  const [elements, rules] = await Promise.all([
    store.listAllElements(),
    store.listOpenRulesForSubject(subject),
  ]);
  const keyById = new Map(elements.map((e) => [e.id, e.key]));
  return resolveVisibility(
    elements.map((e) => ({
      key: e.key,
      parentKey: e.parentElementId
        ? (keyById.get(e.parentElementId) ?? null)
        : null,
      defaultVisible: e.defaultVisible,
    })),
    rules.flatMap((r) => {
      const key = keyById.get(r.elementId);
      return key ? [toResolverRule(r, key)] : [];
    }),
    subject,
    now,
  );
}
