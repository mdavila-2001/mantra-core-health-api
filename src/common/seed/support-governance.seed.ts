import type { EntityManager } from '@mikro-orm/postgresql';
import { deterministicId } from '../constants/concepts';
import { CONCEPTS } from '../constants/concepts';
import {
  RoleTemplates,
  SodRules,
} from '../../modules/delegated_access/entities';
import { DELEG } from '../../modules/delegated_access/delegated_access.concepts';
import {
  SOD_PLATFORM_RULES,
  SUPPORT_TEMPLATE_CODES,
  SUPPORT_TEMPLATE_DEFAULTS_V2,
  SUPPORT_TEMPLATE_NAMES,
  TEMPLATE_CEILINGS,
  platformTemplateId,
  type SodAction,
  type SodRule,
  type SodScope,
  type SupportTemplateCode,
} from '../../modules/delegated_access/domain';

/**
 * Siembra de arranque del gobierno de accesos de apoyo (CONTRATO-GOBIERNO §6.3 y
 * §2.4): las 11 reglas SoD de plataforma y las 7 plantillas v2 (paquete por
 * defecto, techo y condiciones por defecto). Son datos de PLATAFORMA (sin
 * organización): se insertan por id determinista y, si el catálogo del código
 * cambia, se alinean. Idempotente; nunca toca filas de una organización.
 */

/** Condición por defecto del motivo de la cita en las plantillas de agenda (D-01). */
export const SUPPORT_REASON_DEFAULT_CONDITION = {
  schemaVersion: 1,
  appointment: { window: { daysBefore: 1, daysAfter: 14 } },
  fields: { 'agenda.appointment.view.reason': { mask: 'PARTIAL' } },
} as const;

/**
 * D-12 (SEG A-M6): pacientes con bandera `VIP` o `CONFIDENTIAL` quedan fuera de
 * los permisos de plantilla NUEVOS de cancelar y ver motivo. Sin esto las
 * banderas eran inertes: ningún permiso las nombraba y marcar a un paciente no
 * cambiaba nada. Quien necesite alcanzarlos recibe un permiso explícito sin la
 * exclusión (la decisión es del administrador, no un efecto lateral).
 */
export const SUPPORT_FLAGGED_PATIENTS_EXCLUSION = {
  exclude: { flags: ['VIP', 'CONFIDENTIAL'] },
} as const;

/** Plantillas que traen la condición por defecto del motivo (secretaría, asistente, enfermería). */
const TEMPLATES_WITH_REASON_CONDITION: ReadonlySet<string> = new Set([
  'SECRETARY',
  'MEDICAL_ASSISTANT',
  'NURSING',
]);

