import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import {
  InsurancePortabilityPublicController,
  ParseShaHashPipe,
} from './insurance-portability-public.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const LOWER_HASH =
  'e404be51f92fcabebab7b829051cb2522d940ec09c3f5ef8f63ee122d1beedb7';
const UPPER_HASH = LOWER_HASH.toUpperCase();
const MIXED_HASH = LOWER_HASH.slice(0, 32) + LOWER_HASH.slice(32).toUpperCase();

describe('ParseShaHashPipe', () => {
  const pipe = new ParseShaHashPipe();

  it('acepta un hash en minúsculas y lo devuelve igual', () => {
    expect(pipe.transform(LOWER_HASH, { data: 'manifestHash' } as never)).toBe(
      LOWER_HASH,
    );
  });

  it('acepta un hash en MAYÚSCULAS y lo normaliza a minúsculas', () => {
    expect(pipe.transform(UPPER_HASH, { data: 'manifestHash' } as never)).toBe(
      LOWER_HASH,
    );
  });

  it('acepta un hash con mayúsculas y minúsculas mezcladas', () => {
    expect(pipe.transform(MIXED_HASH, { data: 'manifestHash' } as never)).toBe(
      LOWER_HASH,
    );
  });

  it('rechaza 63 caracteres con 400', () => {
    expect(() =>
      pipe.transform(LOWER_HASH.slice(0, 63), {
        data: 'manifestHash',
      } as never),
    ).toThrow(BadRequestException);
  });

  it('rechaza un carácter no hexadecimal con 400', () => {
    const noHex = `g${LOWER_HASH.slice(1)}`;
    expect(() =>
      pipe.transform(noHex, { data: 'manifestHash' } as never),
    ).toThrow(BadRequestException);
  });
});

describe('InsurancePortabilityPublicController', () => {
  it('delega en InsurancePortabilityService.verify y devuelve el resultado sin tocarlo', async () => {
    const resultado = {
      status: 'VALID' as const,
      certificateId: 'certificate-a',
      manifestHash: LOWER_HASH,
      generatedAt: '2026-09-18T18:00:00.000Z',
      recordCount: 14,
      algorithm: 'SHA-256' as const,
      issuer: 'AloVida',
    };
    const service = { verify: mockFn().mockResolvedValue(resultado) };
    const controller = new InsurancePortabilityPublicController(service as any);

    const res = await controller.verify(LOWER_HASH);

    expect(service.verify).toHaveBeenCalledWith(LOWER_HASH);
    expect(res).toBe(resultado);
    // Sin PHI: ni nombre ni documento del titular en la respuesta.
    expect(res).not.toHaveProperty('patientName');
    expect(res).not.toHaveProperty('nationalId');
  });
});
