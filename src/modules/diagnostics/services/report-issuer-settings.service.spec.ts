import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { ReportIssuerSettingsService } from './report-issuer-settings.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const actor = { id: 'u-owner' } as any;
const dto = {
  signatureFileId: 'sig',
  sealFileId: null,
  responsibleName: 'Bioq. Zapata',
  responsibleTitle: 'Directora técnica',
};

function build(canAdminister = true, existing: any = null) {
  const tx: any = {
    create: mockFn((_c: any, data: any) => ({ ...data })),
    flush: mockFn(async () => undefined),
  };
  const em: any = {
    fork: () => tx,
    transactional: mockFn(async (cb: any) => cb(tx)),
  };
  const repo = { findIssuerSettings: mockFn(async () => existing) };
  const permissions = {
    assertCanRead: mockFn(async () => undefined),
    assertCanAdminister: mockFn(async () => {
      if (!canAdminister) throw new ForbiddenException();
    }),
  };
  const attachable = { assertUsableBy: mockFn(async () => ({})) };
  const service = new ReportIssuerSettingsService(
    em,
    repo as any,
    permissions as any,
    attachable as any,
  );
  return { service, tx, attachable, permissions };
}

describe('ReportIssuerSettingsService', () => {
  it('reads empty settings for a member', async () => {
    await expect(build().service.get('lab', actor)).resolves.toEqual({
      signatureFileId: null,
      sealFileId: null,
      responsibleName: null,
      responsibleTitle: null,
    });
  });

  it('OWNER/ADMIN upserts with tenant PNG/JPEG images', async () => {
    const t = build();
    await expect(t.service.set('lab', dto, actor)).resolves.toEqual(dto);
    expect(t.attachable.assertUsableBy).toHaveBeenCalledWith(
      t.tx,
      'sig',
      actor,
      expect.objectContaining({
        allowedMimeTypes: ['image/png', 'image/jpeg'],
      }),
    );
    expect(t.tx.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ custodianTenantId: 'lab' }),
      { partial: true },
    );
  });

  it("a kept image is not re-checked; someone else's new image is the uniform 404", async () => {
    const kept = build(true, { signatureFileId: 'sig', sealFileId: null });
    await kept.service.set('lab', dto, actor);
    expect(kept.attachable.assertUsableBy).not.toHaveBeenCalled();
    const foreign = build();
    foreign.attachable.assertUsableBy.mockRejectedValue(
      new ForbiddenException(),
    );
    await expect(foreign.service.set('lab', dto, actor)).rejects.toMatchObject({
      status: 404,
    });
    expect(foreign.tx.flush).not.toHaveBeenCalled();
  });

  it('a non-administrator cannot change them', async () => {
    const t = build(false);
    await expect(t.service.set('lab', dto, actor)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(t.tx.flush).not.toHaveBeenCalled();
  });
});
