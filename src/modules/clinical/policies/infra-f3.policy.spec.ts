import {
  IMPLIED_ROLES,
  INFRA_F3_ACTIONS,
  INFRA_F3_POLICY,
  INFRA_OPERATIONAL_ROLE_CONCEPTS,
  type InfraF3Action,
} from './infra-f3.policy';

const allowed = (action: InfraF3Action) => {
  const rule = INFRA_F3_POLICY[action];
  return [...rule.operational, ...rule.admin].sort();
};

describe('política de F3 (matriz de permisos del contrato)', () => {
  it('toda acción declarada tiene regla', () => {
    for (const action of Object.values(INFRA_F3_ACTIONS)) {
      expect(INFRA_F3_POLICY[action]).toBeDefined();
    }
  });

  it('operar camas (ingreso, asignar, trasladar, egreso, cancelar): Enfermería y Admisión; nadie más', () => {
    for (const action of [
      INFRA_F3_ACTIONS.ADMIT,
      INFRA_F3_ACTIONS.ASSIGN_BED,
      INFRA_F3_ACTIONS.TRANSFER,
      INFRA_F3_ACTIONS.DISCHARGE,
      INFRA_F3_ACTIONS.CANCEL,
      INFRA_F3_ACTIONS.COMPATIBILITY_CHECK,
    ]) {
      expect(allowed(action)).toEqual([
        'ADMISSION',
        'NURSE',
        'NURSE_SUPERVISOR',
      ]);
    }
  });

  it('separación de funciones: ningún administrador de estructura, ni Limpieza, Mantenimiento o Facturación, opera camas', () => {
    for (const action of [
      INFRA_F3_ACTIONS.ADMIT,
      INFRA_F3_ACTIONS.TRANSFER,
      INFRA_F3_ACTIONS.DISCHARGE,
      INFRA_F3_ACTIONS.OVERRIDE,
      INFRA_F3_ACTIONS.INPATIENT_VIEW,
    ]) {
      const rule = INFRA_F3_POLICY[action];
      expect(rule.admin).toEqual([]);
      expect(rule.operational).not.toContain('BILLING');
    }
    for (const rule of Object.values(INFRA_F3_POLICY)) {
      // Limpieza no figura en ninguna acción de F3
      expect(Object.keys(INFRA_OPERATIONAL_ROLE_CONCEPTS)).not.toContain(
        'HOUSEKEEPING',
      );
      expect(rule.operational as readonly string[]).not.toContain(
        'HOUSEKEEPING',
      );
    }
  });

  it('forzar la compatibilidad: sólo supervisión de enfermería; la cohorte, además, control de infecciones', () => {
    expect(allowed(INFRA_F3_ACTIONS.OVERRIDE)).toEqual(['NURSE_SUPERVISOR']);
    expect(allowed(INFRA_F3_ACTIONS.COHORT_APPROVAL)).toEqual([
      'INFECTION_CONTROL',
    ]);
  });

  it('censo: ver lo ven administración, plataforma (sólo lectura), enfermería, admisión y facturación', () => {
    expect(allowed(INFRA_F3_ACTIONS.CENSUS_VIEW)).toEqual(
      [
        'BILLING',
        'BRANCH_ADMIN',
        'ADMISSION',
        'NURSE',
        'NURSE_SUPERVISOR',
        'ORG_ADMIN',
        'PLATFORM',
      ].sort(),
    );
    expect(allowed(INFRA_F3_ACTIONS.INDICATORS_VIEW)).toEqual(
      allowed(INFRA_F3_ACTIONS.CENSUS_VIEW),
    );
  });

  it('censo: cerrar (supervisión, admisión, admin) y ajustar (supervisión, admin); plataforma nunca escribe', () => {
    expect(allowed(INFRA_F3_ACTIONS.CENSUS_CLOSE)).toEqual(
      ['ADMISSION', 'BRANCH_ADMIN', 'NURSE_SUPERVISOR', 'ORG_ADMIN'].sort(),
    );
    expect(allowed(INFRA_F3_ACTIONS.CENSUS_ADJUST)).toEqual(
      ['BRANCH_ADMIN', 'NURSE_SUPERVISOR', 'ORG_ADMIN'].sort(),
    );
    for (const action of Object.values(INFRA_F3_ACTIONS)) {
      if (
        action !== INFRA_F3_ACTIONS.CENSUS_VIEW &&
        action !== INFRA_F3_ACTIONS.INDICATORS_VIEW
      ) {
        expect(INFRA_F3_POLICY[action].admin).not.toContain('PLATFORM');
      }
    }
  });

  it('el incidente lo revisan supervisión de enfermería y control de infecciones', () => {
    expect(allowed(INFRA_F3_ACTIONS.INCIDENT_REVIEW)).toEqual([
      'INFECTION_CONTROL',
      'NURSE_SUPERVISOR',
    ]);
  });

  it('la supervisión implica el rol de piso', () => {
    expect(IMPLIED_ROLES.NURSE_SUPERVISOR).toEqual(['NURSE']);
  });
});
