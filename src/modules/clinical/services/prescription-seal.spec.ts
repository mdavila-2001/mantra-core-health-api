import {
  buildPrescriptionSealPayload,
  computePrescriptionHash,
} from './prescription-seal';
import type { MedicationRequests } from '../entities';

/** Una receta emitida mínima, lista para sellar. */
function prescription(
  overrides: Partial<MedicationRequests> = {},
): MedicationRequests {
  return {
    id: 'req-1',
    patientProfileId: 'pat-1',
    prescriberProfileId: 'prac-1',
    medicationConceptId: 'med-1',
    substanceAtcConceptId: 'atc-1',
    doseText: '500 mg',
    routeConceptId: 'route-oral',
    frequencyText: 'cada 8 horas',
    quantityDecimal: '21',
    unitConceptId: 'unit-tablet',
    validFrom: new Date('2026-09-01T00:00:00.000Z'),
    validTo: new Date('2026-09-15T00:00:00.000Z'),
    patientInstructionsText: 'Tomar con alimentos.',
    indicationConditionId: 'cond-1',
    issuedAt: new Date('2026-09-16T12:00:00.000Z'),
    ...overrides,
  } as MedicationRequests;
}

describe('buildPrescriptionSealPayload', () => {
  it('serializa fechas como ISO y campos ausentes como null', () => {
    const payload = buildPrescriptionSealPayload(
      prescription({
        substanceAtcConceptId: undefined,
        prescriberProfileId: undefined,
        validFrom: undefined,
        validTo: undefined,
      }),
    );

    expect(payload.issuedAt).toBe('2026-09-16T12:00:00.000Z');
    expect(payload.substanceAtcConceptId).toBeNull();
    expect(payload.prescriberProfileId).toBeNull();
    expect(payload.validFrom).toBeNull();
    expect(payload.validTo).toBeNull();
  });
});

describe('computePrescriptionHash', () => {
  it('el mismo contenido produce siempre el mismo hash', () => {
    const a = computePrescriptionHash(prescription());
    const b = computePrescriptionHash(prescription());

    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('cambiar la dosis cambia el hash', () => {
    const original = computePrescriptionHash(prescription());
    const modified = computePrescriptionHash(prescription({ doseText: '250 mg' }));

    expect(modified).not.toBe(original);
  });

  it('el snapshot de auditoría y el sello son cosas distintas: cambiar `statusReasonText` no altera el hash', () => {
    // `statusReasonText` es parte del `snapshot()` de MedicationsService (auditoría)
    // pero NO del payload del sello: el sello identifica el contenido clínico, no
    // el evento que lo produjo.
    const withoutReason = computePrescriptionHash(prescription());
    const withReason = computePrescriptionHash(
      prescription({ statusReasonText: 'Corrección de dosis' }),
    );

    expect(withReason).toBe(withoutReason);
  });

  it('cambiar la cantidad (string numérico) cambia el hash', () => {
    const one = computePrescriptionHash(prescription({ quantityDecimal: '21' }));
    const other = computePrescriptionHash(prescription({ quantityDecimal: '30' }));

    expect(other).not.toBe(one);
  });
});
