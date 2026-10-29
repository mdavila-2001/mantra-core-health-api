import { describe, expect, it } from '@jest/globals';
import { admissionsEnvSchema, loadAdmissionsConfig } from './admissions.config';

const env = (values: Record<string, string>): NodeJS.ProcessEnv =>
  values as unknown as NodeJS.ProcessEnv;

describe('configuración de admisiones', () => {
  it('en desarrollo: cuatro ojos apagado y SECURITY_ADMIN hereda los roles', () => {
    expect(loadAdmissionsConfig(env({ NODE_ENV: 'development' }))).toEqual({
      fourEyes: false,
      securityAdminInherits: true,
      slaBusinessDays: 3,
      defaultValidityMonths: 36,
      infoWindowDays: 30,
      maxResubmissions: 3,
    });
  });

  it('en producción: cuatro ojos encendido y los roles se asignan explícitamente', () => {
    const config = loadAdmissionsConfig(env({ NODE_ENV: 'production' }));
    expect(config.fourEyes).toBe(true);
    expect(config.securityAdminInherits).toBe(false);
  });

  it('el entorno puede invertir los defaults en las dos direcciones', () => {
    expect(
      loadAdmissionsConfig(
        env({ NODE_ENV: 'production', ADMISSIONS_FOUR_EYES: 'false' }),
      ).fourEyes,
    ).toBe(false);
    expect(
      loadAdmissionsConfig(
        env({ NODE_ENV: 'test', ADMISSIONS_FOUR_EYES: 'true' }),
      ).fourEyes,
    ).toBe(true);
  });

  it('valores numéricos inválidos caen al default en vez de romper el servicio', () => {
    const config = loadAdmissionsConfig(
      env({
        ADMISSIONS_SLA_BUSINESS_DAYS: 'abc',
        ADMISSIONS_DEFAULT_VALIDITY_MONTHS: '-2',
        ADMISSIONS_INFO_WINDOW_DAYS: '',
      }),
    );
    expect(config.slaBusinessDays).toBe(3);
    expect(config.defaultValidityMonths).toBe(36);
    expect(config.infoWindowDays).toBe(30);
  });

  it('acepta valores válidos, incluido 0 reenvíos (los desactiva)', () => {
    const config = loadAdmissionsConfig(
      env({
        ADMISSIONS_SLA_BUSINESS_DAYS: '5',
        ADMISSIONS_DEFAULT_VALIDITY_MONTHS: '12',
        ADMISSIONS_MAX_RESUBMISSIONS: '0',
      }),
    );
    expect(config.slaBusinessDays).toBe(5);
    expect(config.defaultValidityMonths).toBe(12);
    expect(config.maxResubmissions).toBe(0);
  });

  it('el esquema de entorno rechaza valores fuera de rango y acepta los vacíos', () => {
    expect(admissionsEnvSchema.validate({ ADMISSIONS_SLA_BUSINESS_DAYS: 0 }).error).toBeDefined();
    expect(admissionsEnvSchema.validate({ ADMISSIONS_SLA_BUSINESS_DAYS: 31 }).error).toBeDefined();
    expect(admissionsEnvSchema.validate({ ADMISSIONS_FOUR_EYES: '' }).error).toBeUndefined();
    expect(admissionsEnvSchema.validate({}).value).toMatchObject({
      ADMISSIONS_SLA_BUSINESS_DAYS: 3,
    });
  });
});
