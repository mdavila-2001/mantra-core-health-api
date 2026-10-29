import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReviewAdmissionItemDto } from './admissions.dto';

const HASH = 'a'.repeat(64);

async function invalidFields(body: Record<string, unknown>): Promise<string[]> {
  const errors = await validate(plainToInstance(ReviewAdmissionItemDto, body), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.map((e) => e.property).sort();
}

describe('ReviewAdmissionItemDto · evidenceSha256 (S-2)', () => {
  const base = { decision: 'VERIFIED', sourceType: 'COLEGIO_MEDICO', expectedRowVersion: 2 };

  it('VERIFIED con la huella de 64 hex es válido', async () => {
    expect(await invalidFields({ ...base, evidenceSha256: HASH })).toEqual([]);
  });

  it('VERIFIED sin huella se rechaza en el borde', async () => {
    expect(await invalidFields(base)).toEqual(['evidenceSha256']);
  });

  it.each([
    ['corta', 'a'.repeat(63)],
    ['larga', 'a'.repeat(65)],
    ['mayúsculas', 'A'.repeat(64)],
    ['no hex', 'g'.repeat(64)],
    ['vacía', ''],
    ['con espacios', ` ${'a'.repeat(62)} `],
  ])('una huella %s se rechaza', async (_name, value) => {
    expect(await invalidFields({ ...base, evidenceSha256: value })).toEqual(['evidenceSha256']);
  });

  it('REJECTED e INFO_REQUIRED no la exigen, pero si vienen deben ser válidas', async () => {
    for (const decision of ['REJECTED', 'INFO_REQUIRED']) {
      expect(await invalidFields({ decision, reason: 'x', expectedRowVersion: 1 })).toEqual([]);
      expect(await invalidFields({ decision, reason: 'x', expectedRowVersion: 1, evidenceSha256: HASH })).toEqual([]);
      expect(await invalidFields({ decision, reason: 'x', expectedRowVersion: 1, evidenceSha256: 'zz' })).toEqual([
        'evidenceSha256',
      ]);
    }
  });
});
