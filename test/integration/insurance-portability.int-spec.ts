import { randomUUID, createHash } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
} from './harness';

/**
 * Portabilidad de póliza e historial de siniestralidad a 1 clic — contra la
 * base (subtarea 3.3, CA-03/CA-04).
 *
 * ## Por qué contra la base y no con dobles
 *
 * El spec unitario (`insurance-portability.service.spec.ts`) dobla
 * `AuditTrailService` y `EntityManager`: prueba que el servicio LLAMA a
 * `auditTrail.record` con `INSURANCE_PORTABILITY_DENIED`, no que esa fila
 * sobrevive de verdad en `audit.audit_log` (una tabla `<<LOG>>` WORM, con
 * trigger propio) ni que la capa HTTP —guards, filtro de excepciones,
 * `TenantContextInterceptor`— efectivamente devuelve 403 y no otra cosa.
 * Esta suite ejercita las dos cosas que sólo la base puede demostrar.
 *
 * No trunca la base (`bootstrapTestApp()` sin `reset`): cada corrida registra
 * sus propias cuentas con documentos únicos, así que es reproducible sin
 * llevarse por delante lo que ya haya (Neon, sin Docker en esta máquina).
 */
describe('Portabilidad de póliza y siniestralidad (integración)', () => {
  let ctx: TestContext;
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;

  const password = 'S3cret-passw0rd';
  const marca = randomUUID().slice(0, 8);

  const http = () => request(ctx.app.getHttpServer());

  /** Lee los claims de un token sin verificar la firma: sólo interesa `pid`. */
  function claims(bruto: string): Record<string, unknown> {
    const [, cuerpo] = bruto.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /** Registra un paciente propio y devuelve su token y su `patientProfileId`. */
  async function registrarPaciente(
    etiqueta: string,
  ): Promise<{ token: string; patientProfileId: string }> {
    const nationalId = `PORTAB-${etiqueta}-${marca}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId,
        password,
        name: 'Paciente',
        lastName: etiqueta,
        motherLastName: 'Portabilidad',
        displayName: `Paciente ${etiqueta} Portabilidad`,
        email: `portab-e2e-${etiqueta}-${marca}@example.test`,
      })
      .expect(201);

    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password })
      .expect(200);

    const token = login.body.accessToken as string;
    return { token, patientProfileId: claims(token)['pid'] as string };
  }

  let titular: { token: string; patientProfileId: string };
  let ajeno: { token: string; patientProfileId: string };

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);
    titular = await registrarPaciente('titular');
    ajeno = await registrarPaciente('ajeno');
    // El arranque completo (66 módulos sembrados) contra Neon supera el
    // `testTimeout` global de 180 s de `jest-integration.json` — la latencia
    // de la conexión remota, no del código bajo prueba.
  }, 300_000);

  afterAll(async () => {
    if (ctx) await ctx.app.close();
  });

  it('un actor ajeno no puede exportar el historial de otra persona: 403 sin PHI, y queda auditado (CA-03)', async () => {
    const respuesta = await http()
      .post('/insurance/portability/export')
      .set(bearer(ajeno.token))
      .send({ patientProfileId: titular.patientProfileId })
      .expect(403);

    // El cuerpo del rechazo no lleva ni el nombre ni el documento del titular:
    // sólo el mensaje genérico de dominio.
    const textoDelCuerpo = JSON.stringify(respuesta.body);
    expect(textoDelCuerpo).not.toContain('Paciente titular');
    expect(textoDelCuerpo).not.toContain(camposDePaciente.phone);

    const filas = await ctx.orm.em
      .getConnection()
      .execute<{ action: string; entity_id: string; entity: string }[]>(
        `select action, entity_id, entity
         from audit.audit_log
        where action = 'INSURANCE_PORTABILITY_DENIED'
          and entity_id = ?
        order by recorded_at desc
        limit 1`,
        [titular.patientProfileId],
      );
    expect(filas).toHaveLength(1);
    expect(filas[0]?.entity).toBe('patient_profile');
  });

  it('el titular exporta su propio historial, y el JSON descargado sella exactamente el mismo hash', async () => {
    const exportado = await http()
      .post('/insurance/portability/export')
      .set(bearer(titular.token))
      .send({ patientProfileId: titular.patientProfileId, format: 'JSON' })
      .expect(201);

    expect(exportado.body.manifestHash).toMatch(/^[0-9a-f]{64}$/);

    // El controlador declara `Content-Type: application/json`, así que
    // superagent parsea la respuesta como objeto y `.body` deja de ser los
    // bytes exactos que se sellaron — hay que pedirle los bytes crudos con
    // un parser propio para poder hashearlos.
    const descarga = await http()
      .get(
        `/insurance/portability/certificates/${exportado.body.certificateId}/json`,
      )
      .set(bearer(titular.token))
      .buffer(true)
      .parse((res, callback) => {
        const trozos: Buffer[] = [];
        res.on('data', (trozo: Buffer) => trozos.push(trozo));
        res.on('end', () => callback(null, Buffer.concat(trozos)));
      })
      .expect(200);

    const hashReal = createHash('sha256')
      .update(descarga.body as Buffer)
      .digest('hex');
    expect(hashReal).toBe(exportado.body.manifestHash);

    // CA-04: el mismo sello en MAYÚSCULAS es el mismo certificado, y el
    // instante que devuelve coincide con el que ya se selló (no otro
    // `requestedAt` tomado después de subir el archivo).
    const verificacion = await http()
      .get(
        `/public/portability/verify/${exportado.body.manifestHash.toUpperCase()}`,
      )
      .expect(200);

    expect(verificacion.body.status).toBe('VALID');
    expect(verificacion.body.generatedAt).toBe(exportado.body.generatedAt);
    expect(verificacion.body).not.toHaveProperty('patientName');
    expect(verificacion.body).not.toHaveProperty('nationalId');
  });
});
