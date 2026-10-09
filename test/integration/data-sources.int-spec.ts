import request from 'supertest';
import { bearer, bootstrapTestApp, type TestContext } from './harness';
import {
  ConnectionRegistry,
  DataSourceRouter,
  PersistenceMetrics,
  persistenceSessionToken,
  RESOLVED_DATA_SOURCES,
  RoutedPersistenceSession,
  type ResolvedDataSources,
} from '../../src/persistence';
import { SCHEDULING_MODULE } from '../../src/modules/scheduling/scheduling.tokens';

/**
 * Enrutado de datos y estado de las fuentes, contra la aplicación real.
 *
 * Cubre lo que las pruebas unitarias no pueden: que el módulo se cablee de
 * verdad dentro de `AppModule`, que el registro quede poblado en el arranque y
 * que el módulo piloto opere por el camino enrutado cuando el flag lo activa.
 *
 * El flag se fija ANTES de levantar la aplicación porque el proveedor de sesión
 * lee el entorno al construirse: cambiarlo después no tendría efecto y la
 * prueba estaría midiendo el camino directo mientras cree medir el enrutado.
 */
process.env.PERSISTENCE_PORTS_MODULES = SCHEDULING_MODULE;

describe('Fuentes de datos y enrutado read/write (aplicación real)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
    delete process.env.PERSISTENCE_PORTS_MODULES;
  });

  describe('registro de conexiones', () => {
    it('publica las dos rutas sobre un único pool cuando son equivalentes', () => {
      // Es el escenario A del §9 y el predeterminado del proyecto: los dos
      // nombres lógicos existen, pero no hay dos pools contra el servidor.
      const registry = ctx.app.get(ConnectionRegistry);
      const sources = ctx.app.get<ResolvedDataSources>(RESOLVED_DATA_SOURCES);

      expect(registry.has(sources.read.name)).toBe(true);
      expect(registry.has(sources.write.name)).toBe(true);
      if (sources.sharesConnection) {
        expect(registry.distinctConnections()).toHaveLength(1);
        expect(registry.get(sources.read.name)).toBe(
          registry.get(sources.write.name),
        );
      }
    });

    it('la conexión responde de verdad', async () => {
      const registry = ctx.app.get(ConnectionRegistry);
      const health = await registry
        .get(ctx.app.get<ResolvedDataSources>(RESOLVED_DATA_SOURCES).write.name)
        .healthCheck();

      expect(health.status).toBe('up');
      expect(health.engine).toBe('postgresql');
    });
  });

  describe('router', () => {
    it('resuelve escrituras y lecturas por sus rutas declaradas', () => {
      const router = ctx.app.get(DataSourceRouter);
      const sources = ctx.app.get<ResolvedDataSources>(RESOLVED_DATA_SOURCES);

      expect(
        router.resolve({ module: SCHEDULING_MODULE, operation: 'write' })
          .connectionName,
      ).toBe(sources.write.name);
      expect(
        router.resolve({ module: SCHEDULING_MODULE, operation: 'read' })
          .connectionName,
      ).toBe(sources.read.name);
    });

    it('nunca resuelve una escritura a la conexión administrativa', () => {
      const router = ctx.app.get(DataSourceRouter);
      const resolved = router.resolve({
        module: SCHEDULING_MODULE,
        operation: 'write',
      });
      expect(resolved.connection.role).not.toBe('admin');
    });
  });

  describe('módulo piloto', () => {
    it('usa la sesión enrutada cuando el flag lo incluye', () => {
      const session = ctx.app.get(persistenceSessionToken(SCHEDULING_MODULE));
      expect(session).toBeInstanceOf(RoutedPersistenceSession);
    });

    it('una lectura del piloto sale por la ruta de lectura y queda medida', async () => {
      const metrics = ctx.app.get(PersistenceMetrics);
      const sources = ctx.app.get<ResolvedDataSources>(RESOLVED_DATA_SOURCES);
      metrics.reset();

      const response = await request(ctx.app.getHttpServer())
        .get('/scheduling/internal/waitlist-candidates')
        .set(bearer(ctx.adminToken));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.slotIds)).toBe(true);

      const counters = metrics.snapshot()[sources.read.name];
      expect(counters?.reads).toBeGreaterThan(0);
      expect(counters?.errors ?? 0).toBe(0);
    });
  });

  describe('GET /health/data-sources', () => {
    it('informa del estado y del enrutado vigente', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/health/data-sources')
        .set(bearer(ctx.adminToken));

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('up');
      expect(response.body.pools).toBeGreaterThanOrEqual(1);
      expect(response.body.routing.default).toEqual({
        read: expect.any(String),
        write: expect.any(String),
      });
    });

    it('no expone host, usuario, base ni cadena de conexión', () => {
      // El §44 lo prohíbe: un health check suele ser el endpoint menos
      // protegido de un servicio, y publicar la topología interna regala el
      // primer paso de un movimiento lateral.
      return request(ctx.app.getHttpServer())
        .get('/health/data-sources')
        .set(bearer(ctx.adminToken))
        .expect(200)
        .then(({ text }) => {
          expect(text).not.toContain(process.env.DB_HOST ?? 'localhost');
          expect(text).not.toContain(process.env.DB_USER ?? 'mantra');
          expect(text).not.toContain(process.env.DB_PASSWORD ?? '###');
          expect(text).not.toContain('postgresql://');
        });
    });

    it('exige autenticación', async () => {
      const response = await request(ctx.app.getHttpServer()).get(
        '/health/data-sources',
      );
      expect(response.status).toBe(401);
    });
  });

  describe('GET /health/data-sources/metrics', () => {
    it('devuelve los contadores por conexión', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/health/data-sources/metrics')
        .set(bearer(ctx.adminToken));

      expect(response.status).toBe(200);
      expect(typeof response.body).toBe('object');
    });
  });
});
