import { describe, expect, it } from '@jest/globals';
import {
  admissionIdentityEnvSchema,
  normalizeDocumentNumber,
  protectDocument,
} from './admission-identity';

describe('documento del ingreso sin el número en claro', () => {
  it('el mismo CI (con o sin separadores) da el mismo HMAC; otra clave, otro', () => {
    const a = protectDocument('IDV_CI', '1234567 SC', 'k'.repeat(32));
    const b = protectDocument('IDV_CI', '1234567-sc', 'k'.repeat(32));
    const c = protectDocument('IDV_CI', '1234567SC', 'x'.repeat(32));
    expect(a.hmac).toBe(b.hmac);
    expect(a.hmac).not.toBe(c.hmac);
    expect(a.hmac).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toEqual({ type: 'IDV_CI', last4: '67SC', hmac: a.hmac });
    expect(JSON.stringify(a)).not.toContain('1234567');
  });
  it('normaliza espacios, guiones, puntos y mayúsculas', () => {
    expect(normalizeDocumentNumber(' 12.345-67 sc ')).toBe('1234567SC');
  });
  it('en producción la clave es obligatoria y no puede ser la de desarrollo', () => {
    expect(
      admissionIdentityEnvSchema.validate({ NODE_ENV: 'production' }).error,
    ).toBeDefined();
    expect(
      admissionIdentityEnvSchema.validate({
        NODE_ENV: 'production',
        ADMISSION_ID_HMAC_KEY: 'k'.repeat(32),
      }).error,
    ).toBeUndefined();
    expect(
      admissionIdentityEnvSchema.validate({ NODE_ENV: 'development' }).error,
    ).toBeUndefined();
  });
});
