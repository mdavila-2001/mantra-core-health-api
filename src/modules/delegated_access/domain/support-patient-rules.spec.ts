import {
  ageInYears,
  canRegisterPatients,
  classifyGuardianRelationship,
  hasLiveEngagement,
  maskDocument,
  maskPhone,
  normalizePersonText,
  type EngagementFacts,
} from './index';

describe('enmascarado de documento y teléfono', () => {
  it('el documento deja solo los tres últimos caracteres', () => {
    expect(maskDocument('1234556')).toBe('***556');
    expect(maskDocument(' 12 ')).toBe('***');
  });

  it('el teléfono deja el primer y el último dígito del número nacional', () => {
    expect(maskPhone('+591 71234567')).toBe('7******7');
    expect(maskPhone('71234567')).toBe('7******7');
    expect(maskPhone('12')).toBe('***');
  });
});

describe('ageInYears', () => {
  const now = new Date('2026-10-30T12:00:00Z');

  it('cuenta los años cumplidos, antes y después del cumpleaños', () => {
    expect(ageInYears('2018-03-02', now)).toBe(8);
    expect(ageInYears('2018-12-24', now)).toBe(7);
    expect(ageInYears('1990-05-17', now)).toBe(36);
  });

  it('sin fecha o con una fecha inválida no hay edad', () => {
    expect(ageInYears(undefined, now)).toBeUndefined();
    expect(ageInYears('no-es-fecha', now)).toBeUndefined();
  });

  it('el día del cumpleaños ya los cumplió', () => {
    expect(ageInYears('2008-10-30', now)).toBe(18);
  });
});

describe('normalizePersonText', () => {
  it('quita tildes, signos y espacios de más', () => {
    expect(normalizePersonText('  Sandra  ANTELO-Vaca. ')).toBe(
      'sandra antelo vaca',
    );
    expect(normalizePersonText('Martín Peña')).toBe('martin pena');
  });
});

describe('classifyGuardianRelationship', () => {
  it.each([
    ['Madre', 'MOTHER', 'PARENT'],
    ['madre', 'MOTHER', 'PARENT'],
    ['Padre', 'FATHER', 'PARENT'],
    ['Tutor legal', 'LEGAL_GUARDIAN', 'LEGAL_GUARDIAN'],
    ['Tutora', 'LEGAL_GUARDIAN', 'LEGAL_GUARDIAN'],
    ['Representante legal', 'LEGAL_GUARDIAN', 'LEGAL_GUARDIAN'],
    ['LEGAL_GUARDIAN', 'LEGAL_GUARDIAN', 'LEGAL_GUARDIAN'],
    ['Abuela autorizada', 'GRANDPARENT', null],
    ['Tío', 'UNCLE_AUNT', null],
    ['Hermana', 'SIBLING', null],
    ['Vecina de confianza', 'OTHER_RELATIVE', null],
  ])('«%s» → %s (representación legal: %s)', (raw, kind, legal) => {
    expect(classifyGuardianRelationship(raw)).toEqual({ kind, legal });
  });
});

describe('canRegisterPatients', () => {
  const NOW = new Date('2026-10-30T12:00:00Z');
  const engagement = (
    actions: string[],
    overrides: Partial<EngagementFacts> = {},
  ): EngagementFacts =>
    ({
      engagementId: 'e',
      active: true,
      validFrom: new Date('2026-01-01T00:00:00Z'),
      acceptances: [],
      grants: [
        {
          grantId: 'g',
          targetKind: 'ALL',
          expansionMode: 'DYNAMIC',
          active: true,
          actions,
        },
      ],
      ...overrides,
    }) as EngagementFacts;

  it('exige patient.register en algún permiso vigente de un vínculo vigente', () => {
    expect(canRegisterPatients([engagement(['patient.register'])], NOW)).toBe(
      true,
    );
    expect(
      canRegisterPatients(
        [engagement(['schedule.create', 'schedule.view'])],
        NOW,
      ),
    ).toBe(false);
  });

  it('un vínculo inactivo o vencido no registra', () => {
    expect(
      canRegisterPatients(
        [engagement(['patient.register'], { active: false })],
        NOW,
      ),
    ).toBe(false);
    expect(
      canRegisterPatients(
        [
          engagement(['patient.register'], {
            validTo: new Date('2026-06-01T00:00:00Z'),
          }),
        ],
        NOW,
      ),
    ).toBe(false);
  });

  it('sin vínculos no registra', () => {
    expect(canRegisterPatients([], NOW)).toBe(false);
  });
});

describe('hasLiveEngagement (N5: verificar el vínculo antes de sellar en una organización)', () => {
  const NOW = new Date('2026-10-30T12:00:00Z');
  const engagement = (
    overrides: Partial<EngagementFacts> = {},
  ): EngagementFacts =>
    ({
      engagementId: 'e',
      active: true,
      validFrom: new Date('2026-01-01T00:00:00Z'),
      acceptances: [],
      grants: [],
      ...overrides,
    }) as EngagementFacts;

  it('sin vínculos no hay vínculo vivo', () => {
    expect(hasLiveEngagement([], NOW)).toBe(false);
  });

  it('un vínculo activo y vigente es vivo aunque no tenga permisos todavía', () => {
    expect(hasLiveEngagement([engagement()], NOW)).toBe(true);
  });

  it('un vínculo inactivo, vencido o que aún no empieza no es vivo', () => {
    expect(hasLiveEngagement([engagement({ active: false })], NOW)).toBe(false);
    expect(
      hasLiveEngagement(
        [engagement({ validTo: new Date('2026-10-01T00:00:00Z') })],
        NOW,
      ),
    ).toBe(false);
    expect(
      hasLiveEngagement(
        [engagement({ validFrom: new Date('2026-12-01T00:00:00Z') })],
        NOW,
      ),
    ).toBe(false);
  });

  it('basta uno vivo entre varios', () => {
    expect(
      hasLiveEngagement([engagement({ active: false }), engagement()], NOW),
    ).toBe(true);
  });
});
