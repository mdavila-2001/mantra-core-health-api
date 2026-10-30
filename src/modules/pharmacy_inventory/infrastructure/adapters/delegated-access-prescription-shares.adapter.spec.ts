import { jest } from '@jest/globals';
import { GoneException } from '@nestjs/common';
import { DelegatedAccessPrescriptionSharesAdapter } from './delegated-access-prescription-shares.adapter';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Una fila clínica con más de lo que la farmacia necesita (datos sintéticos). */
const ROW = {
  id: 'mr-1',
  custodianTenantId: 'tenant-clinic',
  patientProfileId: 'patient-1',
  encounterId: 'enc-1',
  medicationConceptId: 'med-a',
  statusConceptId: 'issued',
  doseText: '1 comprimido',
  frequencyText: 'cada 12 horas',
  quantityDecimal: '2.000',
  unitConceptId: 'unit-bottle',
  patientInstructionsText: 'Texto libre del paciente',
  indicationText: 'Indicación sintética',
};

describe('DelegatedAccessPrescriptionSharesAdapter', () => {
  it('translates the shared prescription to flat items, without the clinical row', async () => {
    const shares = {
      // Como el servicio real: resuelve, corre `prepare` y devuelve lo suyo.
      openForPharmacy: mockFn(async (_t: string, _c: unknown, prepare: any) =>
        prepare({
          shareId: 'share-1',
          tenantId: 'tenant-clinic',
          patientProfileId: 'patient-1',
          resourceType: 'PRESCRIPTION_ENCOUNTER',
          resourceId: 'enc-1',
          issuedAt: null,
          validTo: null,
          expiresAt: new Date('2026-11-01T00:00:00.000Z'),
          prescriber: {
            practitionerProfileId: 'prac-1',
            name: 'Dra. Prueba',
            license: { number: 'MP-1', authority: null, state: 'PENDING' },
          },
          items: [
            ROW,
            {
              ...ROW,
              id: 'mr-2',
              quantityDecimal: 'x',
              unitConceptId: undefined,
              doseText: undefined,
              frequencyText: undefined,
            },
          ],
        }),
      ),
    };
    const adapter = new DelegatedAccessPrescriptionSharesAdapter(shares as any);
    const result = await adapter.openForPharmacy(
      'tok',
      { sourceIp: '10.0.0.1' },
      async (share) => ({ seen: share }),
    );

    expect(shares.openForPharmacy).toHaveBeenCalledWith(
      'tok',
      { sourceIp: '10.0.0.1', userAgent: null },
      expect.any(Function),
    );
    expect(result.seen).toEqual({
      shareId: 'share-1',
      patientProfileId: 'patient-1',
      issuedAt: null,
      validTo: null,
      prescriber: {
        name: 'Dra. Prueba',
        license: { number: 'MP-1', authority: null, state: 'PENDING' },
      },
      items: [
        {
          id: 'mr-1',
          medicationConceptId: 'med-a',
          doseText: '1 comprimido',
          frequencyText: 'cada 12 horas',
          quantity: 2,
          unitConceptId: 'unit-bottle',
        },
        {
          id: 'mr-2',
          medicationConceptId: 'med-a',
          doseText: null,
          frequencyText: null,
          quantity: null,
          unitConceptId: null,
        },
      ],
    });
  });

  it('lets the 410 of the owning context through', async () => {
    const shares = {
      openForPharmacy: mockFn(async () => {
        throw new GoneException({ reason: 'PRESCRIPTION_SHARE_EXPIRED' });
      }),
    };
    const adapter = new DelegatedAccessPrescriptionSharesAdapter(shares as any);
    await expect(
      adapter.openForPharmacy('tok', {}, async () => null),
    ).rejects.toBeInstanceOf(GoneException);
  });
});
