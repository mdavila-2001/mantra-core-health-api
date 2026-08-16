import { loadSeedBootEnv, seedBootEnvSchema } from './seed-boot.env';

describe('loadSeedBootEnv', () => {
  it('siembra por defecto cuando la variable no está declarada', () => {
    // El default tiene que ser el comportamiento previo al flag: un entorno que
    // nunca oyó hablar de SEED_ON_BOOT no puede arrancar con el catálogo vacío.
    expect(loadSeedBootEnv({}).enabled).toBe(true);
  });

  it('apaga la siembra solo con el literal "false"', () => {
    expect(loadSeedBootEnv({ SEED_ON_BOOT: 'false' }).enabled).toBe(false);
  });

  it('siembra con "true"', () => {
    expect(loadSeedBootEnv({ SEED_ON_BOOT: 'true' }).enabled).toBe(true);
  });

  it('ante un valor que no entiende, siembra en vez de saltearse', () => {
    // Elegir el lado seguro importa: saltear por un typo deja la base a medias
    // y el fallo aparece mucho después, en la primera escritura con
    // `*_concept_id`, sin nada que lo relacione con la configuración.
    expect(loadSeedBootEnv({ SEED_ON_BOOT: 'no' }).enabled).toBe(true);
    expect(loadSeedBootEnv({ SEED_ON_BOOT: '' }).enabled).toBe(true);
  });
});

describe('seedBootEnvSchema', () => {
  it('acepta la ausencia de la variable y la resuelve encendida', () => {
    const { error, value } = seedBootEnvSchema.validate({});
    expect(error).toBeUndefined();
    expect(value.SEED_ON_BOOT).toBe(true);
  });

  it('acepta los literales de texto que se escriben en un .env', () => {
    expect(
      seedBootEnvSchema.validate({ SEED_ON_BOOT: 'false' }).error,
    ).toBeUndefined();
    expect(
      seedBootEnvSchema.validate({ SEED_ON_BOOT: 'true' }).error,
    ).toBeUndefined();
  });

  it('rechaza un valor que no es booleano', () => {
    expect(
      seedBootEnvSchema.validate({ SEED_ON_BOOT: 'quizás' }).error,
    ).toBeDefined();
  });

  it('no se prohíbe en producción, a diferencia del bypass de verificación', () => {
    // Apagarlo en producción es legítimo si la siembra corre como paso de
    // despliegue con `yarn seed:boot`. Lo que no puede es pasar inadvertido, y
    // de eso se encarga el aviso del arranque.
    const { error } = seedBootEnvSchema.validate({
      NODE_ENV: 'production',
      SEED_ON_BOOT: 'false',
    });
    expect(error).toBeUndefined();
  });
});
