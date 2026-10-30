import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { DELEG } from '../delegated_access.concepts';
import { PrescriptionSharesService } from './prescription-shares.service';

/**
 * Dobles y datos sintéticos de los specs de `PrescriptionSharesService`.
 */
export const mockFn = (impl?: any): any => (jest.fn as any)(impl);

export const DAY = 24 * 60 * 60 * 1000;
export const PATIENT = '11111111-1111-4111-8111-111111111111';
export const OTHER_PATIENT = '22222222-2222-4222-8222-222222222222';
export const DOCTOR = '33333333-3333-4333-8333-333333333333';
export const OTHER_DOCTOR = '44444444-4444-4444-8444-444444444444';
export const ENCOUNTER = '55555555-5555-4555-8555-555555555555';
export const TENANT = '66666666-6666-4666-8666-666666666666';
export const SHARE = '77777777-7777-4777-8777-777777777777';

export const patientActor = {
  id: 'user-patient',
  roles: ['PATIENT'],
  patientProfileId: PATIENT,
} as any;
export const otherPatientActor = {
  id: 'user-other-patient',
  roles: ['PATIENT'],
  patientProfileId: OTHER_PATIENT,
} as any;
export const doctorActor = {
  id: 'user-doctor',
  roles: ['PRACTITIONER'],
  practitionerProfileId: DOCTOR,
} as any;
export const otherDoctorActor = {
  id: 'user-other-doctor',
  roles: ['PRACTITIONER'],
  practitionerProfileId: OTHER_DOCTOR,
} as any;

/** Un ítem de receta sintético. */
export function item(overrides: Record<string, unknown> = {}): any {
  return {
    id: `mr-${Math.random().toString(36).slice(2, 10)}`,
    custodianTenantId: TENANT,
    patientProfileId: PATIENT,
    encounterId: ENCOUNTER,
    medicationConceptId: 'concept-med',
    statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
    prescriberProfileId: DOCTOR,
    issuedAt: new Date(Date.now() - DAY),
    validTo: undefined,
    ...overrides,
  };
}

/** Un enlace persistido sintético. */
export function link(overrides: Record<string, unknown> = {}): any {
  return {
    id: SHARE,
    tenantId: TENANT,
    patientProfileId: PATIENT,
    resourceTypeConceptId: DELEG.SHARE_RESOURCE_PRESCRIPTION_ENCOUNTER,
    resourceId: ENCOUNTER,
    tokenHash: 'hash',
    statusConceptId: CONCEPTS.STATE_ACTIVE,
    expiresAt: new Date(Date.now() + 5 * DAY),
    createdAt: new Date(Date.now() - DAY),
    createdByUserId: patientActor.id,
    ...overrides,
  };
}

/** El servicio con su persistencia y sus lectores dobles. */
export function build() {
  const created: any[] = [];
  const uses: any[] = [];
  const committedUses: any[] = [];
  const flushes = { link: 0 };
  const tx = { flush: mockFn(async () => (flushes.link += 1)) };
  const useTx = {
    flush: mockFn(async () => {
      committedUses.push(...uses.splice(0));
    }),
  };
  const fork = {
    transactional: mockFn((cb: any) => cb(useTx)),
  };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => fork),
  };
  const repo = {
    create: mockFn((_em: unknown, data: any) => {
      const row = { id: SHARE, ...data };
      created.push(row);
      return row;
    }),
    findByTokenHash: mockFn().mockResolvedValue(null),
    findById: mockFn().mockResolvedValue(null),
    findByPatient: mockFn().mockResolvedValue([]),
    countOpenedByLinkIds: mockFn().mockResolvedValue(new Map()),
    appendUse: mockFn((_em: unknown, data: any) => {
      uses.push(data);
      return data;
    }),
    findItemsByEncounter: mockFn().mockResolvedValue([]),
    findItemById: mockFn().mockResolvedValue(null),
    findItemsForResources: mockFn().mockResolvedValue([]),
  };
  const prescriberIdentity = {
    read: mockFn().mockResolvedValue({
      name: 'Dra. Sintética Prueba',
      license: { number: 'MN-0001', authority: null, state: 'ACTIVE' },
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PrescriptionSharesService(
    em as any,
    repo as any,
    prescriberIdentity as any,
    logger as any,
  );
  return { service, repo, created, committedUses, prescriberIdentity, logger };
}

export async function thrown(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('se esperaba un rechazo');
}
