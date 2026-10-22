import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { MikroORM } from '@mikro-orm/postgresql';
import { bootstrapTestApp, bearer, type TestContext } from '../harness';
import {
  CatalogConcepts,
  CatalogImportBatches,
} from '../../../src/modules/terminology/entities';

/**
 * Importación de conceptos desde archivo, contra Postgres real.
 *
 * ## Por qué esto no se puede probar con dobles
 *
 * El spec unitario del servicio ya cubre qué decide el importador con cada
 * archivo. Lo que no puede cubrir es lo único que importa acá: que la segunda
 * subida del mismo archivo no duplique nada. Esa garantía no vive en el
 * servicio — vive en el índice único `uq_catalog_concepts_version_code` y en
 * cómo Postgres resuelve dos escrituras sobre la misma versión. Un doble del
 * repositorio responde lo que se le programó y por eso nunca falla.
 *
 * ## Por qué cada prueba estrena su propia versión
 *
 * Las pruebas de esta suite corren en el mismo proceso y contra la misma base.
 * Compartir una versión las haría depender del orden: la de dry-run pasaría a
 * ver los conceptos que escribió la de idempotencia. Cada una crea su sistema
 * de codificación y su versión en borrador, con el prefijo reservado `ZZ-`.
 */
describe('Importación de conceptos desde archivo (integración)', () => {
  let ctx: TestContext;
  let orm: MikroORM;

  /**
   * Las fixtures son las versionadas del repositorio, no copias armadas acá.
   * Son las mismas que consume el front, así que una divergencia entre lo que
   * la API acepta y lo que la pantalla manda aparece como un rojo y no como una
   * sorpresa en producción.
   *
   * La suite corre como ESM (sin `__dirname`) y con la raíz del repositorio
   * como directorio de trabajo.
   */
  const FIXTURES = join(process.cwd(), 'test/fixtures/terminology-import');
  const OK_50 = readFileSync(join(FIXTURES, 'ok-50.csv'));
  const CON_ERRORES = readFileSync(join(FIXTURES, 'con-errores.csv'));

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    orm = ctx.orm;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  /**
   * Ejecuta la operación http.
   * @returns Resultado de http.
   */
  const http = () => request(ctx.app.getHttpServer());

  /**
   * Crea un sistema de codificación y una versión en borrador para una prueba.
   *
   * @param etiqueta - Qué prueba la usa, para poder reconocerla en la base.
   * @returns El identificador de la versión en borrador.
   */
  async function versionEnBorrador(etiqueta: string): Promise<string> {
    const uniq = `${etiqueta}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const sistema = await http()
      .post('/terminology/code-systems')
      .set(bearer(ctx.adminToken))
      .send({
        internalCode: `ZZ-${uniq}`,
        name: `Sistema de prueba ${uniq}`,
        canonicalUrl: `http://alovida.mock/zz/${uniq}`,
        sourceCode: `ZZ-${uniq}`,
        sourceName: 'Sintético',
      })
      .expect(201);

    const version = await http()
      .post(`/terminology/code-systems/${sistema.body.id}/versions`)
      .set(bearer(ctx.adminToken))
      .send({ version: '1', isDefault: true })
      .expect(201);

    return version.body.id as string;
  }

  /**
   * Sube un archivo al importador.
   *
   * @param versionId - La versión en borrador que recibe los conceptos.
   * @param archivo - El contenido del archivo.
   * @param nombre - Con qué nombre se sube.
   * @param campos - `dryRun` y `profile`, cuando la prueba los necesita.
   * @returns La respuesta de supertest, sin estado esperado: cada prueba lo asevera.
   */
  function subir(
    versionId: string,
    archivo: Buffer,
    nombre: string,
    campos: Record<string, string> = {},
  ): request.Test {
    let peticion = http()
      .post(`/terminology/versions/${versionId}/import-file`)
      .set(bearer(ctx.adminToken))
      .attach('file', archivo, { filename: nombre, contentType: 'text/csv' });

    for (const [clave, valor] of Object.entries(campos)) {
      peticion = peticion.field(clave, valor);
    }

    return peticion;
  }

  /**
   * Cuenta lo que quedó en la base para una versión.
   *
   * Se consulta con un contexto nuevo a propósito: el de la aplicación ya tiene
   * las entidades de la importación cargadas, y contar sobre él respondería con
   * lo que el importador creyó escribir en vez de con lo que la base tiene.
   *
   * @param versionId - La versión a medir.
   * @returns Conceptos y lotes de esa versión.
   */
  async function loQueQuedo(versionId: string): Promise<{
    conceptos: number;
    lotes: CatalogImportBatches[];
  }> {
    const em = orm.em.fork();

    return {
      conceptos: await em.count(CatalogConcepts, {
        codeSystemVersionId: versionId,
      }),
      lotes: await em.find(CatalogImportBatches, {
        codeSystemVersionId: versionId,
      }),
    };
  }

  it('el mismo archivo dos veces inserta una vez y omite la segunda', async () => {
    const versionId = await versionEnBorrador('idempotencia');

    const primera = await subir(versionId, OK_50, 'ok-50.csv').expect(201);
    expect(primera.body).toMatchObject({
      format: 'csv',
      profile: 'conceptos',
      dryRun: false,
      aborted: false,
      totalRead: 50,
      inserted: 50,
      skipped: 0,
      errors: 0,
    });

    const segunda = await subir(versionId, OK_50, 'ok-50.csv').expect(201);
    expect(segunda.body).toMatchObject({
      totalRead: 50,
      inserted: 0,
      skipped: 50,
      errors: 0,
      aborted: false,
    });

    const { conceptos, lotes } = await loQueQuedo(versionId);
    expect(conceptos).toBe(50);

    // Dos lotes, no uno: el segundo intento también ocurrió y también se
    // audita. Lo que prueba que leyeron el mismo contenido es la huella.
    expect(lotes).toHaveLength(2);
    expect(new Set(lotes.map((lote) => lote.checksum)).size).toBe(1);
  });

  it('un archivo con errores no escribe nada ni deja lote', async () => {
    const versionId = await versionEnBorrador('con-errores');

    // 200, no 201: con `aborted` no se creó nada, y un 201 afirmaría lo
    // contrario (Q-I6 del plan).
    const res = await subir(versionId, CON_ERRORES, 'con-errores.csv').expect(
      200,
    );
    expect(res.body).toMatchObject({
      aborted: true,
      totalRead: 50,
      inserted: 0,
      errors: 5,
      batchId: null,
    });

    // Las cinco filas malas de la fixture, con su número de línea del archivo.
    expect(res.body.errorSamples.map((m: { line: number }) => m.line)).toEqual([
      5, 9, 14, 20, 33,
    ]);

    const { conceptos, lotes } = await loQueQuedo(versionId);
    expect(conceptos).toBe(0);
    expect(lotes).toHaveLength(0);
  });

  it('validar sin escribir deja la versión intacta', async () => {
    const versionId = await versionEnBorrador('dry-run');

    const res = await subir(versionId, OK_50, 'ok-50.csv', {
      dryRun: 'true',
    }).expect(200);
    expect(res.body).toMatchObject({
      dryRun: true,
      aborted: false,
      totalRead: 50,
      inserted: 0,
      errors: 0,
      batchId: null,
    });
    expect(res.body.preview).toHaveLength(20);

    const { conceptos, lotes } = await loQueQuedo(versionId);
    expect(conceptos).toBe(0);
    expect(lotes).toHaveLength(0);
  });

  /**
   * Q-I2 del plan: dos subidas simultáneas del mismo archivo.
   *
   * El servicio consulta qué códigos ya existen y después inserta, y entre esas
   * dos cosas hay una ventana. Si las dos subidas la atraviesan a la vez, las
   * dos creen estar insertando conceptos nuevos. Lo que impide el duplicado no
   * es el servicio sino `uq_catalog_concepts_version_code`.
   *
   * Lo que esta prueba fija es la garantía que le importa a quien carga: pase
   * lo que pase con las dos peticiones, la versión termina con 50 conceptos y
   * ninguno repetido. Y que perder la carrera no se le responda como un fallo
   * del servidor.
   */
  it('dos importaciones simultáneas no duplican conceptos', async () => {
    const versionId = await versionEnBorrador('carrera');

    const [a, b] = await Promise.all([
      subir(versionId, OK_50, 'ok-50.csv'),
      subir(versionId, OK_50, 'ok-50.csv'),
    ]);

    for (const res of [a, b]) {
      expect(res.status).toBeLessThan(500);
    }

    const { conceptos } = await loQueQuedo(versionId);
    expect(conceptos).toBe(50);

    const em = orm.em.fork();
    const codigos = await em.find(
      CatalogConcepts,
      { codeSystemVersionId: versionId },
      { fields: ['code'] },
    );
    expect(new Set(codigos.map((c) => c.code)).size).toBe(50);
  });
});
