import { describe, expect, it } from '@jest/globals';
import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { UpdateOwnSpecialtyDto } from './update-own-specialty.dto';
import { UpdateOwnLicenseDto } from './update-own-license.dto';

const UUID = '7218acbc-5098-56ae-980a-9345961ced89';

async function rutasConError<T extends object>(
  clase: ClassConstructor<T>,
  cuerpo: Record<string, unknown>,
): Promise<string[]> {
  const errors = await validate(plainToInstance(clase, cuerpo), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.map((error: ValidationError) => error.property).sort();
}

describe('UpdateOwnSpecialtyDto', () => {
  it('acepta vacío y los dos campos editables', async () => {
    expect(await rutasConError(UpdateOwnSpecialtyDto, {})).toEqual([]);
    expect(
      await rutasConError(UpdateOwnSpecialtyDto, {
        specialtyConceptId: UUID,
        boardCertified: true,
      }),
    ).toEqual([]);
  });

  it('isPrimary se rechaza: la principal tiene su propia ruta', async () => {
    expect(
      await rutasConError(UpdateOwnSpecialtyDto, { isPrimary: true }),
    ).toEqual(['isPrimary']);
  });

  it('rechaza claves de estado y un uuid inválido', async () => {
    expect(
      await rutasConError(UpdateOwnSpecialtyDto, {
        verificationStatusConceptId: UUID,
        specialtyConceptId: 'x',
      }),
    ).toEqual(['specialtyConceptId', 'verificationStatusConceptId']);
  });
});

describe('UpdateOwnLicenseDto', () => {
  it('acepta vacío y los cuatro campos editables', async () => {
    expect(await rutasConError(UpdateOwnLicenseDto, {})).toEqual([]);
    expect(
      await rutasConError(UpdateOwnLicenseDto, {
        licenseNumber: 'MP-9',
        regulatoryAuthority: 'SEDES La Paz',
        validFrom: '2024-03-15',
        fileId: UUID,
      }),
    ).toEqual([]);
  });

  it('rechaza estado, jurisdicción y vencimiento: los mueve el trámite', async () => {
    expect(
      await rutasConError(UpdateOwnLicenseDto, {
        stateConceptId: UUID,
        jurisdictionConceptId: UUID,
        validTo: '2030-01-01',
      }),
    ).toEqual(['jurisdictionConceptId', 'stateConceptId', 'validTo']);
  });

  it('rechaza un número vacío', async () => {
    expect(
      await rutasConError(UpdateOwnLicenseDto, { licenseNumber: '  ' }),
    ).toEqual(['licenseNumber']);
  });
});
