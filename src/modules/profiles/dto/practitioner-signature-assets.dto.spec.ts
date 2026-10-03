import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SetPractitionerSignatureAssetsDto } from './practitioner-signature-assets.dto';

describe('SetPractitionerSignatureAssetsDto', () => {
  it.each([
    {},
    { signatureFileId: null },
    { sealFileId: null },
    { signatureFileId: '11111111-1111-4111-8111-111111111111' },
  ])('accepts absence, removal and UUID: %j', async (body) => {
    expect(
      await validate(plainToInstance(SetPractitionerSignatureAssetsDto, body)),
    ).toEqual([]);
  });
  it.each([
    { signatureFileId: '' },
    { sealFileId: 4 },
    { signatureFileId: 'bad' },
  ])('rejects invalid references: %j', async (body) => {
    expect(
      await validate(plainToInstance(SetPractitionerSignatureAssetsDto, body)),
    ).not.toEqual([]);
  });
  it('rejects unknown ownership fields under the global whitelist policy', async () => {
    expect(
      await validate(
        plainToInstance(SetPractitionerSignatureAssetsDto, {
          profileId: 'other',
        }),
        { whitelist: true, forbidNonWhitelisted: true },
      ),
    ).not.toEqual([]);
  });
});
