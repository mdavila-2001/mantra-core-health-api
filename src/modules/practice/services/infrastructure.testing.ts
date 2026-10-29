import { jest } from '@jest/globals';
import {
  FORMS,
  FUNCTIONS,
  PARENT_RULE_SEEDS,
  REGULATORY,
  TYPOLOGY_RULE_SEEDS,
} from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import type { RuleSet } from './infrastructure-rules';

/** `jest.fn` sin la fricción de tipos de los dobles de estas pruebas. */
export const mockFn = (impl?: any): any => (jest.fn as any)(impl);

export const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
export const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
export const actor = { id: 'admin-1', roles: ['USER'] } as any;

/** Las reglas tal como las dejaría el seed en la base. */
export function ruleSet(): RuleSet {
  const parentChildren = new Map<string, Set<string>>();
  for (const rule of PARENT_RULE_SEEDS) {
    parentChildren.set(
      FORMS.byInput(rule.parent)!.id,
      new Set(rule.children.map((c) => FORMS.byInput(c)!.id)),
    );
  }
  const typologyAllowed = new Map<string, Set<string>>();
  const typologyRequired = new Map<string, Set<string>>();
  for (const row of TYPOLOGY_RULE_SEEDS) {
    const target =
      row.rule === 'TYPO_ALLOWED' ? typologyAllowed : typologyRequired;
    const typologyId = REGULATORY.typology.byInput(row.typology)!.id;
    target.set(
      typologyId,
      (target.get(typologyId) ?? new Set()).add(FUNCTIONS.byInput(row.fn)!.id),
    );
  }
  return { parentChildren, typologyAllowed, typologyRequired };
}

/** Un espacio con valores por omisión razonables (local genérico planificado). */
export function makeSpace(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'sp-1',
    tenantId: TENANT_A,
    practiceSiteId: 's1',
    code: 'C-1',
    name: 'Espacio',
    formConceptId: FORMS.byInput('ROOM')!.id,
    spaceTypeConceptId: FUNCTIONS.byInput('GENERIC')!.id,
    statusConceptId: PRAC.SPACE_PLANNED,
    operationalStatusConceptId: PRAC.SPACE_OP_AVAILABLE,
    rowVersion: 1,
    createdAt: new Date('2026-10-01T00:00:00Z'),
    updatedAt: new Date('2026-10-01T00:00:00Z'),
    ...overrides,
  };
}

/** Una sede activa del tenant A. */
export function makeSite(overrides: Record<string, unknown> = {}): any {
  return {
    id: 's1',
    practiceId: 'p1',
    tenantId: TENANT_A,
    branchId: null,
    code: 'SEDE',
    name: 'Sede',
    statusConceptId: PRAC.SITE_ACTIVE,
    rowVersion: 1,
    ...overrides,
  };
}

/** Detalle mínimo que devuelve el lector doble. */
export const detailStub = (space: any): any => ({
  id: space.id,
  code: space.code,
  rowVersion: space.rowVersion,
});
