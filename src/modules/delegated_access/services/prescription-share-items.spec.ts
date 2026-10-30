import { CLIN } from '../../clinical/clinical.concepts';
import { DELEG } from '../delegated_access.concepts';
import {
  activeItemsOf,
  earliestDate,
  itemsOfLink,
  resourceIdsOf,
  shareResourceTypeOf,
} from './prescription-share-items';

const now = new Date('2026-10-30T12:00:00.000Z');
const encounterLink = {
  patientProfileId: 'p1',
  resourceTypeConceptId: DELEG.SHARE_RESOURCE_PRESCRIPTION_ENCOUNTER,
  resourceId: 'e1',
};
const itemLink = {
  patientProfileId: 'p1',
  resourceTypeConceptId: DELEG.SHARE_RESOURCE_MEDICATION_REQUEST,
  resourceId: 'm9',
};
const row = (overrides: Record<string, unknown>): any => ({
  id: 'm1',
  patientProfileId: 'p1',
  encounterId: 'e1',
  statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
  ...overrides,
});

/** Qué ítems comparte un enlace y cuáles siguen vigentes (S-2). */
describe('prescription-share-items', () => {
  it('vigentes: emitidos y sin vencer; fuera reemplazados, invalidados, completados y borradores', () => {
    const items = [
      row({ id: 'a' }),
      row({ id: 'b', validTo: new Date('2026-11-01T00:00:00.000Z') }),
      row({ id: 'c', validTo: new Date('2026-10-01T00:00:00.000Z') }),
      row({ id: 'd', statusConceptId: CLIN.MEDICATION_REQUEST_REPLACED }),
      row({ id: 'e', statusConceptId: CLIN.MEDICATION_REQUEST_INVALIDATED }),
      row({ id: 'f', statusConceptId: CLIN.MEDICATION_REQUEST_COMPLETED }),
      row({ id: 'g', statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT }),
    ];
    expect(activeItemsOf(items, now).map((item) => item.id)).toEqual([
      'a',
      'b',
    ]);
  });

  it('ítems de un enlace: su encuentro o su fármaco, y solo del mismo paciente', () => {
    const items = [
      row({ id: 'm1' }),
      row({ id: 'm2', encounterId: 'e2' }),
      row({ id: 'm3', patientProfileId: 'p2' }),
      row({ id: 'm9', encounterId: undefined }),
    ];
    expect(itemsOfLink(encounterLink, items).map((item) => item.id)).toEqual([
      'm1',
    ]);
    expect(itemsOfLink(itemLink, items).map((item) => item.id)).toEqual(['m9']);
  });

  it('nombres de tipo y recursos sin repetir', () => {
    expect(shareResourceTypeOf(encounterLink)).toBe('PRESCRIPTION_ENCOUNTER');
    expect(shareResourceTypeOf(itemLink)).toBe('MEDICATION_REQUEST');
    expect(
      resourceIdsOf(
        [encounterLink, encounterLink, itemLink],
        DELEG.SHARE_RESOURCE_PRESCRIPTION_ENCOUNTER,
      ),
    ).toEqual(['e1']);
  });

  it('la fecha más temprana ignora las ausentes', () => {
    const a = new Date('2026-10-02T00:00:00.000Z');
    const b = new Date('2026-10-01T00:00:00.000Z');
    expect(earliestDate([a, undefined, b, null])).toBe(b);
    expect(earliestDate([undefined])).toBeNull();
  });
});
