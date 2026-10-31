import { ClinicalExtErrorReason } from '../clinical_ext.error-reasons';
import type { ReferralTransferDto } from '../dto';
import type { Referrals } from '../entities';
import {
  applyTransfer,
  assertArrivalAfterDeparture,
  assertTransferRules,
  mergeTransfer,
  toTransferResponse,
} from './referral-transfer';

/** Traslado válido de un paciente estable en vehículo particular. */
const stable: ReferralTransferDto = {
  required: true,
  transportMode: 'PRIVATE_VEHICLE',
  departureCondition: 'STABLE',
};

/** Traslado válido de un paciente crítico. */
const critical: ReferralTransferDto = {
  required: true,
  transportMode: 'AMBULANCE_ADVANCED',
  departureCondition: 'CRITICAL',
  escortProfessionalName: 'Lic. Enf. Ana Rojas',
  escortProfessionalRole: 'Enfermería',
  receiverContacted: true,
  receiverContactName: 'Dr. Guardia Hospital Japonés',
};

/**
 * Corre las reglas sobre un traslado nuevo y devuelve el error lanzado.
 *
 * @param dto - Traslado.
 * @returns El error, o `undefined` si pasa.
 */
function failure(dto: ReferralTransferDto): any {
  try {
    assertTransferRules(mergeTransfer(undefined, dto));
    return undefined;
  } catch (error) {
    return error;
  }
}

describe('referral transfer rules (v4274)', () => {
  it('accepts a stable transfer and a critical one with everything', () => {
    expect(failure(stable)).toBeUndefined();
    expect(failure(critical)).toBeUndefined();
  });

  it('accepts a referral without physical transfer and no other data', () => {
    expect(failure({ required: false })).toBeUndefined();
  });

  it('TRANSFER_INCOMPLETE: required=true needs transportMode and departureCondition', () => {
    const error = failure({ required: true });
    expect(error).toMatchObject({
      status: 400,
      reason: ClinicalExtErrorReason.TRANSFER_INCOMPLETE,
    });
    expect(error.details).toEqual({
      fields: ['transfer.transportMode', 'transfer.departureCondition'],
    });
    expect(
      failure({ required: true, transportMode: 'ON_FOOT' }).details,
    ).toEqual({ fields: ['transfer.departureCondition'] });
  });

  it('TRANSFER_DETAIL_REQUIRED: OTHER without transportDetail', () => {
    const error = failure({ ...stable, transportMode: 'OTHER' });
    expect(error).toMatchObject({
      status: 400,
      reason: ClinicalExtErrorReason.TRANSFER_DETAIL_REQUIRED,
      details: { fields: ['transfer.transportDetail'] },
    });
    expect(
      failure({ ...stable, transportMode: 'OTHER', transportDetail: 'Moto' }),
    ).toBeUndefined();
  });

  it.each([
    ['systolicBp', 39],
    ['systolicBp', 301],
    ['diastolicBp', 19],
    ['heartRate', 301],
    ['respiratoryRate', 3],
    ['temperatureC', 45.1],
    ['temperatureC', 29.9],
    ['oxygenSaturation', 49],
    ['glasgow', 16],
    ['glasgow', 2],
  ])('TRANSFER_VITALS_OUT_OF_RANGE: %s=%s', (key, value) => {
    const error = failure({ ...stable, vitals: { [key]: value } });
    expect(error).toMatchObject({
      status: 400,
      reason: ClinicalExtErrorReason.TRANSFER_VITALS_OUT_OF_RANGE,
      details: { fields: [`transfer.vitals.${key}`] },
    });
  });

  it('accepts the range limits', () => {
    expect(
      failure({
        ...stable,
        vitals: {
          systolicBp: 300,
          diastolicBp: 200,
          heartRate: 20,
          respiratoryRate: 80,
          temperatureC: 45,
          oxygenSaturation: 100,
          glasgow: 3,
        },
      }),
    ).toBeUndefined();
  });

  it('TRANSFER_VITALS_OUT_OF_RANGE: diastolic must be lower than systolic', () => {
    const error = failure({
      ...stable,
      vitals: { systolicBp: 90, diastolicBp: 90 },
    });
    expect(error).toMatchObject({
      reason: ClinicalExtErrorReason.TRANSFER_VITALS_OUT_OF_RANGE,
      details: { fields: ['transfer.vitals.diastolicBp'] },
    });
  });

  it.each(['UNSTABLE', 'CRITICAL'] as const)(
    'TRANSFER_UNSAFE_TRANSPORT: %s needs an ambulance and an escort',
    (departureCondition) => {
      const error = failure({
        required: true,
        transportMode: 'PUBLIC_TRANSPORT',
        departureCondition,
        receiverContacted: true,
        receiverContactName: 'Dr. X',
      });
      expect(error).toMatchObject({
        status: 400,
        reason: ClinicalExtErrorReason.TRANSFER_UNSAFE_TRANSPORT,
        details: {
          fields: ['transfer.transportMode', 'transfer.escortProfessionalName'],
        },
      });
    },
  );

  it.each(['AMBULANCE_BASIC', 'AMBULANCE_ADVANCED', 'AIR_AMBULANCE'] as const)(
    'TRANSFER_UNSAFE_TRANSPORT: %s is accepted for an unstable patient',
    (transportMode) => {
      expect(
        failure({ ...critical, departureCondition: 'UNSTABLE', transportMode }),
      ).toBeUndefined();
    },
  );

  it('TRANSFER_UNSAFE_TRANSPORT: ambulance without escort', () => {
    const error = failure({ ...critical, escortProfessionalName: undefined });
    expect(error).toMatchObject({
      reason: ClinicalExtErrorReason.TRANSFER_UNSAFE_TRANSPORT,
      details: { fields: ['transfer.escortProfessionalName'] },
    });
  });

  it('TRANSFER_RECEIVER_NOT_CONTACTED: unstable or critical without notice', () => {
    const error = failure({
      ...critical,
      receiverContacted: false,
      receiverContactName: undefined,
    });
    expect(error).toMatchObject({
      status: 400,
      reason: ClinicalExtErrorReason.TRANSFER_RECEIVER_NOT_CONTACTED,
      details: {
        fields: ['transfer.receiverContacted', 'transfer.receiverContactName'],
      },
    });
    expect(
      failure({ ...critical, receiverContactName: undefined }).details,
    ).toEqual({ fields: ['transfer.receiverContactName'] });
  });

  it('a stable patient does not need the receiver notice', () => {
    expect(failure({ ...stable, receiverContacted: false })).toBeUndefined();
  });

  it('TRANSFER_ARRIVAL_BEFORE_DEPARTURE', () => {
    const departed = new Date('2026-10-31T10:00:00Z');
    expect(() =>
      assertArrivalAfterDeparture(new Date('2026-10-31T09:59:00Z'), departed),
    ).toThrow(
      expect.objectContaining({
        status: 400,
        reason: ClinicalExtErrorReason.TRANSFER_ARRIVAL_BEFORE_DEPARTURE,
        details: { fields: ['arrivedAt'] },
      }),
    );
    expect(() => assertArrivalAfterDeparture(departed, departed)).not.toThrow();
    expect(() =>
      assertArrivalAfterDeparture(new Date(), undefined),
    ).not.toThrow();
  });
});

