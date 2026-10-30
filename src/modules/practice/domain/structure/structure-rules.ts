import {
  FUNCTION_PROFILE_BY_CODE,
  ROOT_FORMS,
  type FormCode,
  type ParentRule,
  type TypologyRule,
} from './structure-catalog';

/**
 * Reglas puras del árbol físico (F1). Cada función devuelve un **veredicto**;
 * traducirlo a una excepción HTTP con su `reason` es trabajo de la capa de
 * aplicación (`docs/architecture/module-layout.md`, «Trampas»).
 */

/** Resultado de una regla. */
export type Verdict =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: string;
      readonly details: Record<string, unknown>;
    };

const OK: Verdict = { ok: true };

function fail(reason: string, details: Record<string, unknown>): Verdict {
  return { ok: false, reason, details };
}

/**
 * ¿Puede una forma colgar de otra?
 *
 * @param parentForm - Forma del padre, o `null` si el espacio va en la raíz.
 * @param childForm - Forma del espacio.
 * @param rules - Reglas vigentes (de la tabla `space_form_parent_rules`).
 */
export function judgeParentChild(
  parentForm: FormCode | null,
  childForm: FormCode,
  rules: readonly ParentRule[],
): Verdict {
  if (parentForm === null) {
    return ROOT_FORMS.includes(childForm)
      ? OK
      : fail('SPACE_PARENT_RULE_VIOLATION', {
          parentFormCode: null,
          formCode: childForm,
          allowed: [...ROOT_FORMS],
        });
  }
  if (rules.some((r) => r.parent === parentForm && r.child === childForm)) {
    return OK;
  }
  return fail('SPACE_PARENT_RULE_VIOLATION', {
    parentFormCode: parentForm,
    formCode: childForm,
    allowed: rules.filter((r) => r.parent === parentForm).map((r) => r.child),
  });
}

/**
 * ¿Admite la función esa forma? (perfil de función, contrato §2).
 *
 * @param functionCode - Código de la función.
 * @param formCode - Código de la forma.
 */
export function judgeFunctionForm(
  functionCode: string,
  formCode: FormCode,
): Verdict {
  const profile = FUNCTION_PROFILE_BY_CODE.get(functionCode);
  if (!profile) {
    return fail('SPACE_UNKNOWN_CODE', { field: 'functionCode', functionCode });
  }
  return profile.forms.includes(formCode)
    ? OK
    : fail('SPACE_FUNCTION_FORM_MISMATCH', {
        functionCode,
        formCode,
        allowedForms: [...profile.forms],
      });
}

/**
 * ¿Admite la tipología del establecimiento esa función?
 *
 * - Sin tipología declarada: no hay regla que aplicar.
 * - `TYPO_FORBIDDEN` para (tipología, función): no.
 * - Si la tipología tiene alguna `TYPO_ALLOWED`, actúa como lista blanca: la
 *   función tiene que estar como ALLOWED o REQUIRED.
 * - `TYPO_REQUIRED` nunca bloquea un alta: es lo que falta (ver
 *   `missingRequiredFunctions`).
 *
 * @param typologyCode - Tipología de la sede, o `null`.
 * @param functionCode - Función del espacio.
 * @param rules - Reglas vigentes (tabla `facility_typology_rules`).
 */
export function judgeTypology(
  typologyCode: string | null,
  functionCode: string,
  rules: readonly TypologyRule[],
): Verdict {
  if (!typologyCode) return OK;
  const own = rules.filter((r) => r.typology === typologyCode);
  const forbidden = own.some(
    (r) => r.function === functionCode && r.rule === 'TYPO_FORBIDDEN',
  );
  const whitelist = own.filter((r) => r.rule === 'TYPO_ALLOWED');
  const listed = own.some(
    (r) =>
      r.function === functionCode &&
      (r.rule === 'TYPO_ALLOWED' || r.rule === 'TYPO_REQUIRED'),
  );
  if (forbidden || (whitelist.length > 0 && !listed)) {
    return fail('SPACE_TYPOLOGY_FORBIDDEN', { typologyCode, functionCode });
  }
  return OK;
}

/**
 * Funciones obligatorias de la tipología que la sede todavía no tiene activas.
 *
 * @param typologyCode - Tipología de la sede.
 * @param presentFunctions - Funciones de los espacios no retirados.
 * @param rules - Reglas vigentes.
 */
export function missingRequiredFunctions(
  typologyCode: string | null,
  presentFunctions: ReadonlySet<string>,
  rules: readonly TypologyRule[],
): string[] {
  if (!typologyCode) return [];
  return rules
    .filter(
      (r) =>
        r.typology === typologyCode &&
        r.rule === 'TYPO_REQUIRED' &&
        !presentFunctions.has(r.function),
    )
    .map((r) => r.function);
}

/**
 * ¿Mover `nodeId` bajo `newParentId` cierra un ciclo?
 *
 * Sube desde el nuevo padre por `parentOf`; si llega a `nodeId`, el nodo
 * quedaría colgando de su propio descendiente. Corta en `parentOf.size + 1`
 * pasos para no colgarse si la base ya trajera un ciclo.
 *
 * @param nodeId - Espacio que se mueve.
 * @param newParentId - Nuevo padre, o `null` (raíz: nunca hay ciclo).
 * @param parentOf - `id → parentId` de todos los espacios de la sede.
 */
export function judgeNoCycle(
  nodeId: string,
  newParentId: string | null,
  parentOf: ReadonlyMap<string, string | null | undefined>,
): Verdict {
  let cursor: string | null | undefined = newParentId;
  const limit = parentOf.size + 1;
  for (let step = 0; cursor && step <= limit; step += 1) {
    if (cursor === nodeId) {
      return fail('SPACE_CYCLE', { spaceId: nodeId, parentSpaceId: newParentId });
    }
    cursor = parentOf.get(cursor) ?? null;
  }
  return OK;
}

/**
 * Ids de todos los descendientes de `rootId`.
 *
 * @param rootId - Espacio raíz.
 * @param childrenOf - `parentId → hijos`.
 */
export function descendantsOf(
  rootId: string,
  childrenOf: ReadonlyMap<string, readonly string[]>,
): string[] {
  const out: string[] = [];
  const stack = [...(childrenOf.get(rootId) ?? [])];
  const seen = new Set<string>([rootId]);
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    stack.push(...(childrenOf.get(id) ?? []));
  }
  return out;
}
