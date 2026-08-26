import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { CONCEPTS } from '../../src/common';
import { IDA } from '../../src/modules/identity_assurance/identity_assurance.concepts';
import { IDENTITY_CARD_VERTICAL } from '../../src/modules/identity_assurance/identity_assurance.seed';
import { IdentityAssertions } from '../../src/modules/identity_assurance/entities';

/**
 * El ciclo de verificación de identidad de punta a punta, contra la API real.
 *
 * Cubre lo que las unitarias con el `EntityManager` mockeado no pueden ver: que
 * la máquina de estados encaje endpoint con endpoint. Cada paso exige el estado
 * que dejó el anterior —`manual-review` rechaza un caso que no esté
 * `IN_VERIFICATION`— así que un eslabón mal ordenado sale acá y no en la demo.
 *
 * Es además la prueba de la cola (`GET /identity/verification-cases`): la única
 * lectura de la superficie administrativa, y la que hacía que un revisor sólo
 * pudiera actuar sobre un caso cuyo id ya conociera.
 *
 * `reviewReasonConceptId` viaja como `STATE_ACTIVE` por la misma razón que en el
 * smoke: la columna es FK contra el catálogo de terminología y el modelo no
 * declara todavía un value set de motivos de revisión. Es un marcador, no un
 * significado.
 */
