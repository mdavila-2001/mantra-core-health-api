import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import { PractitionerSignatureAssetsService } from './practitioner-signature-assets.service';
import type { AuthenticatedUser } from '../../../../common';

const actor = { id: 'owner', roles: ['USER'] } as AuthenticatedUser;
function build() {
  const profile = {
    profileId: 'own',
    signatureFileId: 'signature',
    sealFileId: 'seal',
  };
  const tx = {
    findOne: jest
      .fn<(...args: unknown[]) => Promise<typeof profile | null>>()
      .mockResolvedValue(profile),
    flush: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  };
  const em = {
    fork: () => tx,
    transactional: (fn: (manager: typeof tx) => unknown) => fn(tx),
  };
  const ownership = {
    requireOwnPractitionerProfileId: jest
      .fn<(...args: unknown[]) => Promise<string>>()
      .mockResolvedValue('own'),
  };
  const files = {
    assertUsableBy: jest
      .fn<(...args: unknown[]) => Promise<{ version: { sizeBytes: string } }>>()
      .mockResolvedValue({ version: { sizeBytes: '100' } }),
  };
  const service = new PractitionerSignatureAssetsService(
    em as never,
    ownership as never,
    files as never,
  );
  return { service, em, tx, ownership, files, profile };
}

describe('PractitionerSignatureAssetsService', () => {
  it('reads only the profile resolved from the actor', async () => {
    const b = build();
    expect(await b.service.getOwn(actor)).toEqual({
      signatureFileId: 'signature',
      sealFileId: 'seal',
    });
    expect(b.ownership.requireOwnPractitionerProfileId).toHaveBeenCalledWith(
      b.tx,
      actor,
    );
    expect(b.tx.findOne).toHaveBeenCalledWith(expect.any(Function), {
      profileId: 'own',
    });
  });
  it('returns null for both missing assets', async () => {
    const b = build();
    Object.assign(b.profile, { signatureFileId: null, sealFileId: null });
    expect(await b.service.getOwn(actor)).toEqual({
      signatureFileId: null,
      sealFileId: null,
    });
  });
  it('changes a signature preserving the omitted seal and locks the profile', async () => {
    const b = build();
    expect(await b.service.setOwn({ signatureFileId: 'new' }, actor)).toEqual({
      signatureFileId: 'new',
      sealFileId: 'seal',
    });
    expect(b.tx.findOne).toHaveBeenCalledWith(
      expect.any(Function),
      { profileId: 'own' },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    expect(b.files.assertUsableBy).toHaveBeenCalledWith(
      b.tx,
      'new',
      actor,
      expect.objectContaining({
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
      }),
    );
    expect(b.tx.flush).toHaveBeenCalledTimes(1);
  });
  it('removes explicitly null references without deleting the files', async () => {
    const b = build();
    expect(await b.service.setOwn({ signatureFileId: null }, actor)).toEqual({
      signatureFileId: null,
      sealFileId: 'seal',
    });
    expect(b.files.assertUsableBy).not.toHaveBeenCalled();
  });
  it('does not write for an empty payload', async () => {
    const b = build();
    await b.service.setOwn({}, actor);
    expect(b.tx.flush).not.toHaveBeenCalled();
  });
  it('rejects another account without reading its profile', async () => {
    const b = build();
    b.ownership.requireOwnPractitionerProfileId.mockRejectedValue(
      new ForbiddenException(),
    );
    await expect(b.service.getOwn(actor)).rejects.toThrow(ForbiddenException);
    expect(b.tx.findOne).not.toHaveBeenCalled();
  });
  it('does not apply either field if the second file is forbidden', async () => {
    const b = build();
    b.files.assertUsableBy
      .mockResolvedValueOnce({ version: { sizeBytes: '100' } })
      .mockRejectedValueOnce(new ForbiddenException());
    await expect(
      b.service.setOwn({ signatureFileId: 'new', sealFileId: 'other' }, actor),
    ).rejects.toThrow(ForbiddenException);
    expect(b.profile.signatureFileId).toBe('signature');
    expect(b.tx.flush).not.toHaveBeenCalled();
  });
  it('accepts exactly 2MB but rejects larger images without a write', async () => {
    const b = build();
    b.files.assertUsableBy.mockResolvedValue({
      version: { sizeBytes: '2097152' },
    });
    await b.service.setOwn({ sealFileId: 'boundary' }, actor);
    b.tx.flush.mockClear();
    b.files.assertUsableBy.mockResolvedValue({
      version: { sizeBytes: '2097153' },
    });
    await expect(
      b.service.setOwn({ sealFileId: 'large' }, actor),
    ).rejects.toThrow('2 MB');
    expect(b.tx.flush).not.toHaveBeenCalled();
  });
});
