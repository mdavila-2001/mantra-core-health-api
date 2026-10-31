import {
  parseCampaignFilters,
  parseCampaignScope,
} from './access-review-input';

const UUID = 'da47af6a-fc7a-5d56-93cb-7bbe45b26ce5';

describe('parseCampaignScope', () => {
  it('ORGANIZATION no necesita objetivos', () => {
    expect(parseCampaignScope({ kind: 'ORGANIZATION' })).toEqual({
      kind: 'ORGANIZATION',
    });
  });
  it('cada tipo exige sus objetivos; sin ellos el alcance está vacío', () => {
    expect(parseCampaignScope({ kind: 'SERVICE' })).toBeUndefined();
    expect(
      parseCampaignScope({ kind: 'SERVICE', healthcareServiceIds: [] }),
    ).toBeUndefined();
    expect(
      parseCampaignScope({
        kind: 'PRACTITIONER',
        practitionerRoleAssignmentIds: [],
      }),
    ).toBeUndefined();
    expect(
      parseCampaignScope({
        kind: 'LOCATION',
        careSpaceIds: [],
        practiceSiteIds: [],
      }),
    ).toBeUndefined();
    expect(
      parseCampaignScope({ kind: 'TEMPLATE', templateCodes: [] }),
    ).toBeUndefined();
  });
  it('conserva los ids válidos sin repetir y descarta lo que no es texto', () => {
    expect(
      parseCampaignScope({
        kind: 'SERVICE',
        healthcareServiceIds: [UUID, UUID, 7, null],
      }),
    ).toEqual({
      kind: 'SERVICE',
      healthcareServiceIds: [UUID],
    });
    expect(
      parseCampaignScope({ kind: 'LOCATION', careSpaceIds: [UUID] }),
    ).toEqual({
      kind: 'LOCATION',
      careSpaceIds: [UUID],
      practiceSiteIds: [],
    });
    expect(
      parseCampaignScope({
        kind: 'TEMPLATE',
        templateCodes: ['BILLING_CASHIER'],
      }),
    ).toEqual({
      kind: 'TEMPLATE',
      templateCodes: ['BILLING_CASHIER'],
    });
  });
  it('un tipo desconocido o una forma rota es vacío (falla cerrado)', () => {
    expect(parseCampaignScope({ kind: 'TODO' })).toBeUndefined();
    expect(parseCampaignScope(null)).toBeUndefined();
    expect(parseCampaignScope('ORGANIZATION')).toBeUndefined();
  });
});

describe('parseCampaignFilters', () => {
  it('normaliza la sensibilidad (ALTA, alta, HIGH) y descarta la que no se reconoce', () => {
    expect(parseCampaignFilters({ minSensitivity: 'alta' })).toEqual({
      minSensitivity: 'ALTA',
    });
    expect(parseCampaignFilters({ minSensitivity: 'HIGH' })).toEqual({
      minSensitivity: 'HIGH',
    });
    expect(parseCampaignFilters({ minSensitivity: 'enorme' })).toBeUndefined();
  });
  it('solo conserva lo que restringe (los booleanos en true y los días positivos)', () => {
    expect(
      parseCampaignFilters({
        unusedDays: 60,
        onlyAboveCeiling: true,
        onlySodFindings: false,
        includeSuspended: true,
        extra: 1,
      }),
    ).toEqual({
      unusedDays: 60,
      onlyAboveCeiling: true,
      includeSuspended: true,
    });
    expect(parseCampaignFilters({ unusedDays: -5 })).toBeUndefined();
    expect(parseCampaignFilters(undefined)).toBeUndefined();
  });
});