/** Condiciones por defecto de una plantilla (mapa átomo → condición), o `null` si no trae. */
export function templateDefaultConditions(
  code: SupportTemplateCode,
): Record<string, unknown> | null {
  const atoms: readonly string[] = SUPPORT_TEMPLATE_DEFAULTS_V2[code];
  const out: Record<string, unknown> = {};
  if (atoms.includes('agenda.appointment.cancel')) {
    out['agenda.appointment.cancel'] = {
      schemaVersion: 1,
      patients: SUPPORT_FLAGGED_PATIENTS_EXCLUSION,
    };
  }
  if (atoms.includes('agenda.appointment.view.reason')) {
    out['agenda.appointment.view.reason'] = {
      // D-01: ventana y máscara solo en las tres plantillas que traen el motivo.
      ...(TEMPLATES_WITH_REASON_CONDITION.has(code)
        ? SUPPORT_REASON_DEFAULT_CONDITION
        : { schemaVersion: 1 }),
      patients: SUPPORT_FLAGGED_PATIENTS_EXCLUSION,
    };
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** Id determinista de una regla SoD de plataforma. */
export function sodRuleSeedId(code: string, version = 1): string {
  return deterministicId(`seed:sod-rule:${code}:v${version}`);
}

/** Id determinista de la plantilla de plataforma v2. */
export function platformTemplateIdV2(code: SupportTemplateCode): string {
  return deterministicId(`seed:delegated-access-role-template:${code}:v2`);
}

const SCOPE_CONCEPT: Readonly<Record<SodScope, string>> = {
  PERSON: DELEG.SOD_SCOPE_PERSON,
  PERSON_OVERLAP: DELEG.SOD_SCOPE_PERSON_OVERLAP,
  TRANSACTION: DELEG.SOD_SCOPE_TRANSACTION,
};
const ACTION_CONCEPT: Readonly<Record<SodAction, string>> = {
  BLOCK: DELEG.SOD_ACTION_BLOCK,
  REQUIRE_APPROVAL: DELEG.SOD_ACTION_REQUIRE_APPROVAL,
  WARN: DELEG.SOD_ACTION_WARN,
};

/** Columnas de una regla de plataforma tal como las fija el código. */
function sodColumns(rule: SodRule): Record<string, unknown> {
  return {
    name: rule.name,
    atomsAJson: [...rule.atomsA],
    atomsBJson: [...rule.atomsB],
    scopeConceptId: SCOPE_CONCEPT[rule.scope],
    actionConceptId: ACTION_CONCEPT[rule.action],
    isHard: rule.isHard,
    // `ck_sod_rules_hard_no_exception`: una regla dura no lleva días de excepción.
    maxExceptionDays: rule.isHard
      ? undefined
      : (rule.maxExceptionDays ?? undefined),
    rationaleText: rule.rationale,
  };
}

const same = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Alinea una fila con las columnas del código; devuelve si cambió algo. */
function align(
  row: object,
  wanted: Record<string, unknown>,
  now: Date,
): boolean {
  const current = row as unknown as Record<string, unknown>;
  let changed = false;
  for (const [key, value] of Object.entries(wanted)) {
    if (same(current[key], value)) continue;
    current[key] = value;
    changed = true;
  }
  if (changed) current.updatedAt = now;
  return changed;
}

/**
 * Siembra las reglas SoD de plataforma y las plantillas v2; retira las v1 de
 * plataforma (siguen existiendo: los vínculos ya creados las conservan).
 *
 * @param em - Contexto de persistencia (el que luego hace `flush`).
 * @param now - Instante del arranque.
 * @returns Cuántas filas se insertaron y cuántas se alinearon o retiraron.
 */
export async function seedSupportGovernance(
  em: EntityManager,
  now: Date,
): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  const ruleIds = SOD_PLATFORM_RULES.map((r) => sodRuleSeedId(r.code));
  const rules = new Map(
    (await em.find(SodRules, { id: { $in: ruleIds } })).map((row) => [
      row.id,
      row,
    ]),
  );
  for (const rule of SOD_PLATFORM_RULES) {
    const id = sodRuleSeedId(rule.code);
    const existing = rules.get(id);
    if (existing) {
      if (!existing.tenantId && align(existing, sodColumns(rule), now))
        updated += 1;
      continue;
    }
    em.create(
      SodRules,
      {
        id,
        code: rule.code,
        ...sodColumns(rule),
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        versionNumber: 1,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    inserted += 1;
  }

  const v1 = new Map(
    (
      await em.find(RoleTemplates, {
        id: { $in: SUPPORT_TEMPLATE_CODES.map((c) => platformTemplateId(c)) },
      })
    ).map((row) => [row.id, row]),
  );
  const v2 = new Map(
    (
      await em.find(RoleTemplates, {
        id: { $in: SUPPORT_TEMPLATE_CODES.map((c) => platformTemplateIdV2(c)) },
      })
    ).map((row) => [row.id, row]),
  );
  for (const code of SUPPORT_TEMPLATE_CODES) {
    const columns = {
      name: SUPPORT_TEMPLATE_NAMES[code],
      defaultActionsJson: [...SUPPORT_TEMPLATE_DEFAULTS_V2[code]],
      defaultConditionsJson: templateDefaultConditions(code),
      ceilingActionsJson: [...TEMPLATE_CEILINGS[code]],
    };
    const id = platformTemplateIdV2(code);
    const existing = v2.get(id);
    if (existing) {
      if (!existing.tenantId && align(existing, columns, now)) updated += 1;
    } else {
      em.create(
        RoleTemplates,
        {
          id,
          code,
          ...columns,
          statusConceptId: DELEG.ROLE_TEMPLATE_ACTIVE,
          versionNumber: 2,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted += 1;
    }
    // La v2 es la vigente: la v1 se retira (no se borra).
    const old = v1.get(platformTemplateId(code));
    if (
      old &&
      !old.tenantId &&
      old.statusConceptId === DELEG.ROLE_TEMPLATE_ACTIVE
    ) {
      old.statusConceptId = DELEG.ROLE_TEMPLATE_RETIRED;
      old.updatedAt = now;
      updated += 1;
    }
  }
  return { inserted, updated };
}
