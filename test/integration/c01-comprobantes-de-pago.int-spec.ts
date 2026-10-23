import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  camposObligatoriosDePaciente,
  type TestContext,
  identidadProfesional,
} from './harness';

/**
 * C-01 · Comprobantes de pago del paciente, contra la base real.
 *
 * ## Qué se está protegiendo
 *
 * El cliente pidió (MD-06 / PA-04, 2026-10-23) que la consulta no se cierre ni
 * se facture sin el pago confirmado, y que el pago lo confirme el médico sobre
 * el comprobante que sube el paciente. Esta prueba recorre el contrato C-01
 * de punta a punta con roles reales:
 *
 * 1. el paciente ve el contexto de pago de SU cargo (monto, su parte, la sede);
 * 2. sube un comprobante (QR exige archivo; dos pendientes no conviven);
 * 3. el médico lo ve, lo acepta o lo rechaza con motivo, con la precondición
 *    en la escritura (dos aceptaciones simultáneas → una gana, la otra 409);
 * 4. el cargo pasa a PAID y la consulta se puede cerrar; sin pago, 422
 *    `PRECONDITION_FAILED` con `reason = PAYMENT_REQUIRED` (patrón de la casa);
 * 5. la matriz negativa: cargo ajeno 404, rol sin permiso 403, paciente que
 *    no es el del cargo 404.
 *
 * ## Lo que sigue sin cubrir
 *
 * El QR real de la sede (`bank_qr_file_id`) no se carga acá: se verifica que el
 * contexto devuelva la sede y el campo (nulo). La parte del seguro sale del
 * doble declarado de C-02 (`NO_COVERAGE`): la integración con `insurance` queda
 * pendiente hasta que Richard publique el puerto.
 */
