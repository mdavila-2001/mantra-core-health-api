import {
  areEquivalent,
  connectionFingerprint,
  parsePostgresUrl,
  redactConnectionUrl,
  type PostgresConnectionConfig,
} from './connection-descriptor';
import { DataSourceConfigurationError } from '../errors/persistence.errors';

/** Descriptor base sobre el que las pruebas aplican una variación. */
function config(
  overrides: Partial<PostgresConnectionConfig> = {},
): PostgresConnectionConfig {
  return {
    name: 'postgres-write',
    role: 'write',
    host: 'db.interno',
    port: 5432,
    user: 'app_writer',
    password: 'secreto-que-no-debe-salir',
    database: 'app',
    ssl: false,
    pool: { min: 2, max: 10 },
    provider: 'local',
    ...overrides,
  };
}

describe('connectionFingerprint', () => {
  it('nunca incluye la contraseña', () => {
    expect(connectionFingerprint(config())).not.toContain(
      'secreto-que-no-debe-salir',
    );
  });

  it('es estable: dos descriptores iguales dan la misma huella', () => {
    expect(connectionFingerprint(config())).toBe(
      connectionFingerprint(config()),
    );
  });

  it('ignora el pool y el nombre lógico, que no cambian el destino', () => {
    const base = connectionFingerprint(config());
    expect(connectionFingerprint(config({ name: 'otro-nombre' }))).toBe(base);
    expect(connectionFingerprint(config({ pool: { min: 0, max: 99 } }))).toBe(
      base,
    );
    expect(connectionFingerprint(config({ role: 'read' }))).toBe(base);
  });

  it.each([
    ['host', { host: 'otra.maquina' }],
    ['puerto', { port: 6432 }],
    ['base', { database: 'otra' }],
    ['TLS', { ssl: true }],
  ])('distingue conexiones que difieren en %s', (_label, overrides) => {
    expect(connectionFingerprint(config(overrides))).not.toBe(
      connectionFingerprint(config()),
    );
  });

  it('distingue el usuario: lector y escritor no son intercambiables', () => {
    // Es la propiedad crítica de toda la separación de privilegios. Si dos
    // roles distintos compartieran huella, el registro colapsaría sus pools y
    // las lecturas acabarían ejecutándose con la credencial de escritura.
    expect(connectionFingerprint(config({ user: 'app_reader' }))).not.toBe(
      connectionFingerprint(config({ user: 'app_writer' })),
    );
  });
});

describe('areEquivalent', () => {
  it('considera equivalentes dos rutas al mismo destino con la misma credencial', () => {
    expect(
      areEquivalent(config({ name: 'postgres-read', role: 'read' }), config()),
    ).toBe(true);
  });

  it('no considera equivalentes dos roles distintos contra el mismo servidor', () => {
    expect(areEquivalent(config({ user: 'app_reader' }), config())).toBe(false);
  });
});

describe('redactConnectionUrl', () => {
  it('sustituye la contraseña', () => {
    const redacted = redactConnectionUrl(
      'postgresql://app:sup3rs3cr3t@db.interno:5432/app',
    );
    expect(redacted).not.toContain('sup3rs3cr3t');
    expect(redacted).toContain('app:***@db.interno');
  });

  it('no vuelca una cadena que no parsea, por si llevara la clave dentro', () => {
    expect(redactConnectionUrl('esto no es una url con clave=abc123')).toBe(
      '«cadena de conexión ilegible»',
    );
  });
});

describe('parsePostgresUrl', () => {
  it('extrae los componentes', () => {
    expect(
      parsePostgresUrl(
        'postgresql://u:p@h:6543/basedatos',
        'POSTGRES_READ_URL',
      ),
    ).toEqual({
      host: 'h',
      port: 6543,
      user: 'u',
      password: 'p',
      database: 'basedatos',
      ssl: false,
    });
  });

  it('aplica el puerto 5432 cuando la URL lo omite', () => {
    expect(
      parsePostgresUrl('postgresql://u:p@h/base', 'POSTGRES_READ_URL').port,
    ).toBe(5432);
  });

  it('decodifica credenciales percent-encoded', () => {
    // Una contraseña con `@` viaja codificada. Usarla sin decodificar produce
    // un fallo de autenticación que parece un problema de credenciales y no de
    // formato, y cuesta horas de depuración.
    const parsed = parsePostgresUrl(
      'postgresql://us%40r:p%40ss%2Fword@h/base',
      'POSTGRES_READ_URL',
    );
    expect(parsed.user).toBe('us@r');
    expect(parsed.password).toBe('p@ss/word');
  });

  it.each([
    ['sslmode=require', true],
    ['sslmode=verify-full', true],
    ['sslmode=disable', false],
  ])('interpreta %s como ssl=%s', (query, expected) => {
    expect(parsePostgresUrl(`postgresql://u:p@h/base?${query}`, 'X').ssl).toBe(
      expected,
    );
  });

  it.each([
    ['no es una url', 'no-es-una-url'],
    ['esquema ajeno', 'mysql://u:p@h/base'],
    ['sin base', 'postgresql://u:p@h'],
    ['sin usuario', 'postgresql://h/base'],
  ])('rechaza %s nombrando la variable culpable', (_label, url) => {
    expect(() => parsePostgresUrl(url, 'POSTGRES_READ_URL')).toThrow(
      DataSourceConfigurationError,
    );
    expect(() => parsePostgresUrl(url, 'POSTGRES_READ_URL')).toThrow(
      /POSTGRES_READ_URL/,
    );
  });

  it('no incluye la contraseña en el mensaje de error', () => {
    try {
      parsePostgresUrl('mysql://u:sup3rs3cr3t@h/base', 'POSTGRES_READ_URL');
      throw new Error('debería haber lanzado');
    } catch (error) {
      expect((error as Error).message).not.toContain('sup3rs3cr3t');
    }
  });
});
