import { appSecurityEnvSchema } from './app-security.env';

describe('appSecurityEnvSchema', () => {
  const productionBase = {
    NODE_ENV: 'production',
    MFA_ENCRYPTION_KEY: 'm'.repeat(32),
    WEBHOOK_SIGNING_KEY: 'w'.repeat(32),
    DOWNLOAD_URL_SECRET: 'd'.repeat(32),
  };

  it('acepta secretos independientes y robustos en producción', () => {
    expect(appSecurityEnvSchema.validate(productionBase).error).toBeUndefined();
  });

  it.each(['MFA_ENCRYPTION_KEY', 'WEBHOOK_SIGNING_KEY', 'DOWNLOAD_URL_SECRET'])(
    'rechaza producción cuando falta %s',
    (key) => {
      const env = { ...productionBase };
      delete env[key as keyof typeof env];
      expect(appSecurityEnvSchema.validate(env).error).toBeDefined();
    },
  );

  it('mantiene defaults explícitamente inseguros sólo fuera de producción', () => {
    const { error, value } = appSecurityEnvSchema.validate({
      NODE_ENV: 'development',
    });
    expect(error).toBeUndefined();
    expect(value.MFA_ENCRYPTION_KEY).toBe('dev-only-mfa-key-change-me');
  });

  it.each(['MFA_ENCRYPTION_KEY', 'WEBHOOK_SIGNING_KEY', 'DOWNLOAD_URL_SECRET'])(
    'trata %s vacía como ausente fuera de producción',
    (key) => {
      // `docker-compose.yml` pasa estos secretos como `${VARIABLE}`, que Compose
      // materializa como cadena vacía si no está en el `.env`. Sin esto el
      // contenedor de desarrollo no arranca.
      const { error, value } = appSecurityEnvSchema.validate({
        NODE_ENV: 'development',
        [key]: '',
      });
      expect(error).toBeUndefined();
      expect(value[key]).not.toBe('');
    },
  );

  it.each(['MFA_ENCRYPTION_KEY', 'WEBHOOK_SIGNING_KEY', 'DOWNLOAD_URL_SECRET'])(
    'sigue rechazando %s vacía en producción',
    (key) => {
      const env = { ...productionBase, [key]: '' };
      expect(appSecurityEnvSchema.validate(env).error).toBeDefined();
    },
  );
});
