import { jest } from '@jest/globals';
import { PRAC } from '../../practice/practice.concepts';
import type { CompatibilityViolation } from '../domain/bed-compatibility-rules';
import { AdtAccessService, type AdtScope } from './adt-access.service';
import { BedCompatibilityService } from './bed-compatibility.service';

const fn = (impl?: any): any => (jest.fn as any)(impl);

const scope = (...roles: string[]): AdtScope => ({
  tenantId: 't',
  siteId: 's',
  practiceId: 'p',
  branchId: null,
  operational: new Set(roles as any),
  admin: new Set(),
  access: { level: 'NONE', branchIds: new Set() },
});

const sex: CompatibilityViolation = {
  rule: 'SEX',
  severity: 'OVERRIDABLE',
  detail: 'x',
};
const cohort: CompatibilityViolation = {
  rule: 'ISOLATION_COHORT',
  severity: 'OVERRIDABLE',
  detail: 'x',
};
const hygiene: CompatibilityViolation = {
  rule: 'HYGIENE',
  severity: 'BLOCKING',
  detail: 'x',
};

const long = 'Justificación clínica de al menos veinte caracteres.';

function build() {
  // La política real: no se mockea, es lo que decide el 403.
  const access = new AdtAccessService({} as any);
  const service = new BedCompatibilityService(
    {} as any,
    {} as any,
    access,
    {} as any,
    {} as any,
  );
  return service;
}

describe('BedCompatibilityService.resolveOverride', () => {
  const service = build();
  const supervisor = scope('NURSE_SUPERVISOR', 'NURSE');

  it('sin incompatibilidades no hay nada que forzar (ni incidente)', () => {
    expect(service.resolveOverride([], undefined, scope('NURSE'))).toEqual([]);
    // aun si vino un override, sin violaciones no se abre incidente
    expect(
      service.resolveOverride(
        [],
        { justification: long, ruleCodes: ['SEX'] },
        supervisor,
      ),
    ).toEqual([]);
  });

  it('una bloqueante responde 409 BED_NOT_ASSIGNABLE aunque haya override', () => {
    expect(() =>
      service.resolveOverride(
        [hygiene, sex],
        { justification: long, ruleCodes: ['SEX', 'HYGIENE'] },
        supervisor,
      ),
    ).toThrow(
      expect.objectContaining({ reason: 'BED_NOT_ASSIGNABLE', status: 409 }),
    );
  });

  it('una forzable sin override responde 422 BED_COMPATIBILITY_OVERRIDE_REQUIRED con las violaciones', () => {
    try {
      service.resolveOverride([sex], undefined, supervisor);
      throw new Error('no lanzó');
    } catch (error: any) {
      expect(error.reason).toBe('BED_COMPATIBILITY_OVERRIDE_REQUIRED');
      expect(error.status).toBe(422);
      expect(error.details.violations).toEqual([sex]);
    }
  });

  it('el override tiene que cubrir todas las incompatibilidades', () => {
    expect(() =>
      service.resolveOverride(
        [sex, cohort],
        { justification: long, ruleCodes: ['SEX'] },
        supervisor,
      ),
    ).toThrow(
      expect.objectContaining({
        reason: 'BED_COMPATIBILITY_OVERRIDE_REQUIRED',
      }),
    );
  });

  it('reglas bloqueantes o desconocidas en ruleCodes: 422 OVERRIDE_RULE_NOT_OVERRIDABLE', () => {
    for (const rule of ['HYGIENE', 'ISOLATION_AIRBORNE', 'NADA']) {
      expect(() =>
        service.resolveOverride(
          [sex],
          { justification: long, ruleCodes: ['SEX', rule] },
          supervisor,
        ),
      ).toThrow(
        expect.objectContaining({ reason: 'OVERRIDE_RULE_NOT_OVERRIDABLE' }),
      );
    }
  });

  it('la justificación necesita 20 caracteres sin contar los espacios de los extremos', () => {
    for (const justification of [
      '',
      '   corta   ',
      '12345678901234567890'.slice(0, 19),
    ]) {
      expect(() =>
        service.resolveOverride(
          [sex],
          { justification, ruleCodes: ['SEX'] },
          supervisor,
        ),
      ).toThrow(
        expect.objectContaining({ reason: 'OVERRIDE_JUSTIFICATION_TOO_SHORT' }),
      );
    }
    expect(
      service.resolveOverride(
        [sex],
        { justification: `  ${'x'.repeat(20)}  `, ruleCodes: ['sex'] },
        supervisor,
      ),
    ).toEqual([sex]);
  });

  it('sólo supervisión de enfermería fuerza: enfermería y admisión reciben 403 INFRA_ACTION_NOT_ALLOWED', () => {
    for (const roles of [['NURSE'], ['ADMISSION'], []]) {
      try {
        service.resolveOverride(
          [sex],
          { justification: long, ruleCodes: ['SEX'] },
          scope(...roles),
        );
        throw new Error('no lanzó');
      } catch (error: any) {
        expect(error.status).toBe(403);
        expect(error.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
        expect(error.details.requiredRoles).toEqual(['NURSE_SUPERVISOR']);
      }
    }
  });

  it('la cohorte de aislamiento exige además el aval de control de infecciones', () => {
    const body = { justification: long, ruleCodes: ['ISOLATION_COHORT'] };
    try {
      service.resolveOverride([cohort], body, supervisor);
      throw new Error('no lanzó');
    } catch (error: any) {
      expect(error.status).toBe(403);
      expect(error.details.requiredRoles).toEqual(['INFECTION_CONTROL']);
    }
    expect(
      service.resolveOverride(
        [cohort],
        body,
        scope('NURSE_SUPERVISOR', 'INFECTION_CONTROL'),
      ),
    ).toEqual([cohort]);
  });
});

describe('BedCompatibilityService.assertBed', () => {
  it('sólo las camas (forma LOC_FORM_BED)', () => {
    const service = build();
    expect(() =>
      service.assertBed({ formConceptId: PRAC.LOC_FORM_ROOM } as any),
    ).toThrow(
      expect.objectContaining({ reason: 'SPACE_NOT_A_BED', status: 422 }),
    );
    expect(() => service.assertBed({ formConceptId: null } as any)).toThrow();
    expect(() =>
      service.assertBed({ formConceptId: PRAC.LOC_FORM_BED } as any),
    ).not.toThrow();
  });
});

void fn;
