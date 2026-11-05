import { jest } from '@jest/globals';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';
import { PROF } from '../../profiles.concepts';
import { ProfilesErrorReason } from '../../profiles.error-reasons';
import { PractitionerAdmissionSubmitService } from './practitioner-admission-submit.service';

// Loose typing: avoids the 'never' that @jest/globals infers for jest.fn() under ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

const DOCTOR = { id: 'u-doctor', roles: ['USER', 'PRACTITIONER'] } as never;
const ATTEST = {
  acceptedAt: new Date('2026-11-04T12:00:00.000Z'),
  textVersion: '2026-10',
};

function build(
  options: {
    personId?: string | null;
    current?: object | null;
    status?: string;
    noticeFails?: boolean;
  } = {},
) {
  const tx = {
    findOne: fn().mockResolvedValue({
      profileId: 'prac-1',
      verificationStatusConceptId: options.status ?? PROF.PRACT_VERIF_PENDING,
    }),
  };
  const em = {
    transactional: fn((work: (t: typeof tx) => unknown) =>
      Promise.resolve(work(tx)),
    ),
  };
  const created = { id: 'adm-new', practitionerProfileId: 'prac-1' };
  const admissions = { openForRegistration: fn().mockResolvedValue(created) };
  const read = {
    ownPersonId: fn().mockResolvedValue(
      options.personId === undefined ? 'prac-1' : options.personId,
    ),
    currentOf: fn().mockResolvedValue(options.current ?? null),
    ownOf: fn().mockResolvedValue({ status: { code: 'ENVIADA' } }),
  };
  const notices = {
    emit: options.noticeFails
      ? fn().mockRejectedValue(new Error('smtp down'))
      : fn().mockResolvedValue(undefined),
  };
  const logger = { setContext: fn(), warn: fn() };
  const service = new PractitionerAdmissionSubmitService(
    em as never,
    admissions as never,
    read as never,
    notices as never,
    logger as never,
  );
  return { service, tx, admissions, read, notices, logger, created };
}

const reasonOf = (error: unknown) =>
  (error as { reason?: string; getResponse?: () => any }).reason ??
  (error as any).getResponse?.().reason;

describe('PractitionerAdmissionSubmitService.submitOwn', () => {
  it('opens the admission of the pending practitioner and notifies after commit', async () => {
    const d = build();
    const out = await d.service.submitOwn(DOCTOR, ATTEST);
    expect(d.admissions.openForRegistration).toHaveBeenCalledWith(d.tx, {
      practitionerProfileId: 'prac-1',
      actorUserId: 'u-doctor',
      attestation: ATTEST,
    });
    expect(d.read.ownOf).toHaveBeenCalledWith(d.tx, d.created);
    expect(d.notices.emit).toHaveBeenCalledWith({
      kind: 'RECEIVED',
      admissionId: 'adm-new',
      statusCode: 'ENVIADA',
      practitionerProfileId: 'prac-1',
    });
    expect(out).toEqual({ status: { code: 'ENVIADA' } });
  });

  it('keeps the submission when the notice fails', async () => {
    const d = build({ noticeFails: true });
    await expect(d.service.submitOwn(DOCTOR, ATTEST)).resolves.toBeDefined();
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('409 ADMISSION_ALREADY_EXISTS when there is a current admission', async () => {
    const d = build({ current: { id: 'adm-1' } });
    const error = await d.service.submitOwn(DOCTOR, ATTEST).catch((e) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_ALREADY_EXISTS);
    expect(d.admissions.openForRegistration).not.toHaveBeenCalled();
  });

  it('412 ADMISSION_ATTESTATION_REQUIRED without the declaration', async () => {
    const d = build();
    const error = await d.service.submitOwn(DOCTOR, undefined).catch((e) => e);
    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect(reasonOf(error)).toBe(
      ProfilesErrorReason.ADMISSION_ATTESTATION_REQUIRED,
    );
    expect(d.admissions.openForRegistration).not.toHaveBeenCalled();
  });

  it('412 ADMISSION_NOT_PENDING when the profile is already verified', async () => {
    const d = build({ status: PROF.PRACT_VERIF_VERIFIED });
    const error = await d.service.submitOwn(DOCTOR, ATTEST).catch((e) => e);
    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_NOT_PENDING);
    expect(d.admissions.openForRegistration).not.toHaveBeenCalled();
  });

  it('404 ADMISSION_NOT_FOUND without a professional profile', async () => {
    const d = build({ personId: null });
    const error = await d.service.submitOwn(DOCTOR, ATTEST).catch((e) => e);
    expect(error).toBeInstanceOf(ResourceNotFoundException);
    expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_NOT_FOUND);
  });
});
