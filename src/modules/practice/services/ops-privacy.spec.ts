import {
  CLINICAL_TEXT_ROLES,
  isClinicalText,
  visibleText,
} from './ops-privacy';

describe('texto clínico de la operación', () => {
  it('solo Enfermería, Admisión y Control de infecciones ven el texto clínico: Limpieza, Mantenimiento y las administraciones no', () => {
    expect([...CLINICAL_TEXT_ROLES].sort()).toEqual([
      'ADMISSION',
      'INFECTION_CONTROL',
      'NURSE',
    ]);
    for (const role of [
      'HOUSEKEEPING',
      'HOUSEKEEPING_SUPERVISOR',
      'MAINTENANCE',
      'ORG_ADMIN',
      'BRANCH_ADMIN',
      'SUPERADMIN',
      'OR_MANAGER',
      'BILLING',
    ] as const) {
      expect(CLINICAL_TEXT_ROLES).not.toContain(role);
    }
  });

  it('es clínico todo el texto del eje de aislamiento y el motivo «condición del paciente»', () => {
    expect(isClinicalText('AXIS_ISOLATION', null)).toBe(true);
    expect(
      isClinicalText('AXIS_AVAILABILITY', 'BLOCK_RSN_PATIENT_CONDITION'),
    ).toBe(true);
    expect(isClinicalText(null, 'BLOCK_RSN_PATIENT_CONDITION')).toBe(true);
    expect(isClinicalText('AXIS_HYGIENE', null)).toBe(false);
    expect(
      isClinicalText('AXIS_AVAILABILITY', 'BLOCK_RSN_PREVENTIVE_MAINTENANCE'),
    ).toBe(false);
    expect(isClinicalText(undefined, undefined)).toBe(false);
  });

  it('visibleText oculta el texto clínico a quien no es clínico y nunca toca el no clínico', () => {
    expect(visibleText('MRSA', true, false)).toBeNull();
    expect(visibleText('MRSA', true, true)).toBe('MRSA');
    expect(visibleText('Cambio de filtro', false, false)).toBe(
      'Cambio de filtro',
    );
    expect(visibleText(null, true, true)).toBeNull();
    expect(visibleText(undefined, false, false)).toBeNull();
  });
});
