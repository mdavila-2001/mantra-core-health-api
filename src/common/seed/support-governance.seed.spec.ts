import { jest } from '@jest/globals';
import { DELEG } from '../../modules/delegated_access/delegated_access.concepts';
import {
  SOD_PLATFORM_RULES,
  SUPPORT_TEMPLATE_CODES,
  SUPPORT_TEMPLATE_DEFAULTS_V2,
  TEMPLATE_CEILINGS,
  platformTemplateId,
  validateCondition,
} from '../../modules/delegated_access/domain';
import {
  platformTemplateIdV2,
  seedSupportGovernance,
  sodRuleSeedId,
  templateDefaultConditions,
} from './support-governance.seed';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

interface Fila {
  [k: string]: any;
}

function build(existentes: Record<string, Fila[]> = {}) {
  const tablas: Record<string, Fila[]> = {
    SodRules: [],
    RoleTemplates: [],
    ...existentes,
  };
  const creadas: { entity: string; data: Fila }[] = [];
  const coincide = (fila: Fila, where: Fila): boolean =>
    Object.entries(where).every(([k, v]) =>
      v && typeof v === 'object' && '$in' in v
        ? (v.$in as unknown[]).includes(fila[k])
        : fila[k] === v,
    );
  const em = {
    find: mockFn((entity: any, where: Fila = {}) =>
      Promise.resolve(
        (tablas[entity.name] ?? []).filter((f) => coincide(f, where)),
      ),
    ),
    create: mockFn((entity: any, data: Fila) => {
      creadas.push({ entity: entity.name, data });
      (tablas[entity.name] ??= []).push(data);
      return data;
    }),
  };
  return { em, creadas, tablas };
}
const de = (c: { entity: string; data: Fila }[], e: string): Fila[] =>
  c.filter((x) => x.entity === e).map((x) => x.data);
const NOW = new Date('2026-11-03T00:00:00Z');

describe('seedSupportGovernance', () => {
  it('en una base vacía siembra las 11 reglas SoD y las 7 plantillas v2', async () => {
    const { em, creadas } = build();
    const out = await seedSupportGovernance(em as never, NOW);
    expect(de(creadas, 'SodRules')).toHaveLength(11);
    expect(de(creadas, 'RoleTemplates')).toHaveLength(7);
    expect(out.inserted).toBe(18);
  });

  it('las reglas llevan su id determinista, sin organización, y las duras no llevan días de excepción', async () => {
    const { em, creadas } = build();
    await seedSupportGovernance(em as never, NOW);
    const rules = de(creadas, 'SodRules');
    expect(rules.map((r) => r.id).sort()).toEqual(
      SOD_PLATFORM_RULES.map((r) => sodRuleSeedId(r.code)).sort(),
    );
    expect(rules.every((r) => r.tenantId === undefined)).toBe(true);
    const hard = rules.filter((r) => r.isHard);
    expect(hard).toHaveLength(6);
    expect(hard.every((r) => r.maxExceptionDays === undefined)).toBe(true);
    const bill03 = rules.find((r) => r.code === 'SOD-BILL-03')!;
    expect(bill03).toMatchObject({
      maxExceptionDays: 90,
      scopeConceptId: DELEG.SOD_SCOPE_PERSON,
      actionConceptId: DELEG.SOD_ACTION_REQUIRE_APPROVAL,
    });
    expect(bill03.atomsAJson).toEqual([
      'agenda.appointment.create',
      'agenda.appointment.walk_in',
    ]);
  });

  it('las plantillas v2 traen paquete en átomos, techo y la condición por defecto del motivo', async () => {
    const { em, creadas } = build();
    await seedSupportGovernance(em as never, NOW);
    const templates = de(creadas, 'RoleTemplates');
    expect(templates.map((t) => t.id).sort()).toEqual(
      SUPPORT_TEMPLATE_CODES.map((c) => platformTemplateIdV2(c)).sort(),
    );
    for (const code of SUPPORT_TEMPLATE_CODES) {
      const row = templates.find((t) => t.code === code)!;
      expect(row.versionNumber).toBe(2);
      expect(row.statusConceptId).toBe(DELEG.ROLE_TEMPLATE_ACTIVE);
      expect(row.defaultActionsJson).toEqual([
        ...SUPPORT_TEMPLATE_DEFAULTS_V2[code],
      ]);
      expect(row.ceilingActionsJson).toEqual([...TEMPLATE_CEILINGS[code]]);
    }
    expect(
      templates.find((t) => t.code === 'SECRETARY')!.defaultConditionsJson,
    ).toEqual(templateDefaultConditions('SECRETARY'));
    expect(
      templates.find((t) => t.code === 'BILLING_CASHIER')!
        .defaultConditionsJson,
    ).toBeNull();
    expect(
      templates.find((t) => t.code === 'NURSING')!.defaultConditionsJson,
    ).not.toBeNull();
  });

  it('es idempotente: la segunda pasada no inserta ni cambia nada', async () => {
    const { em } = build();
    await seedSupportGovernance(em as never, NOW);
    const again = await seedSupportGovernance(em as never, NOW);
    expect(again).toEqual({ inserted: 0, updated: 0 });
  });

  it('retira las plantillas v1 de plataforma sin borrarlas, una sola vez', async () => {
    const v1 = SUPPORT_TEMPLATE_CODES.map((code) => ({
      id: platformTemplateId(code),
      code,
      tenantId: undefined,
      versionNumber: 1,
      statusConceptId: DELEG.ROLE_TEMPLATE_ACTIVE,
    }));
    const { em, tablas } = build({ RoleTemplates: v1 });
    const first = await seedSupportGovernance(em as never, NOW);
    expect(
      tablas.RoleTemplates.filter((t) => t.versionNumber === 1).every(
        (t) => t.statusConceptId === DELEG.ROLE_TEMPLATE_RETIRED,
      ),
    ).toBe(true);
    expect(tablas.RoleTemplates).toHaveLength(14);
    expect(first.updated).toBe(7);
    const second = await seedSupportGovernance(em as never, NOW);
    expect(second.updated).toBe(0);
  });

  it('alinea una regla de plataforma cuyo catálogo cambió y no toca las de una organización', async () => {
    const stale = {
      id: sodRuleSeedId('SOD-BILL-04'),
      code: 'SOD-BILL-04',
      tenantId: undefined,
      name: 'Nombre viejo',
      atomsAJson: [],
      atomsBJson: [],
      isHard: false,
    };
    const org = {
      id: 'org-rule',
      code: 'ORG-1',
      tenantId: 'tenant-1',
      name: 'Mía',
    };
    const { em } = build({ SodRules: [stale, org] });
    const out = await seedSupportGovernance(em as never, NOW);
    expect(stale.name).toBe('Descontar y cobrar');
    expect(org.name).toBe('Mía');
    expect(out.updated).toBe(1);
  });
});

