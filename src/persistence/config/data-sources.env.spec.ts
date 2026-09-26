import { resolveDataSources } from './data-sources.env';
import { DataSourceConfigurationError } from '../errors/persistence.errors';

/** Entorno heredado mínimo: lo único que un despliegue actual define hoy. */
const LEGACY: NodeJS.ProcessEnv = {
  DB_HOST: 'localhost',
  DB_PORT: '5434',
  DB_USER: 'mantra',
  DB_PASSWORD: 'clave',
  DB_NAME: 'mantra_redesa_health',
};

describe('resolveDataSources', () => {
  describe('compatibilidad hacia atrás', () => {
    it('sin ninguna variable nueva, lectura y escritura comparten conexión', () => {
      // Es la garantía central de toda la refactorización: un despliegue que no
      // sabe que esto existe debe seguir arrancando con un solo pool.
      const sources = resolveDataSources(LEGACY);

      expect(sources.sharesConnection).toBe(true);
      expect(sources.read.host).toBe(sources.write.host);
      expect(sources.read.user).toBe(sources.write.user);
      expect(sources.admin).toBeUndefined();
    });

    it('respeta DB_APP_USER, que es el rol de runtime sujeto a RLS', () => {
      const sources = resolveDataSources({
        ...LEGACY,
        DB_APP_USER: 'mantra_app',
        DB_APP_PASSWORD: 'otra',
      });

      expect(sources.write.user).toBe('mantra_app');
      expect(sources.read.user).toBe('mantra_app');
    });

    it('la estrategia de fallback por defecto es fail-fast', () => {
      // Un desvío al primario cambiaría la consistencia sin pedirlo y, con
      // separación por rol, ejecutaría lecturas con la credencial de escritura.
      expect(resolveDataSources(LEGACY).readFallback).toBe('fail-fast');
    });
  });

  describe('rutas separadas', () => {
    it('detecta que dejan de ser equivalentes al cambiar solo el usuario', () => {
      const sources = resolveDataSources({
        ...LEGACY,
        DB_READ_USER: 'mantra_reader',
        DB_READ_PASSWORD: 'clave-lector',
      });

      expect(sources.sharesConnection).toBe(false);
      expect(sources.read.user).toBe('mantra_reader');
      expect(sources.write.user).toBe('mantra');
      expect(sources.read.host).toBe(sources.write.host);
    });

    it('acepta una réplica en otro servidor vía URL', () => {
      const sources = resolveDataSources({
        ...LEGACY,
        POSTGRES_READ_URL: 'postgresql://lector:clave@replica.interno:5432/app',
      });

      expect(sources.sharesConnection).toBe(false);
      expect(sources.read.host).toBe('replica.interno');
      expect(sources.read.role).toBe('read');
    });

    it('registra la conexión administrativa solo si se declara', () => {
      const sources = resolveDataSources({
        ...LEGACY,
        POSTGRES_ADMIN_URL: 'postgresql://owner:clave@localhost:5434/app',
      });

      expect(sources.admin?.role).toBe('admin');
      // Pool diminuto: la administrativa migra y aprovisiona, no atiende tráfico.
      expect(sources.admin?.pool.max).toBe(2);
    });

    it('trata las URL en blanco como ausentes, no como error', () => {
      // Coolify materializa toda variable declarada en su panel dentro del
      // contenedor aunque el operador la deje sin valor: llega como cadena
      // vacía, no como variable inexistente. Sin este caso, un despliegue que
      // nunca usó rutas separadas rompe en el arranque por una URL que nadie
      // configuró.
      const sources = resolveDataSources({
        ...LEGACY,
        POSTGRES_WRITE_URL: '',
        POSTGRES_READ_URL: '',
        POSTGRES_ADMIN_URL: '',
      });

      expect(sources.sharesConnection).toBe(true);
      expect(sources.admin).toBeUndefined();
    });

    it('hereda el pool de lectura del general y admite el suyo propio', () => {
      expect(
        resolveDataSources({ ...LEGACY, DB_POOL_MAX: '20' }).read.pool.max,
      ).toBe(20);
      expect(
        resolveDataSources({
          ...LEGACY,
          DB_POOL_MAX: '20',
          DB_READ_POOL_MAX: '5',
        }).read.pool.max,
      ).toBe(5);
    });
  });

  describe('validación de arranque', () => {
    it.each(['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'])(
      'aborta si falta %s',
      (missing) => {
        const env = { ...LEGACY };
        delete env[missing];
        expect(() => resolveDataSources(env)).toThrow(
          DataSourceConfigurationError,
        );
        expect(() => resolveDataSources(env)).toThrow(new RegExp(missing));
      },
    );

    it('aborta si el mínimo del pool supera al máximo', () => {
      expect(() =>
        resolveDataSources({ ...LEGACY, DB_POOL_MIN: '20', DB_POOL_MAX: '5' }),
      ).toThrow(/mínimo/);
    });

    it('aborta si dos conexiones comparten nombre lógico apuntando a sitios distintos', () => {
      // Con nombres ambiguos el enrutado devolvería una conexión u otra según el
      // orden de inserción: un fallo que no se reproduce en local.
      expect(() =>
        resolveDataSources({
          ...LEGACY,
          DATA_READ_CONNECTION_NAME: 'compartido',
          DATA_WRITE_CONNECTION_NAME: 'compartido',
          DB_READ_USER: 'mantra_reader',
        }),
      ).toThrow(/está declarada dos veces|dos veces/);
    });

    it('acepta el mismo nombre si ambas rutas apuntan al mismo destino', () => {
      expect(() =>
        resolveDataSources({
          ...LEGACY,
          DATA_READ_CONNECTION_NAME: 'primary',
          DATA_WRITE_CONNECTION_NAME: 'primary',
        }),
      ).not.toThrow();
    });

    it('rechaza una URL de lectura mal formada', () => {
      expect(() =>
        resolveDataSources({ ...LEGACY, POSTGRES_READ_URL: 'mysql://u:p@h/b' }),
      ).toThrow(DataSourceConfigurationError);
    });
  });
});
