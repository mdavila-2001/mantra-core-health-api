import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { IDA } from '../../src/modules/identity_assurance/identity_assurance.concepts';
import { IDENTITY_CARD_VERTICAL } from '../../src/modules/identity_assurance/identity_assurance.seed';

/**
 * H-01 — que verificar la identidad habilite de verdad el acceso, recorrido por
 * el camino de un paciente real: se registra solo, entra con su documento, sube
 * su evidencia y espera a que la autoridad conteste. Ningún administrador
 * interviene, porque en producción no interviene ninguno.
 *
 * El otro spec del módulo (`identity-verification-cycle`) recorre la superficie
 * administrativa: abrir el caso a mano, escalarlo a revisión y aprobarlo. Ese
 * camino ya emitía la aserción desde el fix de la aprobación manual. Éste cubre
 * el que sufre el titular, que es distinto y estaba roto de otra manera:
 *
 *   1. el worker despacha el check y asienta un intento PENDIENTE —la autoridad
 *      encoló la solicitud pero todavía no resolvió—;
 *   2. vuelve más tarde con el veredicto y lo registra.
 *
 * El paso 2 exige que exista un intento COMPLETADO, y nadie completaba el del
 * paso 1: el veredicto se rechazaba con 422 en cada tick del worker, el check se
 * quedaba en curso para siempre y el caso nunca emitía aserción. El titular veía
 * «Se habilita tu acceso» y no se le habilitaba nada.
 *
 * Desde F-34 el resumen propio ya no está detrás del guard de identidad, así que
 * lo que este recorrido fija a los dos extremos no es 403 → 200 sino qué trae
 * ese 200: sin aserción llega sin código de paciente, y con ella lo suma.
 *
 * Las dos llamadas del worker se hacen aquí con el token administrativo porque
 * `/internal/identity/*` admite `SYSTEM` y `SECURITY_ADMIN`: lo que se prueba es
 * la máquina de estados que atraviesan, no quién las firma.
 */
describe('Verificación de identidad — el titular se verifica solo (integración)', () => {
  let ctx: TestContext;

  /** Documento con el que el paciente se registra y luego inicia sesión. */
  const nationalId = `INT-H01-${randomUUID().slice(0, 8)}`;
  const password = 'S3cret-passw0rd';

  let patientToken: string;
  let caseId: string;
  let checkId: string;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    // Alta pública: sin token y sin que ningún admin lo dé de alta.
    await http()
      .post('/iam/auth/register-patient')
      .send({
        nationalId,
        password,
        displayName: 'Paciente H-01',
        email: `h01-${randomUUID().slice(0, 8)}@example.test`,
      })
      .expect(201);

    // Entra con su documento: es el único alta que funciona así.
    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password })
      .expect(200);
    patientToken = login.body.accessToken;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('recién registrado, ve su resumen sin código de paciente', async () => {
    const res = await http()
      .get('/profiles/patients/me/summary')
      .set(bearer(patientToken))
      .expect(200);

    // Verificarse es un trámite posterior (F-34): lo que la persona declaró al
    // registrarse lo ve desde el primer día. Lo único que espera a la aserción
    // es el código de paciente, y su ausencia la explica `identityVerified`.
    expect(res.body).toMatchObject({
      identityVerified: false,
      displayName: 'Paciente H-01',
    });
    expect(res.body.patientCode).toBeUndefined();
  });

  it('abre su caso aportando la foto con el carnet', async () => {
    const file = await http()
      .post('/common/files')
      .set(bearer(patientToken))
      .send({
        originalName: 'documento.jpg',
        category: 'DOCUMENT',
        sensitivity: 'NORMAL',
        mimeType: 'image/jpeg',
        sizeBytes: 4096,
        contentHash: `h01-hash-${randomUUID().slice(0, 8)}`,
        storageUri: 's3://bucket/documento.jpg',
      })
      .expect(201);

    const abierto = await http()
      .post('/identity/me/identity-verification')
      .set(bearer(patientToken))
      .send({ evidenceFileId: file.body.id })
      .expect(201);

    caseId = abierto.body.caseId;
    checkId = abierto.body.checkId;
    // Queda en verificación desde ya: el worker lo despachará en su próximo tick.
    expect(abierto.body.status).toBe(IDA.CASE_IN_VERIFICATION);
  });

  it('el worker despacha el check y la autoridad encola la solicitud', async () => {
    const intento = await http()
      .post(`/internal/identity/checks/${checkId}/attempts`)
      .set(bearer(ctx.adminToken))
      // PENDIENTE, no éxito: la autoridad aceptó la solicitud pero todavía no
      // resolvió. Es exactamente lo que manda `DispatchIdentityChecksJob`.
      .send({
        identityAuthorityEndpointId: IDENTITY_CARD_VERTICAL.authorityEndpointId,
        outcome: 'PENDING',
        idempotencyKey: `ida-dispatch-${checkId}`,
      })
      .expect(201);

    expect(intento.body.outcome).toBe(IDA.ATTEMPT_PENDING);
    expect(intento.body.checkStatus).toBe(IDA.CHECK_IN_PROGRESS);
  });

  it('el veredicto de la autoridad cierra el caso y emite su aserción', async () => {
    // Antes de H-01 esto respondía 422 («No existe un intento completado para
    // registrar resultado») en cada tick, para siempre.
    const resultado = await http()
      .post(`/internal/identity/checks/${checkId}/results`)
      .set(bearer(ctx.adminToken))
      .send({ result: 'MATCH' })
      .expect(201);

    expect(resultado.body.checkStatus).toBe(IDA.CHECK_COMPLETED);
    // ASSERTED y no VERIFIED: la aserción se emite en la misma transacción, y
    // `VERIFIED` es un estado de paso dentro de ella.
    expect(resultado.body.caseStatus).toBe(IDA.CASE_ASSERTED);
  });

  it('el titular ve su caso resuelto sin conocer su id', async () => {
    const res = await http()
      .get('/identity/me/verification-cases')
      .set(bearer(patientToken))
      .expect(200);

    const propio = res.body.find((k: { id: string }) => k.id === caseId);
    expect(propio).toMatchObject({ status: IDA.CASE_ASSERTED });
  });

  // El criterio de cierre de H-01: lo mismo que al empezar llegaba sin código.
  it('y con eso su resumen suma el código de paciente', async () => {
    const res = await http()
      .get('/profiles/patients/me/summary')
      .set(bearer(patientToken))
      .expect(200);

    expect(res.body.identityVerified).toBe(true);
    expect(res.body.patientCode).toBeDefined();
    expect(res.body).toHaveProperty('patientProfileId');
  });

  /** Cliente HTTP contra la app bajo prueba. */
  function http(): request.Agent {
    return request(ctx.app.getHttpServer());
  }
});
