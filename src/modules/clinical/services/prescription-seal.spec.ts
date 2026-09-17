import {
  buildPrescriptionSealPayload,
  computePrescriptionHash,
} from './prescription-seal';
import type { MedicationRequests } from '../entities';

/** Una receta emitida mínima, lista para sellar. */
function receta(overrides: Partial<MedicationRequests> = {}): MedicationRequests {
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
      receta({
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
    const a = computePrescriptionHash(receta());
    const b = computePrescriptionHash(receta());

    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('cambiar la dosis cambia el hash', () => {
    const original = computePrescriptionHash(receta());
    const modificada = computePrescriptionHash(receta({ doseText: '250 mg' }));

    expect(modificada).not.toBe(original);
  });

  it('el snapshot de auditoría y el sello son cosas distintas: cambiar `statusReasonText` no altera el hash', () => {
    // `statusReasonText` es parte del `snapshot()` de MedicationsService (auditoría)
    // pero NO del payload del sello: el sello identifica el contenido clínico, no
    // el evento que lo produjo.
    const sinMotivo = computePrescriptionHash(receta());
    const conMotivo = computePrescriptionHash(
      receta({ statusReasonText: 'Corrección de dosis' }),
    );

    expect(conMotivo).toBe(sinMotivo);
  });

  it('cambiar la cantidad (string numérico) cambia el hash', () => {
    const uno = computePrescriptionHash(receta({ quantityDecimal: '21' }));
    const otro = computePrescriptionHash(receta({ quantityDecimal: '30' }));

    expect(otro).not.toBe(uno);
  });
});
