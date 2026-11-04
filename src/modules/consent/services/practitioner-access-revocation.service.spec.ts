import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS, ConflictException } from '../../../common';
import { ClinicalAccessGrantsRepository } from '../../authz/repositories';
import { CONS } from '../consent.concepts';
import { ConsentsService } from './consents.service';
import { PractitionerAccessRevocationService } from './practitioner-access-revocation.service';

const patient = { id: 'u-pat', roles: ['PATIENT'] } as any;

/**
 * Builds the service with the real withdrawal use case and the real grants
 * repository, so the test proves the consent and its grants change together.
 */
function build() {
  const grant: any = {
    id: 'grant-1',
    consentId: 'c-1',
    stateConceptId: CONCEPTS.STATE_ACTIVE,
    updatedAt: new Date(),
  };
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    find: mockFn().mockResolvedValue([grant]),
  };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => ({})),
  };
  const consent: any = {
    id: 'c-1',
    categoryConceptId: CONS.CATEGORY_PRACTITIONER_ACCESS,
    patientProfileId: 'pac-titular',
    statusConceptId: CONS.CONSENT_ACTIVE,
    tenantId: 't1',
    updatedAt: new Date(),
  };
  const consentsRepo = { findById: mockFn().mockResolvedValue(consent) };
  const eventsRepo = { record: mockFn() };
  const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const consents = new ConsentsService(
    em as any,
    consentsRepo as any,
    {} as any,
    eventsRepo as any,
    new ClinicalAccessGrantsRepository(),
    auditTrail as any,
    {} as any,
    logger as any,
  );
  const accountLinksRepo = {
    findActiveByUser: mockFn().mockResolvedValue({ personId: 'persona-1' }),
  };
  const patientProfilesRepo = {
    findById: mockFn().mockResolvedValue({ profileId: 'pac-titular' }),
  };
  const service = new PractitionerAccessRevocationService(
    em as any,
    consentsRepo as any,
    accountLinksRepo as any,
    patientProfilesRepo as any,
    consents,
  );
  return {
    service,
    tx,
    consent,
    grant,
    consentsRepo,
    eventsRepo,
    auditTrail,
    accountLinksRepo,
    patientProfilesRepo,
  };
}

describe('PractitionerAccessRevocationService', () => {
  it('revocar deja el consent WITHDRAWN, deja su evento y revoca su grant', async () => {
    const d = build();

    const res = await d.service.revoke('c-1', patient);

    expect(res).toEqual({ ok: true });
    expect(d.consent.statusConceptId).toBe(CONS.CONSENT_WITHDRAWN);
    expect(d.consent.validTo).toBeInstanceOf(Date);
    expect(d.eventsRepo.record).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        subjectId: 'c-1',
        eventTypeConceptId: CONS.EVENT_WITHDRAWN,
      }),
    );
    expect(d.grant.stateConceptId).toBe(CONCEPTS.STATE_REVOKED);
    expect(d.grant.validTo).toBeInstanceOf(Date);
    expect(d.auditTrail.record).toHaveBeenCalledWith(
      d.tx,
      patient,
      expect.objectContaining({ action: 'CONSENT_WITHDRAWN', entityId: 'c-1' }),
    );
  });

  it('el consent de otro paciente responde 404 y no se toca', async () => {
    const d = build();
    d.patientProfilesRepo.findById.mockResolvedValue({
      profileId: 'pac-intruso',
    });

    await expect(d.service.revoke('c-1', patient)).rejects.toMatchObject({
      status: 404,
    });
    expect(d.consent.statusConceptId).toBe(CONS.CONSENT_ACTIVE);
    expect(d.grant.stateConceptId).toBe(CONCEPTS.STATE_ACTIVE);
  });

  it('una cuenta sin persona vinculada responde 404', async () => {
    const d = build();
    d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);

    await expect(d.service.revoke('c-1', patient)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('un consent que no es de acceso de profesional responde 404 aunque sea del paciente', async () => {
    const d = build();
    d.consent.categoryConceptId = 'otra-categoria';

    await expect(d.service.revoke('c-1', patient)).rejects.toMatchObject({
      status: 404,
    });
    expect(d.consent.statusConceptId).toBe(CONS.CONSENT_ACTIVE);
  });

  it('un consent inexistente responde 404', async () => {
    const d = build();
    d.consentsRepo.findById.mockResolvedValue(null);

    await expect(d.service.revoke('c-x', patient)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('una solicitud todavía pendiente no se revoca: 409', async () => {
    const d = build();
    d.consent.statusConceptId = CONS.ACCESS_REQUEST_PENDING;

    await expect(d.service.revoke('c-1', patient)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(d.grant.stateConceptId).toBe(CONCEPTS.STATE_ACTIVE);
  });
});