describe('C-01 · comprobantes de pago del paciente, de punta a punta', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';
  const PNG_BYTES = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64',
  );

  const medica = {
    email: `c01-med-${sufijo}@example.test`,
    token: '',
    hpid: '',
    tenantId: '',
  };
  const otroMedico = {
    email: `c01-otro-${sufijo}@example.test`,
    token: '',
    hpid: '',
    tenantId: '',
  };
  const paciente = {
    email: `c01-pac-${sufijo}@example.test`,
    token: '',
    profileId: '',
  };
  const otroPaciente = {
    email: `c01-pac2-${sufijo}@example.test`,
    token: '',
    profileId: '',
  };
  let resourceId = '';
  let practiceId = '';
  /** El cargo = el encuentro de la consulta con precio. */
  let chargeId = '';

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  function proximoLunes(horas: number): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7) + 14);
    d.setUTCHours(horas, 0, 0, 0);
    return d;
  }

  async function altaMedico(m: typeof medica, nombre: string): Promise<void> {
    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(m.email),
        email: m.email,
        password: PASSWORD,
        name: nombre,
        lastName: 'C01',
        licenseNumber: `LIC-C01-${nombre}-${sufijo}`,
        credentialNumber: `CRED-C01-${nombre}-${sufijo}`,
      })
      .expect(201);
    m.hpid = alta.body.practitionerProfileId;
    const login = await http()
      .post('/iam/auth/login')
      .send({ email: m.email, password: PASSWORD })
      .expect(200);
    m.token = login.body.accessToken;
    m.tenantId = (claims(m.token)['tenants'] as string[])[0];
  }

  async function altaPaciente(
    p: typeof paciente,
    nationalId: string,
  ): Promise<void> {
    const campos = await camposObligatoriosDePaciente(ctx);
    const alta = await http()
      .post('/iam/auth/register-patient')
      .send({
        nationalId,
        password: PASSWORD,
        email: p.email,
        name: 'Paciente',
        lastName: 'C01',
        ...campos,
      })
      .expect(201);
    p.profileId = alta.body.patientProfileId ?? alta.body.profileId;
    const login = await http()
      .post('/iam/auth/login')
      .send({ email: p.email, password: PASSWORD })
      .expect(200);
    p.token = login.body.accessToken;
  }

  /** Cita directa + check-in = un encuentro en curso de la médica con ese paciente. */
  async function consultaEnCurso(
    m: typeof medica,
    patientProfileId: string,
    horas: number,
  ): Promise<string> {
    const directa = await http()
      .post('/scheduling/appointments/direct')
      .set(bearer(m.token))
      .send({
        patientProfileId,
        resourceId,
        startAt: proximoLunes(horas).toISOString(),
        durationMinutes: 30,
        reasonText: 'Consulta C-01',
      })
      .expect(201);
    const reserva = await ctx.orm.em
      .getConnection()
      .execute<{ appointment_id: string }[]>(
        `select appointment_id from scheduling.appointment_bookings where id = ?`,
        [directa.body.bookingId],
      );
    // «Iniciar la atención»: la reserva pasa a IN_PROGRESS y la médica queda
    // atendiendo a ese paciente (es lo que le deja escribir y cerrar la historia).
    await http()
      .post(`/scheduling/bookings/${directa.body.bookingId}/start`)
      .set(bearer(m.token))
      .expect(200);
    const checkIn = await http()
      .post('/clinical/encounters/check-in')
      .set(bearer(m.token))
      .send({
        patientProfileId,
        tenantId: m.tenantId,
        appointmentId: reserva[0].appointment_id,
        primaryPractitionerId: m.hpid,
      })
      .expect(201);
    return checkIn.body.id as string;
  }

  async function subirImagen(token: string): Promise<string> {
    const res = await http()
      .post('/common/files/upload')
      .set(bearer(token))
      .field('category', 'IMAGE')
      .field('sensitivity', 'PHI')
      .attach('file', PNG_BYTES, {
        filename: 'comprobante.png',
        contentType: 'image/png',
      })
      .expect(201);
    return res.body.id as string;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    await altaMedico(medica, 'Rocio');
    await altaMedico(otroMedico, 'Bruno');
    await altaPaciente(paciente, `C01A${sufijo}`.toUpperCase().slice(0, 12));
    await altaPaciente(
      otroPaciente,
      `C01B${sufijo}`.toUpperCase().slice(0, 12),
    );

    const recurso = await http()
      .post('/scheduling/resources')
      .set(bearer(medica.token))
      .send({
        tenantId: medica.tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: medica.hpid,
        name: 'Consultorio C-01',
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    resourceId = recurso.body.id;

    // El consultorio propio de la médica: la práctica personal, su sede y el
    // servicio «Cita médica» (a 0,00) nacen acá, como en el onboarding real.
    await http()
      .post('/practitioners/me/sites')
      .set(bearer(medica.token))
      .send({ name: 'Consultorio C-01', timeZone: 'America/La_Paz' })
      .expect(201);
    await http()
      .post('/practitioners/me/sites')
      .set(bearer(otroMedico.token))
      .send({ name: 'Consultorio ajeno C-01', timeZone: 'America/La_Paz' })
      .expect(201);

    // La consulta tiene precio: Bs 150,00 en el catálogo de la práctica.
    const practicas = await ctx.orm.em
      .getConnection()
      .execute<{ practice_id: string }[]>(
        `select practice_id from practice.practitioner_role_assignments
          where practitioner_profile_id = ? and valid_to is null
          order by is_primary desc nulls last, created_at limit 1`,
        [medica.hpid],
      );
    practiceId = practicas[0].practice_id;
    // El consultorio propio nace sin servicio en el catálogo (a diferencia de
    // `POST /practices`): la médica define su consulta y su precio.
    await http()
      .post('/billing/service-catalog')
      .set(bearer(medica.token))
      .send({
        practiceId,
        code: 'CITA_MEDICA',
        name: 'Cita médica',
        defaultPrice: '150.00',
      })
      .expect(201);

    chargeId = await consultaEnCurso(medica, paciente.profileId, 9);
  }, 180_000);

  afterAll(async () => {
    await ctx.app.close();
  });

  it('1 · el paciente ve el contexto de pago de su cargo: monto, su parte, la sede', async () => {
    const res = await http()
      .get(`/billing/me/charges/${chargeId}/payment-context`)
      .set(bearer(paciente.token))
      .expect(200);
    expect(res.body).toMatchObject({
      chargeId,
      amountMinor: 15000,
      currency: 'BOB',
      status: 'PENDING',
      patientShare: {
        patientAmountMinor: 15000,
        insurerAmountMinor: 0,
        approval: { status: 'NO_COVERAGE' },
      },
      proofs: [],
      latestProof: null,
    });
    expect(res.body.site).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
      }),
    );
    expect(res.body.site).toHaveProperty('bankQrFileId');
  });

  it('1b · otro paciente no ve ese cargo (404) y el médico no usa la ruta del paciente (403)', async () => {
    await http()
      .get(`/billing/me/charges/${chargeId}/payment-context`)
      .set(bearer(otroPaciente.token))
      .expect(404);
    await http()
      .get(`/billing/me/charges/${chargeId}/payment-context`)
      .set(bearer(medica.token))
      .expect(403);
  });

  // El contrato C-01 dice «412»; la casa mapea `PreconditionFailedException`
  // a 422 + `PRECONDITION_FAILED` (domain.exception.ts) y la factura simulada ya
  // respondía así. Se sigue el patrón nativo; lo que el cliente distingue es
  // `details.reason = PAYMENT_REQUIRED`.
  it('2 · sin pago confirmado la consulta no cierra: 422 PRECONDITION_FAILED / PAYMENT_REQUIRED', async () => {
    const res = await http()
      .post(`/clinical/encounters/${chargeId}/close`)
      .set(bearer(medica.token))
      .send({})
      .expect(422);
    expect(res.body).toMatchObject({
      code: 'PRECONDITION_FAILED',
      details: expect.objectContaining({
        reason: 'PAYMENT_REQUIRED',
        amountMinor: 15000,
      }),
    });
    const fila = await ctx.orm.em
      .getConnection()
      .execute<{ status_concept_id: string; sealed_at: Date | null }[]>(
        `select status_concept_id, sealed_at from clinical.encounters where id = ?`,
        [chargeId],
      );
    expect(fila[0].sealed_at).toBeNull();
  });

  it('2b · la factura fiscal simulada tampoco sale sin pago (422 PAYMENT_REQUIRED)', async () => {
    const res = await http()
      .post(`/billing/simulated/charges/${chargeId}/invoices`)
      .set(bearer(medica.token))
      .send({
        buyer: {
          name: 'Paciente C01',
          documentTypeCode: 1,
          documentNumber: '1234567',
        },
      })
      .expect(422);
    expect(res.body).toMatchObject({
      code: 'PRECONDITION_FAILED',
      details: expect.objectContaining({ reason: 'PAYMENT_REQUIRED' }),
    });
  });

  it('3 · una transferencia por QR sin captura se rechaza (422 FILE_REQUIRED)', async () => {
    const res = await http()
      .post(`/billing/me/charges/${chargeId}/payment-proofs`)
      .set(bearer(paciente.token))
      .send({ method: 'QR_TRANSFER', amountMinor: 15000 })
      .expect(422);
    expect(res.body.details ?? res.body).toMatchObject({
      reason: 'FILE_REQUIRED',
    });
  });

  it('3b · un archivo que no es del paciente no sirve de comprobante (422 FILE_NOT_OWNED)', async () => {
    const ajeno = await subirImagen(otroPaciente.token);
    const res = await http()
      .post(`/billing/me/charges/${chargeId}/payment-proofs`)
      .set(bearer(paciente.token))
      .send({ method: 'QR_TRANSFER', amountMinor: 15000, fileId: ajeno })
      .expect(422);
    expect(res.body.details ?? res.body).toMatchObject({
      reason: 'FILE_NOT_OWNED',
    });
  });

  let primerComprobante = '';

  it('4 · el paciente sube el comprobante: nace PENDING_REVIEW y el segundo pendiente es 409', async () => {
    const fileId = await subirImagen(paciente.token);
    const res = await http()
      .post(`/billing/me/charges/${chargeId}/payment-proofs`)
      .set(bearer(paciente.token))
      .send({ method: 'QR_TRANSFER', amountMinor: 15000, fileId })
      .expect(201);
    expect(res.body).toMatchObject({
      id: expect.any(String),
      status: 'PENDING_REVIEW',
    });
    primerComprobante = res.body.id;

    const segundo = await http()
      .post(`/billing/me/charges/${chargeId}/payment-proofs`)
      .set(bearer(paciente.token))
      .send({ method: 'CASH', amountMinor: 15000 })
      .expect(409);
    expect(segundo.body.details ?? segundo.body).toMatchObject({
      reason: 'PROOF_ALREADY_PENDING',
    });

    const fila = await ctx.orm.em
      .getConnection()
      .execute<{ n: string }[]>(
        `select count(*)::text as n from billing.payment_proofs where encounter_id = ?`,
        [chargeId],
      );
    expect(fila[0].n).toBe('1');
  });

  it('5 · la médica ve el comprobante; otro médico no (404); el paciente no usa la ruta del médico (403)', async () => {
    const res = await http()
      .get(`/billing/charges/${chargeId}/payment-proofs`)
      .set(bearer(medica.token))
      .expect(200);
    expect(res.body).toMatchObject({
      chargeId,
      status: 'PENDING',
      amountMinor: 15000,
    });
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      id: primerComprobante,
      method: 'QR_TRANSFER',
      status: 'PENDING_REVIEW',
      fileId: expect.any(String),
    });

    await http()
      .get(`/billing/charges/${chargeId}/payment-proofs`)
      .set(bearer(otroMedico.token))
      .expect(404);
    await http()
      .post(`/billing/payment-proofs/${primerComprobante}/accept`)
      .set(bearer(otroMedico.token))
      .expect(404);
    await http()
      .post(`/billing/payment-proofs/${primerComprobante}/accept`)
      .set(bearer(paciente.token))
      .expect(403);
  });

  it('6 · rechazar exige motivo; con motivo el comprobante queda REJECTED y el cargo sigue PENDING', async () => {
    await http()
      .post(`/billing/payment-proofs/${primerComprobante}/reject`)
      .set(bearer(medica.token))
      .send({})
      .expect(400);

    const res = await http()
      .post(`/billing/payment-proofs/${primerComprobante}/reject`)
      .set(bearer(medica.token))
      .send({ reason: 'La captura no muestra el monto' })
      .expect(200);
    expect(res.body).toMatchObject({
      id: primerComprobante,
      status: 'REJECTED',
      chargeStatus: 'PENDING',
    });

    const contexto = await http()
      .get(`/billing/me/charges/${chargeId}/payment-context`)
      .set(bearer(paciente.token))
      .expect(200);
    expect(contexto.body.status).toBe('PENDING');
    expect(contexto.body.latestProof).toMatchObject({
      status: 'REJECTED',
      rejectionReason: 'La captura no muestra el monto',
    });

    // Rechazar dos veces: la precondición está en la escritura.
    const otraVez = await http()
      .post(`/billing/payment-proofs/${primerComprobante}/reject`)
      .set(bearer(medica.token))
      .send({ reason: 'otra vez' })
      .expect(409);
    expect(otraVez.body.details ?? otraVez.body).toMatchObject({
      reason: 'PROOF_NOT_PENDING',
    });
  });

  it('7 · dos aceptaciones simultáneas: una gana, la otra 409; el cargo queda PAID una sola vez', async () => {
    const nuevo = await http()
      .post(`/billing/me/charges/${chargeId}/payment-proofs`)
      .set(bearer(paciente.token))
      .send({ method: 'CASH', amountMinor: 15000 })
      .expect(201);
    const proofId = nuevo.body.id as string;

    const [a, b] = await Promise.all([
      http()
        .post(`/billing/payment-proofs/${proofId}/accept`)
        .set(bearer(medica.token)),
      http()
        .post(`/billing/payment-proofs/${proofId}/accept`)
        .set(bearer(medica.token)),
    ]);
    const estados = [a.status, b.status].sort();
    expect(estados).toEqual([200, 409]);
    const ganadora = a.status === 200 ? a : b;
    expect(ganadora.body).toMatchObject({
      id: proofId,
      status: 'ACCEPTED',
      chargeStatus: 'PAID',
    });

    const pagos = await ctx.orm.em.getConnection().execute<{ n: string }[]>(
      `select count(*)::text as n
           from billing.payments_received p
           join billing.receivable_payment_allocations a on a.payment_received_id = p.id
           join billing.invoices i on i.id = a.invoice_id
          where i.encounter_id = ?`,
      [chargeId],
    );
    expect(pagos[0].n).toBe('1');

    const contexto = await http()
      .get(`/billing/me/charges/${chargeId}/payment-context`)
      .set(bearer(paciente.token))
      .expect(200);
    expect(contexto.body.status).toBe('PAID');

    // Aceptar un comprobante ya aceptado: 409.
    await http()
      .post(`/billing/payment-proofs/${proofId}/accept`)
      .set(bearer(medica.token))
      .expect(409);
    // Con el cargo pagado no se aceptan más comprobantes.
    const tarde = await http()
      .post(`/billing/me/charges/${chargeId}/payment-proofs`)
      .set(bearer(paciente.token))
      .send({ method: 'CASH', amountMinor: 15000 })
      .expect(409);
    expect(tarde.body.details ?? tarde.body).toMatchObject({
      reason: 'ALREADY_PAID',
    });
  });

  it('7b · el paciente recibió los dos avisos en su campana (rechazo y aceptación)', async () => {
    const avisos = await ctx.orm.em
      .getConnection()
      .execute<{ subject: string }[]>(
        `select n.subject
           from messaging.in_app_notifications n
           join profiles.person_account_links l on l.user_id = n.recipient_user_id
          where l.person_id = ?
            and n.subject in ('Tu pago fue confirmado', 'Tu comprobante fue rechazado')
          order by n.subject`,
        [paciente.profileId],
      );
    expect(avisos.map((a) => a.subject)).toEqual([
      'Tu comprobante fue rechazado',
      'Tu pago fue confirmado',
    ]);
  });

  it('8 · con el pago confirmado la consulta cierra y queda sellada', async () => {
    const res = await http()
      .post(`/clinical/encounters/${chargeId}/close`)
      .set(bearer(medica.token))
      .send({})
      .expect(200);
    expect(res.body.contentHash).toBeTruthy();
  });

  it('9 · la excepción «cerrar sin pago» exige motivo y deja rastro de auditoría', async () => {
    const otroCargo = await consultaEnCurso(medica, otroPaciente.profileId, 10);
    await http()
      .post(`/clinical/encounters/${otroCargo}/close`)
      .set(bearer(medica.token))
      .send({ closeWithoutPayment: true })
      .expect(400);
    await http()
      .post(`/clinical/encounters/${otroCargo}/close`)
      .set(bearer(medica.token))
      .send({
        closeWithoutPayment: true,
        closeWithoutPaymentReason: 'Paga la próxima sesión',
      })
      .expect(200);
    const rastro = await ctx.orm.em.getConnection().execute<{ n: string }[]>(
      `select count(*)::text as n from audit.audit_log
          where action = 'ENCOUNTER_CLOSED_WITHOUT_PAYMENT' and entity_id = ?`,
      [otroCargo],
    );
    expect(rastro[0].n).toBe('1');
  });

  it('10 · la tabla de pagos del prestador lista sus sesiones con estado y comprobante, paginada', async () => {
    const res = await http()
      .get('/billing/me/provider-payment-table')
      .query({ limit: 1 })
      .set(bearer(medica.token))
      .expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.nextCursor).toEqual(expect.any(String));
    const segunda = await http()
      .get('/billing/me/provider-payment-table')
      .query({ limit: 1, cursor: res.body.nextCursor })
      .set(bearer(medica.token))
      .expect(200);
    expect(segunda.body.items).toHaveLength(1);
    expect(segunda.body.items[0].chargeId).not.toBe(res.body.items[0].chargeId);

    const todas = await http()
      .get('/billing/me/provider-payment-table')
      .set(bearer(medica.token))
      .expect(200);
    const pagada = todas.body.items.find(
      (i: { chargeId: string }) => i.chargeId === chargeId,
    );
    expect(pagada).toMatchObject({
      status: 'PAID',
      amountMinor: 15000,
      patientAmountMinor: 15000,
      insurerAmountMinor: 0,
      proof: expect.objectContaining({ status: 'ACCEPTED', method: 'CASH' }),
    });
    expect(todas.body.totals.sessions).toBeGreaterThanOrEqual(2);

    // Otro médico no ve las sesiones de la médica; el paciente no tiene tabla.
    const ajena = await http()
      .get('/billing/me/provider-payment-table')
      .set(bearer(otroMedico.token))
      .expect(200);
    expect(
      ajena.body.items.map((i: { chargeId: string }) => i.chargeId),
    ).not.toContain(chargeId);
    await http()
      .get('/billing/me/provider-payment-table')
      .set(bearer(paciente.token))
      .expect(403);
  });
});