describe('referral transfer merge and projection (v4274)', () => {
  it('omitted keeps, null clears, and the rules see the merged result', () => {
    const row = {} as Referrals;
    applyTransfer(
      row,
      mergeTransfer(undefined, {
        ...critical,
        vitals: { systolicBp: 120, diastolicBp: 80, temperatureC: 36.5 },
      }),
    );
    expect(row.vitalTemperatureC).toBe('36.5');

    const merged = mergeTransfer(row, {
      companionPhone: '70000000',
      escortProfessionalRole: null,
    });
    expect(merged.transportMode).toBe('AMBULANCE_ADVANCED');
    expect(merged.companionPhone).toBe('70000000');
    expect(merged.escortProfessionalRole).toBeNull();
    expect(merged.systolicBp).toBe(120);
    expect(merged.temperatureC).toBe(36.5);

    // Pasar a transporte público con el paciente crítico guardado viola la regla.
    expect(() =>
      assertTransferRules(
        mergeTransfer(row, { transportMode: 'PUBLIC_TRANSPORT' }),
      ),
    ).toThrow(
      expect.objectContaining({
        reason: ClinicalExtErrorReason.TRANSFER_UNSAFE_TRANSPORT,
      }),
    );

    // `vitals: null` borra todos los signos.
    expect(mergeTransfer(row, { vitals: null }).systolicBp).toBeNull();
  });

  it('projects null for a referral without transfer data', () => {
    expect(toTransferResponse({} as Referrals)).toBeNull();
  });

  it('projects the transfer with numeric temperature and arrival', () => {
    const row = {
      transferRequired: true,
      transportMode: 'AMBULANCE_BASIC',
      departureCondition: 'STABLE',
      vitalTemperatureC: '37.2',
      arrivedAt: new Date('2026-10-31T12:00:00Z'),
      arrivalCondition: 'STABLE',
    } as Referrals;
    expect(toTransferResponse(row)).toMatchObject({
      required: true,
      transportMode: 'AMBULANCE_BASIC',
      vitals: { temperatureC: 37.2, systolicBp: null },
      arrivedAt: row.arrivedAt,
      arrivalCondition: 'STABLE',
      arrivalNotes: null,
    });
  });
});
