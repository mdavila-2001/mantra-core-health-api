import { jest } from '@jest/globals';
import { ResourceNotFoundException } from '../../../common';
import { PharmacyErrorReason } from '../pharmacy.error-reasons';
import {
  MEDICATION_TARGET,
  MedicationCatalogResolver,
} from './medication-catalog.resolver';

const OPTIONS = [
  { conceptId: 'c-amox', display: 'Amoxicillin', displayEs: 'Amoxicilina' },
  {
    conceptId: 'c-amcl',
    display: 'Amoxicillin and clavulanic acid',
    displayEs: 'Amoxicilina con ácido clavulánico',
  },
  { conceptId: 'c-twin-1', display: 'Insulina' },
  { conceptId: 'c-twin-2', display: 'Insulin', displayEs: 'Insulina' },
];

function build(readEnum = jest.fn(async () => ({ options: OPTIONS }))) {
  return {
    resolver: new MedicationCatalogResolver({ readEnum } as any),
    readEnum,
  };
}

describe('MedicationCatalogResolver', () => {
  it('reads the catalog of the prescription field, not another one', async () => {
    const d = build();
    await d.resolver.resolveName('Amoxicilina');
    expect(d.readEnum).toHaveBeenCalledWith({ target: MEDICATION_TARGET });
    expect(MEDICATION_TARGET).toBe(
      'clinical.medication_requests.medication_concept_id',
    );
  });

  it('resolves a name in Spanish or the concept name, without case, accents or extra spaces', async () => {
    const d = build();
    for (const name of [
      'Amoxicilina',
      '  amoxicilina ',
      'AMOXICILLIN',
      'Amoxicilina   con acido clavulanico',
    ]) {
      const resolved = await d.resolver.resolveName(name);
      expect(resolved.found).toBe(true);
    }
    expect(
      await d.resolver.resolveName('amoxicilina con ácido CLAVULÁNICO'),
    ).toEqual({ found: true, conceptId: 'c-amcl' });
  });

  it('a name that is not there, a part of a name or an empty one is MEDICATION_NOT_FOUND', async () => {
    const d = build();
    for (const name of ['Amoxi', 'Clotrimazol', '   ']) {
      expect(await d.resolver.resolveName(name)).toMatchObject({
        found: false,
        reason: PharmacyErrorReason.MEDICATION_NOT_FOUND,
      });
    }
  });

  it('a name of two different medications is MEDICATION_AMBIGUOUS, never a guess', async () => {
    const d = build();
    expect(await d.resolver.resolveName('insulina')).toMatchObject({
      found: false,
      reason: PharmacyErrorReason.MEDICATION_AMBIGUOUS,
    });
  });

  it('without a published catalog there is no medication, as for the prescriber', async () => {
    const d = build(
      jest.fn(async () => {
        throw new ResourceNotFoundException('Enumeración no encontrada');
      }) as any,
    );
    expect(await d.resolver.resolveName('Amoxicilina')).toMatchObject({
      found: false,
      reason: PharmacyErrorReason.MEDICATION_NOT_FOUND,
    });
    expect(await d.resolver.isMedication('c-amox')).toBe(false);
  });

  it('reads the catalog once for a whole load', async () => {
    const d = build();
    await d.resolver.resolveName('Amoxicilina');
    await d.resolver.resolveName('Amoxicillin');
    await d.resolver.isMedication('c-amox');
    expect(d.readEnum).toHaveBeenCalledTimes(1);
  });

  it('isMedication only accepts a concept of that catalog', async () => {
    const d = build();
    expect(await d.resolver.isMedication('c-amox')).toBe(true);
    expect(await d.resolver.isMedication('c-otro')).toBe(false);
  });
});
