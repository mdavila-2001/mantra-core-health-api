import { DUNIT } from '../diagnostic_units.concepts';
import {
  alovidaPrice,
  discountFactorOf,
  hoursToMinutes,
  isModalityOffering,
  minutesToHours,
  money,
  percentOf,
  statusConcept,
  statusOf,
  toLabService,
} from './lab-portal.mapping';

describe('lab-portal.mapping', () => {
  it('maps portal statuses to the offering concepts the public directory reads', () => {
    expect(statusConcept('PUBLISHED')).toBe(DUNIT.OFFERING_ACTIVE);
    expect(statusConcept('DRAFT')).toBe(DUNIT.OFFERING_DRAFT);
    expect(statusConcept('WITHDRAWN')).toBe(DUNIT.OFFERING_RETIRED);
    expect(statusOf(DUNIT.OFFERING_ACTIVE)).toBe('PUBLISHED');
    expect(statusOf(DUNIT.OFFERING_RETIRED)).toBe('WITHDRAWN');
    expect(statusOf(DUNIT.OFFERING_DRAFT)).toBe('DRAFT');
  });

  it('stores the discount as a fraction and reads it back as a percent', () => {
    expect(discountFactorOf(10)).toBe('0.1000');
    expect(discountFactorOf(12.5)).toBe('0.1250');
    expect(discountFactorOf(100)).toBe('1.0000');
    expect(discountFactorOf(null)).toBeUndefined();
    expect(percentOf('0.1000')).toBe(10);
    expect(percentOf('0.125')).toBe(12.5);
    expect(percentOf(undefined)).toBeNull();
  });

  it('computes the AloVida price with exact decimals', () => {
    expect(alovidaPrice('45.00', 10)).toBe('40.50');
    expect(alovidaPrice('33.33', 33.33)).toBe('22.22');
    expect(alovidaPrice('80', null)).toBe('80.00');
    expect(alovidaPrice('80', 100)).toBe('0.00');
    expect(money('45')).toBe('45.00');
  });

  it('converts turnaround hours to minutes and back', () => {
    expect(hoursToMinutes(4)).toBe(240);
    expect(hoursToMinutes(null)).toBeUndefined();
    expect(minutesToHours(240)).toBe(4);
    expect(minutesToHours(undefined)).toBeNull();
  });

  it('builds the LabService shape, with the optional columns as null/defaults', () => {
    const view = toLabService(
      {
        id: 'o1',
        studyCode: 'HEMO',
        displayName: 'Hemograma',
        preparationInstructions: 'Ayuno de 8 horas',
        expectedTurnaroundMinutes: 360,
        requiresMedicalOrder: true,
        statusConceptId: DUNIT.OFFERING_DRAFT,
        updatedAt: new Date('2026-11-01T10:00:00Z'),
      } as any,
      { baseAmount: '50', discountFactor: '0.2000' } as any,
      'Sangre venosa',
      null,
    );
    expect(view).toEqual({
      id: 'o1',
      code: 'HEMO',
      name: 'Hemograma',
      kind: 'SERVICE',
      parentId: null,
      catalogConceptId: null,
      hasPrice: true,
      categoryId: null,
      categoryName: null,
      sampleType: 'Sangre venosa',
      preparation: 'Ayuno de 8 horas',
      description: null,
      turnaroundHours: 6,
      requiresMedicalOrder: true,
      homeCollection: false,
      price: '50.00',
      alovidaDiscountPercent: 20,
      alovidaPrice: '40.00',
      currency: 'BOB',
      status: 'DRAFT',
      available: true,
      updatedAt: '2026-11-01T10:00:00.000Z',
    });
  });

  it('answers null, never 0.00, for a service that has no current price', () => {
    const view = toLabService(
      {
        id: 'o2',
        studyCode: 'TAC-CRANEO',
        displayName: 'Tomografía de cráneo',
        statusConceptId: DUNIT.OFFERING_ACTIVE,
        updatedAt: new Date('2026-11-01T10:00:00Z'),
      } as any,
      undefined,
      null,
      null,
    );
    expect(view).toMatchObject({
      kind: 'SERVICE',
      price: null,
      alovidaDiscountPercent: null,
      alovidaPrice: null,
    });
  });

  it('tells a registration modality placeholder from a real study', () => {
    const placeholder = {
      studyCode: 'MODALITY_XRAY',
      modalityConceptId: DUNIT.MODALITY_XRAY,
    } as any;
    expect(isModalityOffering(placeholder)).toBe(true);
    expect(
      toLabService(
        {
          ...placeholder,
          id: 'o3',
          displayName: 'Rayos X',
          statusConceptId: DUNIT.OFFERING_ACTIVE,
          updatedAt: new Date(),
        },
        undefined,
        null,
        null,
      ).kind,
    ).toBe('MODALITY');
    // A concrete X-ray study tagged with the modality is still a service.
    expect(
      isModalityOffering({
        studyCode: 'RX-TORAX',
        modalityConceptId: DUNIT.MODALITY_XRAY,
      } as any),
    ).toBe(false);
    expect(isModalityOffering({ studyCode: 'MODALITY_XRAY' } as any)).toBe(
      false,
    );
  });

  it('reads category, free-text sample type and availability from the offering', () => {
    const offering = {
      id: 'o2',
      studyCode: 'GLU',
      displayName: 'Glucosa',
      statusConceptId: DUNIT.OFFERING_ACTIVE,
      serviceCategoryId: 'c1',
      specimenDescription: 'Sangre venosa (tubo gris)',
      available: false,
      updatedAt: new Date('2026-11-01T10:00:00Z'),
    } as any;
    const view = toLabService(offering, undefined, 'Venous blood', 'Química');
    expect(view).toMatchObject({
      categoryId: 'c1',
      categoryName: 'Química',
      sampleType: 'Sangre venosa (tubo gris)',
      available: false,
      // No current price: unpriced, never a made-up 0.00.
      price: null,
    });
    // A category that is not resolved never leaks a stale name.
    const orphan = toLabService(
      { ...offering, serviceCategoryId: undefined },
      undefined,
      null,
      'Química',
    );
    expect(orphan).toMatchObject({ categoryId: null, categoryName: null });
  });
});
