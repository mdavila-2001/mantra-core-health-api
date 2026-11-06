import { CLIN } from '../clinical.concepts';
import { prescriptionItemState } from './prescription-validity';

/**
 * La regla de «receta vigente» que comparten el pedido, el enlace compartido y
 * la pantalla de la farmacia: solo un ítem emitido y sin vencer sirve.
 */
describe('prescriptionItemState', () => {
  const now = new Date('2026-10-30T12:00:00.000Z');
  const tomorrow = new Date('2026-10-31T12:00:00.000Z');
  const yesterday = new Date('2026-10-29T12:00:00.000Z');

  it('un ítem emitido sin vencimiento está activo', () => {
    expect(
      prescriptionItemState(
        { statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED },
        now,
      ),
    ).toBe('ACTIVE');
    expect(
      prescriptionItemState(
        { statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED, validTo: null },
        now,
      ),
    ).toBe('ACTIVE');
  });

  it('un ítem emitido que vence mañana está activo', () => {
    expect(
      prescriptionItemState(
        { statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED, validTo: tomorrow },
        now,
      ),
    ).toBe('ACTIVE');
  });

  it('un ítem emitido que venció ayer está vencido', () => {
    expect(
      prescriptionItemState(
        { statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED, validTo: yesterday },
        now,
      ),
    ).toBe('EXPIRED');
  });

  it('vence en el instante exacto de su valid_to', () => {
    expect(
      prescriptionItemState(
        { statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED, validTo: now },
        now,
      ),
    ).toBe('EXPIRED');
  });

  it.each([
    ['DRAFT', CLIN.MEDICATION_REQUEST_DRAFT],
    ['INVALIDATED', CLIN.MEDICATION_REQUEST_INVALIDATED],
    ['REPLACED', CLIN.MEDICATION_REQUEST_REPLACED],
    ['COMPLETED', CLIN.MEDICATION_REQUEST_COMPLETED],
  ])('un ítem %s no está activo, venza cuando venza', (_name, status) => {
    expect(prescriptionItemState({ statusConceptId: status }, now)).toBe(
      'NOT_ACTIVE',
    );
    expect(
      prescriptionItemState(
        { statusConceptId: status, validTo: yesterday },
        now,
      ),
    ).toBe('NOT_ACTIVE');
  });
});
