import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IamMfaService } from './iam-mfa.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'u1', roles: ['USER'] };

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const usersRepo = { findById: mockFn() };
  const mfaRepo = { create: mockFn(), findByIdAndUser: mockFn() };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new IamMfaService(
    em as any,
    usersRepo as any,
    mfaRepo,
    eventsRepo as any,
    logger as any,
  );
  return { service, tx, usersRepo, mfaRepo, eventsRepo };
}

describe('IamMfaService (UC-01-03)', () => {
  it('enrolls a new factor in PENDING state', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
    d.mfaRepo.create.mockReturnValue({
      id: 'f1',
      stateConceptId: CONCEPTS.STATE_PENDING,
    });

    const res = await d.service.enrollOrVerify(
      'u1',
      { factorType: 'TOTP' },
      actor,
    );

    expect(res).toMatchObject({
      id: 'f1',
      userId: 'u1',
      state: CONCEPTS.STATE_PENDING,
    });
    expect(d.mfaRepo.create).toHaveBeenCalled();
    expect(d.eventsRepo.record).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ eventTypeConceptId: CONCEPTS.SEC_MFA_ENROLL }),
    );
  });

  it('verifies a factor and enables MFA on the user', async () => {
    const d = build();
    const user = {
      id: 'u1',
      mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
      updatedAt: new Date(),
    };
    const factor = {
      id: 'f1',
      stateConceptId: CONCEPTS.STATE_PENDING,
      updatedAt: new Date(),
    };
    d.usersRepo.findById.mockResolvedValue(user);
    d.mfaRepo.findByIdAndUser.mockResolvedValue(factor);

    const res = await d.service.enrollOrVerify(
      'u1',
      { verify: true, factorId: 'f1' },
      actor,
    );

    expect(res.state).toBe(CONCEPTS.STATE_VERIFIED);
    expect(factor.stateConceptId).toBe(CONCEPTS.STATE_VERIFIED);
    expect(user.mfaStatusConceptId).toBe(CONCEPTS.MFA_ENABLED);
  });

  it('throws when the user does not exist', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.enrollOrVerify('u1', { factorType: 'TOTP' }, actor as any),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('throws when the factor to verify is not found', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
    d.mfaRepo.findByIdAndUser.mockResolvedValue(null);
    await expect(
      d.service.enrollOrVerify(
        'u1',
        { verify: true, factorId: 'f1' },
        actor as any,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('requires factorType when enrolling (business rule)', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
    await expect(
      d.service.enrollOrVerify('u1', {}, actor as any),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});
