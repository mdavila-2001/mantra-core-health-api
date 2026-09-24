import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { UpdateOwnCredentialDto } from './update-own-credential.dto';

async function rutasConError(
  cuerpo: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(UpdateOwnCredentialDto, cuerpo);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors
    .flatMap((error: ValidationError) =>
      error.constraints ? [error.property] : [],
    )
    .sort();
}

describe('UpdateOwnCredentialDto', () => {
  it('acepta un PATCH vacío y todos los campos editables válidos', async () => {
    expect(await rutasConError({})).toEqual([]);
    expect(
      await rutasConError({
        credentialTypeConceptId: '7218acbc-5098-56ae-980a-9345961ced89',
        number: 'DIP-2024-17',
        issuingInstitutionText: '',
        issueDate: '2024-03-15',
        fileId: '7218acbc-5098-56ae-980a-9345961ced88',
      }),
    ).toEqual([]);
  });

  it('rechaza campos de dueño/estado/verificación y valores null', async () => {
    expect(
      await rutasConError({
        ownerUserId: 'user-1',
        stateConceptId: 'verified',
        verifiedByUserId: 'admin-1',
        number: null,
      }),
    ).toEqual(['number', 'ownerUserId', 'stateConceptId', 'verifiedByUserId']);
  });

  it('rechaza un número vacío o compuesto sólo de espacios', async () => {
    expect(await rutasConError({ number: '' })).toEqual(['number']);
    expect(await rutasConError({ number: '   ' })).toEqual(['number']);
  });
});
