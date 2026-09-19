import { randomBytes, randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from '../harness';
import { SEED } from '../../../src/common';
import {
  configureMinioFromEnv,
  ensureBucket,
  s3,
  seedDicomChain,
  seedNamespace,
  seedObject,
  sqlOf,
} from './object-storage.fixture';

/**
 * MCH-020 · la auditoría del acceso la decide y la nombra el servidor.
 *
 * Contra PostgreSQL real porque lo que se prueba son filas: cuáles quedan, con
 * qué recurso y con qué resultado. Un doble del repositorio diría que se llamó
 * a un método, no que la evidencia sobrevivió al rollback del acceso denegado.
 *
 * **RED contra el código previo:** el registro DICOM se creaba sólo si el
 * cuerpo traía `studyInstanceUid`, y con ese valor; sin el campo no quedaba
 * ninguna fila, y con un UID inventado la fila apuntaba al estudio equivocado.
 * Los accesos denegados no dejaban rastro alguno, y el log de emisión se
 * escribía antes de comprobar que el objeto existiera.
 */
describe('MCH-020 · auditoría server-side del acceso a objetos (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  let namespace: { id: string; code: string };

  beforeAll(async () => {
    configureMinioFromEnv();
    ctx = await bootstrapTestApp();
    await ensureBucket(s3());
    namespace = await seedNamespace(ctx);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  /** Un estudio DICOM completo: objeto en MinIO más su jerarquía catalogada. */
  async function estudioDicom() {
    const objeto = await seedObject(ctx, namespace.id, {
      tenantId: SEED.tenantId,
      patientProfileId: ctx.patientSubtypeId,
      bytes: randomBytes(256),
      objectType: 'dicom_instance',
    });
    const uids = await seedDicomChain(ctx, objeto.manifestId, {
      tenantId: SEED.tenantId,
      patientProfileId: ctx.patientSubtypeId,
    });
    return { ...objeto, ...uids };
  }

  function emitir(versionId: string, body: Record<string, unknown> = {}) {
    return http()
      .post(`/object-storage/versions/${versionId}/signed-url`)
      .set(bearer(ctx.adminToken))
      .send({ purposeOfUseCode: 'TREATMENT', ...body });
  }

  function accesosDicom(studyInstanceUid: string) {
    return sqlOf(ctx)<{
      study_instance_uid: string;
      series_instance_uid: string;
      sop_instance_uid: string;
      outcome: string;
      principal_id: string;
    }>(
      `SELECT study_instance_uid, series_instance_uid, sop_instance_uid,
              outcome, principal_id
         FROM object_storage.dicomweb_access_logs
        WHERE study_instance_uid = ?`,
      [studyInstanceUid],
    );
  }

  function eventosDeAuditoria(versionId: string) {
    return sqlOf(ctx)<{ action: string }>(
      `SELECT action FROM audit.audit_log
        WHERE entity = 'object_storage.object_version' AND entity_id = ?
        ORDER BY recorded_at`,
      [versionId],
    );
  }

  it('AC01 · omitir studyInstanceUid no elimina la auditoría del acceso', async () => {
    const objeto = await estudioDicom();

    const res = await emitir(objeto.versionId).expect(201);

    expect(res.body.accessLogId).toBeDefined();
    const filas = await accesosDicom(objeto.studyInstanceUid);
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({
      series_instance_uid: objeto.seriesInstanceUid,
      sop_instance_uid: objeto.sopInstanceUid,
      outcome: 'allowed',
      principal_id: ctx.adminUserId,
    });
    expect(await eventosDeAuditoria(objeto.versionId)).toEqual([
      { action: 'OBJECT_ACCESS_ISSUED' },
    ]);
  });

  it('AC03 · el log nombra el estudio real, no el que sustituye el cliente', async () => {
    const objeto = await estudioDicom();
    const inventado = `1.2.840.10008.SUPLANTADO.${randomUUID()}`;

    await emitir(objeto.versionId, { studyInstanceUid: inventado }).expect(201);

    expect(await accesosDicom(inventado)).toHaveLength(0);
    expect(await accesosDicom(objeto.studyInstanceUid)).toHaveLength(1);
  });

  it('AC02 · un objeto bloqueado no genera un éxito falso y sí un rechazo auditado', async () => {
    const objeto = await estudioDicom();
    await sqlOf(ctx)(
      `UPDATE object_storage.object_manifests
          SET lifecycle_state = 'corrupt' WHERE id = ?`,
      [objeto.manifestId],
    );

    await emitir(objeto.versionId).expect(422);

    // La emisión no se anuncia: no hay acceso permitido para ese estudio…
    expect(await accesosDicom(objeto.studyInstanceUid)).toHaveLength(0);
    // …y el intento sobrevive al rollback de la operación que lo rechazó.
    expect(await eventosDeAuditoria(objeto.versionId)).toEqual([
      { action: 'OBJECT_ACCESS_DENIED' },
    ]);
  });

  it('AC02 · una versión inexistente tampoco produce un éxito falso', async () => {
    const inexistente = randomUUID();

    await emitir(inexistente).expect(404);

    expect(await eventosDeAuditoria(inexistente)).toEqual([
      { action: 'OBJECT_ACCESS_DENIED' },
    ]);
  });

  it('emisión y canje quedan como eventos distintos, y sin la URL en el registro', async () => {
    const objeto = await estudioDicom();
    const emitido = await emitir(objeto.versionId).expect(201);

    await http()
      .get(emitido.body.url as string)
      .set(bearer(ctx.adminToken))
      .responseType('blob')
      .expect(200);

    expect(await eventosDeAuditoria(objeto.versionId)).toEqual([
      { action: 'OBJECT_ACCESS_ISSUED' },
      { action: 'OBJECT_ACCESS_REDEEMED' },
    ]);
    expect(await accesosDicom(objeto.studyInstanceUid)).toHaveLength(2);

    // Ninguna columna de la evidencia guarda un enlace reutilizable.
    const token = (emitido.body.url as string).split('/').pop() as string;
    const rastro = await sqlOf(ctx)<{ n: string }>(
      `SELECT count(*)::text AS n FROM audit.audit_log
        WHERE entity_id = ? AND action LIKE ?`,
      [objeto.versionId, `%${token.slice(0, 16)}%`],
    );
    expect(rastro[0].n).toBe('0');
  });

  it('un canje con un enlace inválido también queda registrado', async () => {
    const objeto = await estudioDicom();

    await http()
      .get(`/object-storage/versions/${objeto.versionId}/content/basura.firma`)
      .set(bearer(ctx.adminToken))
      .expect(404);

    expect(await eventosDeAuditoria(objeto.versionId)).toEqual([
      { action: 'OBJECT_ACCESS_REDEEM_DENIED' },
    ]);
  });

  it('un objeto fuera del catálogo DICOM también deja evidencia', async () => {
    const objeto = await seedObject(ctx, namespace.id, {
      tenantId: SEED.tenantId,
      bytes: randomBytes(64),
      objectType: 'document',
    });

    const res = await emitir(objeto.versionId).expect(201);

    expect(res.body.accessLogId).toBeUndefined();
    expect(await eventosDeAuditoria(objeto.versionId)).toEqual([
      { action: 'OBJECT_ACCESS_ISSUED' },
    ]);
  });
});
