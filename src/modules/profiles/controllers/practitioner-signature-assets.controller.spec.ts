import { jest } from '@jest/globals';
import { PractitionerSignatureAssetsController } from './practitioner-signature-assets.controller';
import type { AuthenticatedUser } from '../../../common';

describe('PractitionerSignatureAssetsController', () => {
  const actor = { id: 'own' } as AuthenticatedUser;
  it('delegates GET with authenticated actor', async () => {
    const assets = {
      getOwn: jest
        .fn<(...args: unknown[]) => Promise<unknown>>()
        .mockResolvedValue({ signatureFileId: null, sealFileId: null }),
    };
    await new PractitionerSignatureAssetsController(assets as never).getOwn(
      actor,
    );
    expect(assets.getOwn).toHaveBeenCalledWith(actor);
  });
  it('delegates PUT retaining explicit null', async () => {
    const assets = {
      setOwn: jest
        .fn<(...args: unknown[]) => Promise<unknown>>()
        .mockResolvedValue({ signatureFileId: null, sealFileId: null }),
    };
    await new PractitionerSignatureAssetsController(assets as never).setOwn(
      { signatureFileId: null },
      actor,
    );
    expect(assets.setOwn).toHaveBeenCalledWith(
      { signatureFileId: null },
      actor,
    );
  });
});