describe('Verificación de identidad — ciclo completo contra la API real (integración)', () => {
  let ctx: TestContext;

  let subjectEntityId: string;
  let caseId: string;
  let reviewId: string;

  /** Los ids de la cola por defecto, que es la que mira el revisor. */
  async function idsEnCola(): Promise<string[]> {
    const res = await http()
      .get('/identity/verification-cases')
      .set(bearer(ctx.adminToken))
      .expect(200);
    return res.body.cases.map((kase: { id: string }) => kase.id);
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    // El alta devuelve `profileId`, que es también el id de la persona: es el
    // sujeto sobre el que se abre el caso.
    const patient = await http()
      .post('/profiles/patients')
      .set(bearer(ctx.adminToken))
      .send({
        patientCode: `INT-IDA-${randomUUID().slice(0, 8)}`,
        displayName: 'Paciente de verificación',
        birthDate: '1990-05-14',
      })
      .expect(201);
    subjectEntityId = patient.body.profileId;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('abre el caso, y un caso recién abierto todavía no está en la cola', async () => {
    const abierto = await http()
      .post('/identity/verification-cases')
      .set(bearer(ctx.adminToken))
      .send({
        identityVerificationPolicyId: IDENTITY_CARD_VERTICAL.policyId,
        subjectTypeConceptId: IDA.SUBJECT_PATIENT_IDENTITY,
        subjectEntityId,
      })
      .expect(201);
    caseId = abierto.body.id;
    expect(abierto.body.status).toBe(IDA.CASE_OPEN);

    // `CASE_OPEN` es el instante entre crear el caso y planificar sus checks:
    // no hay nada que revisar todavía, y la cola no debe mostrarlo.
    expect(await idsEnCola()).not.toContain(caseId);
  });

  it('planificar los checks lo pone en verificación, y ahí sí entra en la cola', async () => {
    const planificado = await http()
      .post(`/identity/verification-cases/${caseId}/checks:plan`)
      .set(bearer(ctx.adminToken))
      .send({
        checks: [{ checkTypeConceptId: IDA.CHECK_TYPE_IDENTITY_CARD }],
      })
      .expect(201);
    expect(planificado.body.caseStatus).toBe(IDA.CASE_IN_VERIFICATION);

    expect(await idsEnCola()).toContain(caseId);
  });

  it('la cola trae los datos que el revisor necesita para priorizar', async () => {
    const res = await http()
      .get('/identity/verification-cases')
      .set(bearer(ctx.adminToken))
      .expect(200);

    const enCola = res.body.cases.find(
      (kase: { id: string }) => kase.id === caseId,
    );
    expect(enCola).toMatchObject({
      id: caseId,
      status: IDA.CASE_IN_VERIFICATION,
      subjectTypeConceptId: IDA.SUBJECT_PATIENT_IDENTITY,
      subjectEntityId,
      identityVerificationPolicyId: IDENTITY_CARD_VERTICAL.policyId,
    });
    expect(typeof enCola.openedAt).toBe('string');
  });

  it('`status` acota a un estado, y descarta los demás', async () => {
    const enRevision = await http()
      .get('/identity/verification-cases')
      .query({ status: IDA.CASE_MANUAL_REVIEW })
      .set(bearer(ctx.adminToken))
      .expect(200);

    // Todavía está `IN_VERIFICATION`: pedir explícitamente los de revisión
    // manual no debe devolverlo.
    expect(
      enRevision.body.cases.map((kase: { id: string }) => kase.id),
    ).not.toContain(caseId);
    for (const kase of enRevision.body.cases) {
      expect(kase.status).toBe(IDA.CASE_MANUAL_REVIEW);
    }
  });

  it('devuelve la cola de la más vieja a la más nueva', async () => {
    const res = await http()
      .get('/identity/verification-cases')
      .set(bearer(ctx.adminToken))
      .expect(200);

    const aperturas = res.body.cases
      .map((kase: { openedAt?: string }) => kase.openedAt)
      .filter(
        (fecha: string | undefined): fecha is string => fecha !== undefined,
      )
      .map((fecha: string) => new Date(fecha).getTime());
    const ordenadas = [...aperturas].sort((a, b) => a - b);
    expect(aperturas).toEqual(ordenadas);
  });

  it('`limit` acota cuántos devuelve', async () => {
    const res = await http()
      .get('/identity/verification-cases')
      .query({ limit: 1 })
      .set(bearer(ctx.adminToken))
      .expect(200);
    expect(res.body.cases.length).toBeLessThanOrEqual(1);
  });

  it('rechaza un `status` que no sea uuid', async () => {
    await http()
      .get('/identity/verification-cases')
      .query({ status: 'no-es-un-uuid' })
      .set(bearer(ctx.adminToken))
      .expect(400);
  });

  it('escala a revisión manual y sigue en la cola', async () => {
    const revision = await http()
      .post(`/identity/verification-cases/${caseId}/manual-review`)
      .set(bearer(ctx.adminToken))
      .send({ reviewReasonConceptId: CONCEPTS.STATE_ACTIVE })
      .expect(201);
    reviewId = revision.body.id;
    expect(revision.body.caseStatus).toBe(IDA.CASE_MANUAL_REVIEW);

    // Sigue esperando a una persona: cambió de estado, no de situación.
    expect(await idsEnCola()).toContain(caseId);
  });

  it('aprobar la revisión deja el caso asertado y lo saca de la cola', async () => {
    const decision = await http()
      .post(`/identity/manual-review/${reviewId}/decision`)
      .set(bearer(ctx.adminToken))
      // 200, no 201: decidir resuelve una revisión que ya existía, no crea nada
      // (`@HttpCode(HttpStatus.OK)` en el controller).
      .send({ decision: 'APPROVED', decisionReason: 'Documento legible' })
      .expect(200);
    // ASSERTED y no VERIFIED: aprobar emite la aserción en la misma
    // transacción, y `VERIFIED` es un estado de paso dentro de ella. Esperar
    // `VERIFIED` acá era el rojo preexistente de este spec.
    expect(decision.body.caseStatus).toBe(IDA.CASE_ASSERTED);

    // Es lo que hace de esto una cola y no un listado: el trabajo hecho se va.
    expect(await idsEnCola()).not.toContain(caseId);
  });

  // H-01: lo que el titular gana al aprobarse su caso. El estado del caso es
  // contabilidad interna; la aserción es lo que consulta `VerifiedIdentityGuard`
  // en cada petición, y su ausencia era el 403 permanente.
  //
  // Se comprueba contra la tabla y no por HTTP porque no hay endpoint de lectura
  // de aserciones: `/identity/assertions` sólo expone la revocación (UC-27-11).
  it('la aprobación emite una aserción vigente para el sujeto', async () => {
    const em = ctx.orm.em.fork();
    const assertions = await em.find(IdentityAssertions, {
      subjectEntityId,
      revokedAt: null,
    });

    expect(assertions).toHaveLength(1);
    expect(assertions[0]).toMatchObject({
      subjectTypeConceptId: IDA.SUBJECT_PATIENT_IDENTITY,
      identityVerificationCaseId: caseId,
    });
    // Sin vigencia, el guard la descartaría en la siguiente petición.
    expect(assertions[0].expiresAt?.getTime()).toBeGreaterThan(Date.now());
  });

  it('la cola exige autenticación', async () => {
    await http().get('/identity/verification-cases').expect(401);
  });

  /** Cliente HTTP contra la app bajo prueba. */
  function http(): request.Agent {
    return request(ctx.app.getHttpServer());
  }
});
