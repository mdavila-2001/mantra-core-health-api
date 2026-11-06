import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { bootstrapTestApp, type TestContext } from './harness';

const ejecutar = promisify(execFile);

/**
 * F09 · el comprobador de deriva de esquema detecta lo que dice detectar.
 *
 * `scripts/db/check-schema-drift.mjs` existe porque el init de Postgres puede
 * abortar antes de aplicar los parches y dejar la base desfasada en silencio;
 * el síntoma aparece mucho después, como un seed que falla por una columna
 * inexistente. Un comprobador así sólo sirve si se sabe que **encuentra** la
 * deriva: uno que siempre informe «todo bien» es peor que no tenerlo, porque da
 * una garantía falsa.
 *
 * Por eso acá no se afirma que esta base esté al día —hoy no lo está, y eso es
 * información del entorno, no del código—. Se planta una deriva conocida y se
 * verifica que aparezca, y que desaparezca al deshacerla.
 *
 * Contra PostgreSQL real por necesidad: el script lee `information_schema`.
 */
describe('F09 · el comprobador de deriva encuentra la deriva (integración)', () => {
  let ctx: TestContext;
  const sufijo = randomUUID().slice(0, 8).replace(/-/g, '');
  const tablaSonda = `system_ops.drift_probe_${sufijo}`;

  const sql = (query: string): Promise<unknown> =>
    ctx.orm.em.fork().getConnection().execute(query);

  /** Corre el comprobador y devuelve su informe en JSON. */
  async function comprobar(): Promise<{
    tablasDeclaradas: number;
    tablasEnLaBase: number;
    tablasFaltantes: string[];
    columnasFaltantes: string[];
    columnasNoDeclaradas: string[];
    tablasNoDeclaradas: string[];
    hayDeriva: boolean;
  }> {
    const script = join(
      process.cwd(),
      'scripts',
      'db',
      'check-schema-drift.mjs',
    );
    // Sin --strict: el script sale 0 aunque haya deriva, que es lo que se
    // quiere para leer el informe. La detección se afirma sobre el JSON.
    const { stdout } = await ejecutar(process.execPath, [script, '--json'], {
      env: process.env,
      maxBuffer: 16 * 1024 * 1024,
    });
    return JSON.parse(stdout);
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  }, 180_000);

  afterAll(async () => {
    await sql(`DROP TABLE IF EXISTS ${tablaSonda}`).catch(() => undefined);
    await ctx.app.close();
  });

  it('lee el DDL versionado completo', async () => {
    const informe = await comprobar();
    // El repositorio declara más de mil tablas. Si este número se desploma, el
    // generador de DDL cambió de forma y el parser dejó de reconocerlo —que es
    // justo el modo en que un comprobador empieza a mentir.
    expect(informe.tablasDeclaradas).toBeGreaterThan(1000);
    expect(informe.tablasEnLaBase).toBeGreaterThan(1000);
  });

  it('no denuncia como faltante una tabla que sí está en la base', async () => {
    const informe = await comprobar();
    expect(informe.tablasFaltantes).not.toContain(
      'system_ops.restore_test_runs',
    );
  });

  // The tables of v4.2.89 (written report) and v4.2.90 (opening hours) reach a
  // live base through their patches; the versioned DDL (`yarn db:vendor`) must
  // declare them too, or a base rebuilt from `database/SQL` diverges from the
  // one in production.
  it('el DDL versionado declara las tablas de los parches v4.2.89 y v4.2.90', async () => {
    const informe = await comprobar();
    for (const tabla of [
      'diagnostics.report_drafts',
      'diagnostics.report_draft_files',
      'diagnostics.report_issuer_settings',
      'directory.tenant_opening_hours',
    ]) {
      expect(informe.tablasNoDeclaradas).not.toContain(tabla);
      expect(informe.tablasFaltantes).not.toContain(tabla);
    }
  }, 180_000);

  it('detecta una tabla que está en la base y el DDL no declara', async () => {
    const antes = await comprobar();
    expect(antes.tablasNoDeclaradas).not.toContain(tablaSonda);

    await sql(`CREATE TABLE ${tablaSonda} (id uuid NOT NULL)`);

    const durante = await comprobar();
    expect(durante.tablasNoDeclaradas).toContain(tablaSonda);

    await sql(`DROP TABLE ${tablaSonda}`);

    const despues = await comprobar();
    expect(despues.tablasNoDeclaradas).not.toContain(tablaSonda);
  }, 180_000);
});
