import type {
  GovernanceRuleFacts,
  SupportAccessFacts,
} from './support-access-context';
import {
  atomsOfGrant,
  denyApplies,
  evaluateCandidate,
  isUnreadableFor,
  ruleApplies,
  type Pair,
} from './support-access.candidates';
import type {
  EngagementFacts,
  FieldVisibility,
  SupportAccessQuery,
} from './support-access.types';
import {
  mostMasked,
  mostRevealing,
  type FieldMaskStrategy,
} from './support-field-mask';
import { PERMISSION_ATOMS } from './support-permission-catalog';

const FIELD_ATOMS = PERMISSION_ATOMS.filter((a) => a.isFieldLevel);

/**
 * Campos visibles: para cada átomo de campo, el menos enmascarado entre los
 * permisos aplicables que lo conceden, nunca más que el piso de la
 * organización; una `DENY` o regla que alcanza al campo lo quita; un campo que
 * ningún permiso aplicable concede se anula (no figura).
 */
export function visibleFieldsOf(
  liveGrants: readonly Pair[],
  ready: readonly EngagementFacts[],
  query: SupportAccessQuery,
  facts: SupportAccessFacts | undefined,
  rules: readonly GovernanceRuleFacts[],
  now: Date,
  tz: string | undefined,
): Readonly<Record<string, FieldVisibility>> {
  const out: Record<string, FieldVisibility> = {};
  const q = query;
  for (const field of FIELD_ATOMS) {
    const code = field.code;
    if (
      rules.some(
        (r) => r.kind === 'DENY_PERMISSION' && ruleApplies(r, code, ready),
      )
    )
      continue;
    const denied = liveGrants.some(
      (p) =>
        p.g.effect === 'DENY' &&
        atomsOfGrant(p.g).has(code) &&
        denyApplies(p, code, q, facts, now, tz),
    );
    if (denied) continue;
    const masks: FieldMaskStrategy[] = [];
    for (const pair of liveGrants) {
      if (
        pair.g.effect === 'DENY' ||
        !atomsOfGrant(pair.g).has(code) ||
        isUnreadableFor(pair.g, code)
      )
        continue;
      const candidate = evaluateCandidate(
        pair,
        code,
        q,
        facts,
        rules,
        now,
        tz,
        true,
      );
      if (candidate.unmet.length > 0) continue;
      const own = candidate.runs
        .map((r) => r.result.fields[code])
        .filter((m): m is NonNullable<typeof m> => !!m);
      masks.push(own.length > 0 ? mostMasked(own) : 'FULL');
    }
    if (masks.length === 0) continue;
    let visible = mostRevealing(masks);
    const floors = rules
      .filter(
        (r) =>
          r.kind === 'FIELD_FLOOR' &&
          r.maxVisibility &&
          ruleApplies(r, code, ready),
      )
      .map((r) => r.maxVisibility as FieldMaskStrategy);
    if (floors.length > 0) visible = mostMasked([visible, mostMasked(floors)]);
    out[code] = visible as FieldVisibility;
  }
  return out;
}