describe('SEG A-M6 · D-12: los permisos de plantilla nuevos excluyen VIP y CONFIDENTIAL en cancelar y ver motivo', () => {
  const EXCLUDE = { exclude: { flags: ['VIP', 'CONFIDENTIAL'] } };

  it.each(
    SUPPORT_TEMPLATE_CODES.filter((code) =>
      SUPPORT_TEMPLATE_DEFAULTS_V2[code].includes('agenda.appointment.cancel'),
    ),
  )('%s: la condición por defecto de cancelar excluye las banderas', (code) => {
    const conditions = templateDefaultConditions(code)!;
    expect(conditions['agenda.appointment.cancel']).toMatchObject({
      schemaVersion: 1,
      patients: EXCLUDE,
    });
  });

  it.each(
    SUPPORT_TEMPLATE_CODES.filter((code) =>
      SUPPORT_TEMPLATE_DEFAULTS_V2[code].includes(
        'agenda.appointment.view.reason',
      ),
    ),
  )(
    '%s: ver motivo conserva la ventana y la máscara (D-01) y suma la exclusión',
    (code) => {
      const conditions = templateDefaultConditions(code)!;
      expect(conditions['agenda.appointment.view.reason']).toMatchObject({
        schemaVersion: 1,
        appointment: { window: { daysBefore: 1, daysAfter: 14 } },
        fields: { 'agenda.appointment.view.reason': { mask: 'PARTIAL' } },
        patients: EXCLUDE,
      });
    },
  );

  it('toda condición por defecto es válida para su átomo y no hay para plantillas sin esos permisos', () => {
    for (const code of SUPPORT_TEMPLATE_CODES) {
      const conditions = templateDefaultConditions(code);
      const atoms = SUPPORT_TEMPLATE_DEFAULTS_V2[code];
      const relevant = [
        'agenda.appointment.cancel',
        'agenda.appointment.view.reason',
      ].filter((a) => atoms.includes(a as never));
      if (relevant.length === 0) {
        expect(conditions).toBeNull();
        continue;
      }
      expect(Object.keys(conditions!).sort()).toEqual(relevant.sort());
      for (const [atom, condition] of Object.entries(conditions!)) {
        expect(
          validateCondition(condition, {
            atom,
            effect: 'ALLOW',
            grantAtoms: atoms,
          }),
        ).toEqual([]);
      }
    }
  });
});
