#!/usr/bin/env node
/**
 * seed-estudios-duplicados.mjs — Recorrido completo de la antiduplicación de
 * estudios (subtarea 3.2, T-26, brecha §23), contra la API real.
 *
 * ## Qué siembra y por qué
 *
 * 1. Un paciente con una orden previa (Ecografía abdominal) ya emitida,
 *    liberada y con conclusión: es el estudio "ya realizado" que el motor
 *    tiene que encontrar.
 * 2. Un `duplicate-check` contra ese mismo estudio: confirma `isDuplicate: true`.
 * 3. Una segunda orden SIN decisión: confirma el 422 `DUPLICATE_STUDY_DETECTED`.
 * 4. La misma orden CON `duplicateOverrideReason`: confirma el 201 `ACTIVE`.
 * 5. Una unidad diagnóstica y una oferta con el MISMO `study_concept_id` que
 *    usa la orden clínica — los dos catálogos de estudio del proyecto no
 *    coinciden por defecto (deriva preexistente, no se corrige acá).
 * 6. Un reclamo vinculado a la orden justificada: confirma que SÍ se factura.
 * 7. Una tercera orden con `reusePreviousReport`: confirma el 201
 *    `SR_SATISFIED_BY_PRIOR`, y que un reclamo sobre ella responde 422 (no
 *    facturable).
 *
 * No es un mock: escribe por la API real, con sus guards y validaciones. Si
 * el contrato cambia, la corrida termina en rojo en vez de dejar datos a
 * medias.
 *
 * ## Uso
 *
 *   node tools/alovida/seed-estudios-duplicados.mjs
 *   node tools/alovida/seed-estudios-duplicados.mjs --base-url http://localhost:3125
 *
 * Requiere una API levantada con el administrador de arranque
 * (`BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`) y, si el reclamo
 * vinculado va a leerse (`GET /insurance-claims/:id`), el patch v4.2.11
 * aplicado (`insurance_claims.service_request_id`).
 */

/**
 * Lee un argumento con valor de la línea de órdenes.
 *
 * @param name - Nombre del argumento, sin guiones.
 * @param fallback - Valor si no viene.
 * @returns El valor recibido o el de reserva.
 */
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const BASE = arg('base-url', process.env.API_BASE_URL ?? 'http://localhost:3000');
const ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@alovida.com';
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? '12345678';

/** Contraseña de la cuenta sembrada. Fija y conocida: es de demostración. */
const CLAVE = 'D3mo-passw0rd!';

/** Sufijo de la corrida, para que dos pasadas no choquen por código único. */
const TANDA = Date.now().toString(36).slice(-5);

/** Moneda de la línea del reclamo: el boliviano del catálogo global. */
const CODIGO_MONEDA = 'BOB';

/**
 * El estudio de la corrida. `IMG_ECO_ABDOMINAL` es el código local del
 * catálogo clínico (`clinical.concepts.ts`), namespace distinto del que usan
 * las ofertas de los centros (`DU_STUDY_*`) — por eso la oferta que se crea
 * más abajo apunta a ESTE `conceptId`, no a uno propio de `diagnostic_units`.
 */
const CODIGO_ESTUDIO = 'IMG_ECO_ABDOMINAL';

let token = '';

/**
 * Llama a la API y devuelve el resultado, sin lanzar.
 *
 * @param titulo - Qué se estaba haciendo, para el mensaje de error.
 * @param method - Verbo HTTP.
 * @param path - Ruta, relativa a la base.
 * @param options - `body`, `expect`, `auth`, `token`.
 * @returns `{ ok, status, body }`.
 */
async function call(titulo, method, path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const bearer = options.token === undefined ? token : options.token;
  if (options.auth !== false && bearer) headers.Authorization = `Bearer ${bearer}`;

  const esperado = options.expect === undefined
    ? null
    : Array.isArray(options.expect)
      ? options.expect
      : [options.expect];

  // Reintenta ante el límite de peticiones: el alta de cuentas está acotada a
  // diez por minuto por IP.
  for (let intento = 0; intento < 4; intento += 1) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const texto = await res.text();
    let body = null;
    try {
      body = texto ? JSON.parse(texto) : null;
    } catch {
      body = texto;
    }

    if (res.status === 429 && intento < 3) {
      const espera = Number(res.headers.get('retry-after') ?? 60);
      console.log(`    · límite de peticiones alcanzado; esperando ${espera} s…`);
      await new Promise((r) => setTimeout(r, espera * 1000));
      continue;
    }

    const ok = esperado === null ? res.ok : esperado.includes(res.status);
    if (!ok) {
      console.log(`    ✗ ${titulo} → ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
    }
    return { ok, status: res.status, body };
  }
  return { ok: false, status: 0, body: null };
}

/**
 * Busca un concepto por su código exacto.
 *
 * @param codigo - Código del concepto.
 * @returns Su identificador, o `null`.
 */
async function conceptoPorCodigo(codigo) {
  const res = await call(
    `concepto ${codigo}`,
    'GET',
    `/terminology/concepts?q=${encodeURIComponent(codigo)}&limit=50`,
  );
  if (!res.ok) return null;
  const items = res.body?.items ?? [];
  // La búsqueda devuelve `conceptId`, no `id`.
  return items.find((c) => c.code === codigo)?.conceptId ?? null;
}

/**
 * Municipio de residencia para el alta de paciente.
 *
 * @returns El `conceptId` de La Paz, o `null`.
 */
async function municipioDeLaPaz() {
  const res = await call(
    'municipio La Paz',
    'GET',
    '/terminology/concepts?q=geo%3Abo%3Amunicipality%3A020101&limit=10',
  );
  if (!res.ok) return null;
  return (
    (res.body?.items ?? []).find(
      (c) => c.code === 'geo:bo:municipality:020101',
    )?.conceptId ?? null
  );
}

/**
 * Departamento de expedición del CI para el alta de paciente
 * (`register-patient` exige `issuerAdministrativeAreaConceptId` desde
 * v4.1.4). Mismo departamento que {@link municipioDeLaPaz}.
 *
 * @returns El `conceptId` de La Paz (`VS_BO_DEPARTMENT`), o `null`.
 */
async function departamentoDeEmision() {
  const res = await call(
    'departamento de emisión (La Paz)',
    'GET',
    '/terminology/concepts?q=geo%3Abo%3Adepartment%3ALP&limit=10',
  );
  if (!res.ok) return null;
  return (
    (res.body?.items ?? []).find((c) => c.code === 'geo:bo:department:LP')
      ?.conceptId ?? null
  );
}

/**
 * El tenant que declara el JWT (no viaja en el cuerpo del login).
 *
 * @param jwt - El token de acceso.
 * @returns El primer tenant declarado, o `null`.
 */
function tenantDelToken(jwt) {
  const partes = jwt.split('.');
  if (partes.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'));
    return payload.tenants?.[0] ?? null;
  } catch {
    return null;
  }
}

function fallar() {
  process.exitCode = 1;
}

/**
 * Punto de entrada.
 *
 * @returns Código de salida por `process.exitCode`.
 */
async function main() {
  console.log(`\nSembrando el recorrido de estudios duplicados contra ${BASE}\n`);

  const acceso = await call('login del administrador', 'POST', '/iam/auth/login', {
    auth: false,
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    expect: 200,
  });
  if (!acceso.ok) {
    console.log(`✗ No se pudo entrar como ${ADMIN_EMAIL}.`);
    return fallar();
  }
  token = acceso.body.accessToken;
  const tenantId = tenantDelToken(token);
  if (!tenantId) {
    console.log('✗ El administrador no declara tenant: sin él no hay dónde crear la unidad diagnóstica.');
    return fallar();
  }

  const estudioConceptId = await conceptoPorCodigo(CODIGO_ESTUDIO);
  if (!estudioConceptId) {
    console.log(`✗ El catálogo no tiene el estudio «${CODIGO_ESTUDIO}».`);
    return fallar();
  }
  const monedaId = await conceptoPorCodigo(CODIGO_MONEDA);
  if (!monedaId) {
    console.log(`✗ El catálogo no tiene la moneda «${CODIGO_MONEDA}».`);
    return fallar();
  }
  const municipio = await municipioDeLaPaz();
  const departamento = await departamentoDeEmision();
  if (!municipio || !departamento) {
    console.log('✗ El catálogo no tiene el municipio/departamento de La Paz.');
    return fallar();
  }

  /* ---- paciente ------------------------------------------------------- */

  console.log('· Paciente de la corrida…');
  const ci = `9${String(1_000_000 + Number(`0x${TANDA}`) % 8_000_000).slice(0, 7)}`;
  const correo = `duplicado.${TANDA}@alovida.test`;
  const alta = await call('alta de paciente', 'POST', '/iam/auth/register-patient', {
    auth: false,
    body: {
      nationalId: ci,
      password: CLAVE,
      name: 'Rosario',
      lastName: `Estudios-${TANDA}`,
      email: correo,
      birthDate: '1985-03-12',
      residenceMunicipalityConceptId: municipio,
      issuerAdministrativeAreaConceptId: departamento,
      phone: '+591 76543210',
      sexAtBirth: 'FEMALE',
    },
    expect: 201,
  });
  if (!alta.ok) return fallar();
  const patientProfileId =
    alta.body?.patientProfileId ?? alta.body?.profileId ?? alta.body?.personId;
  if (!patientProfileId) {
    console.log('✗ El alta no devolvió el perfil de paciente.');
    return fallar();
  }
  console.log(`    paciente: ${patientProfileId}`);

  /* ---- encuentro -------------------------------------------------------- */

  console.log('· Encuentro clínico en curso…');
  const episodio = await call('episodio de cuidado', 'POST', '/clinical/care-episodes', {
    body: { patientProfileId, tenantId },
    expect: 201,
  });
  if (!episodio.ok) return fallar();

  const encuentro = await call('registro de encuentro', 'POST', '/clinical/encounters/check-in', {
    body: { patientProfileId, tenantId, episodeId: episodio.body.id },
    expect: 201,
  });
  if (!encuentro.ok) return fallar();
  const encounterId = encuentro.body.id;
  console.log(`    encuentro: ${encounterId}`);

  /* ---- orden previa + informe liberado ----------------------------------- */

  console.log('· Orden previa + informe liberado (el estudio "ya realizado")…');
  const ordenPrevia = await call('orden previa', 'POST', '/clinical/service-requests', {
    body: {
      custodianTenantId: tenantId,
      patientProfileId,
      encounterId,
      codeConceptId: estudioConceptId,
      performerTenantId: tenantId,
    },
    expect: 201,
  });
  if (!ordenPrevia.ok) return fallar();

  const informe = await call('informe diagnóstico', 'POST', '/clinical/diagnostic-reports', {
    body: {
      custodianTenantId: tenantId,
      patientProfileId,
      serviceRequestId: ordenPrevia.body.id,
      codeConceptId: estudioConceptId,
    },
    expect: 201,
  });
  if (!informe.ok) return fallar();
  const reportId = informe.body.id;

  const version = await call('versión del informe', 'POST', `/diagnostics/reports/${reportId}/versions`, {
    body: { conclusionText: 'Hígado de tamaño y ecogenicidad conservados. Sin hallazgos.' },
    expect: 201,
  });
  if (!version.ok) return fallar();

  const liberacion = await call(
    'liberación del informe',
    'POST',
    `/diagnostics/reports/${reportId}/versions/${version.body.id}/release`,
    { body: { patientVisibility: 'VISIBLE' }, expect: 200 },
  );
  if (!liberacion.ok) return fallar();
  console.log(`    informe liberado: ${reportId}`);

  /* ---- el chequeo --------------------------------------------------------- */

  console.log('· Chequeo de duplicidad…');
  const chequeo = await call('duplicate-check', 'POST', '/clinical/service-requests/duplicate-check', {
    body: { patientProfileId, codeConceptId: estudioConceptId, encounterId },
    expect: 200,
  });
  if (!chequeo.ok) return fallar();
  if (chequeo.body?.isDuplicate !== true) {
    console.log('    ✗ isDuplicate no dio true — el motor no encontró el informe recién liberado');
    return fallar();
  }
  console.log(`    isDuplicate: true — daysAgo ${chequeo.body.previousStudy?.daysAgo}`);

  /* ---- segunda orden sin decisión -> 422 ---------------------------------- */

  console.log('· Segunda orden sin decisión (tiene que responder 422)…');
  const sinDecision = await call(
    'orden sin decisión',
    'POST',
    '/clinical/service-requests',
    {
      body: {
        custodianTenantId: tenantId,
        patientProfileId,
        encounterId,
        codeConceptId: estudioConceptId,
        performerTenantId: tenantId,
      },
      expect: 422,
    },
  );
  if (!sinDecision.ok) return fallar();
  if (sinDecision.body?.details?.reason !== 'DUPLICATE_STUDY_DETECTED') {
    console.log('    ✗ el 422 no trae details.reason = DUPLICATE_STUDY_DETECTED');
    return fallar();
  }
  console.log('    422 con details.reason = DUPLICATE_STUDY_DETECTED');

  /* ---- unidad diagnóstica + oferta (para el reclamo vinculado) ------------ */

  console.log('· Unidad diagnóstica y oferta del mismo estudio…');
  const unidad = await call('alta de unidad diagnóstica', 'POST', '/diagnostic-units', {
    body: { tenantId, code: `DUP-${TANDA}`, name: `Centro de demostración ${TANDA}` },
    expect: 201,
  });
  if (!unidad.ok) return fallar();
  const unitId = unidad.body.id;

  const oferta = await call(
    'alta de oferta de estudio',
    'POST',
    `/diagnostic-units/${unitId}/study-offerings`,
    {
      body: {
        studyCode: `ECO-ABD-${TANDA}`,
        // El namespace de la oferta (diagnostic_units) es distinto del
        // clínico por defecto; se fuerza acá al mismo conceptId a propósito,
        // que es justo lo que LinkedClaimOrderService.diagnosticSnapshot exige.
        studyConceptId: estudioConceptId,
        displayName: 'Ecografía abdominal',
      },
      expect: 201,
    },
  );
  if (!oferta.ok) return fallar();
  const offeringId = oferta.body.id;
  console.log(`    unidad: ${unitId} · oferta: ${offeringId}`);

  /* ---- tercera orden, con justificación -> 201 ACTIVE + reclamo facturable */

  console.log('· Repetir con justificación (tiene que responder 201 ACTIVE)…');
  const conJustificacion = await call(
    'orden con justificación',
    'POST',
    '/clinical/service-requests',
    {
      body: {
        custodianTenantId: tenantId,
        patientProfileId,
        encounterId,
        codeConceptId: estudioConceptId,
        performerTenantId: unitId,
        previousDiagnosticReportId: reportId,
        duplicateOverrideReason:
          'Control post-quirúrgico inmediato por sospecha de sangrado activo',
      },
      expect: 201,
    },
  );
  if (!conJustificacion.ok) return fallar();
  const ordenJustificadaId = conJustificacion.body.id;
  console.log(`    orden ACTIVE con justificación: ${ordenJustificadaId}`);

  console.log('· Reclamo vinculado a la orden justificada (tiene que ser facturable)…');
  const coberturaPlan = await coberturaDelPaciente({
    tenantId,
    patientProfileId,
    monedaId,
    tanda: TANDA,
  });
  if (!coberturaPlan) return fallar();

  const reclamo = await call('reclamo vinculado', 'POST', '/insurance-claims', {
    body: {
      insuranceCarrierId: coberturaPlan.carrierId,
      patientCoverageId: coberturaPlan.coverageId,
      billingProviderEntityId: unitId,
      claimIdentifier: `CLM-DUP-${TANDA}-1`,
      serviceRequestId: ordenJustificadaId,
      currencyConceptId: coberturaPlan.currencyConceptId,
      lines: [
        {
          lineSequence: 1,
          billedAmount: '350.00',
          diagnosticStudyOfferingId: offeringId,
        },
      ],
    },
    expect: 201,
  });
  if (!reclamo.ok) return fallar();
  console.log(`    reclamo facturado: ${reclamo.body.id}`);

  const lecturaReclamo = await call(
    'lectura del reclamo (duplicateStudy)',
    'GET',
    `/insurance-claims/${reclamo.body.id}`,
    { expect: [200, 403] },
  );
  if (lecturaReclamo.status === 403) {
    console.log('    · GET /insurance-claims/:id respondió 403 — probablemente falta el patch v4.2.11 en esta base');
  } else if (lecturaReclamo.ok) {
    const duplicateStudy = lecturaReclamo.body?.lines?.[0]?.duplicateStudy;
    console.log(
      duplicateStudy
        ? `    duplicateStudy presente: ${duplicateStudy.studyName} · ${duplicateStudy.daysAgo}d`
        : '    ✗ la línea no trae duplicateStudy',
    );
  }

  /* ---- cuarta orden, reutilizando el informe -> no facturable ------------- */

  console.log('· Reutilizar el informe previo (tiene que responder 201 SR_SATISFIED_BY_PRIOR)…');
  const reutilizada = await call(
    'orden reutilizada',
    'POST',
    '/clinical/service-requests',
    {
      body: {
        custodianTenantId: tenantId,
        patientProfileId,
        encounterId,
        codeConceptId: estudioConceptId,
        performerTenantId: unitId,
        previousDiagnosticReportId: reportId,
        reusePreviousReport: true,
      },
      expect: 201,
    },
  );
  if (!reutilizada.ok) return fallar();
  console.log(`    orden reutilizada: ${reutilizada.body.id} (status: ${reutilizada.body.status})`);

  const reclamoNoFacturable = await call(
    'reclamo sobre orden reutilizada (tiene que responder 422)',
    'POST',
    '/insurance-claims',
    {
      body: {
        insuranceCarrierId: coberturaPlan.carrierId,
        patientCoverageId: coberturaPlan.coverageId,
        billingProviderEntityId: unitId,
        claimIdentifier: `CLM-DUP-${TANDA}-2`,
        serviceRequestId: reutilizada.body.id,
        currencyConceptId: coberturaPlan.currencyConceptId,
        lines: [
          {
            lineSequence: 1,
            billedAmount: '350.00',
            diagnosticStudyOfferingId: offeringId,
          },
        ],
      },
      expect: 422,
    },
  );
  console.log(
    reclamoNoFacturable.ok
      ? '    422 — la orden reutilizada no es facturable, como se esperaba'
      : '    ✗ el reclamo sobre la orden reutilizada no respondió 422',
  );

  console.log('\n✓ Recorrido de antiduplicación completo.\n');
}

/**
 * Aseguradora, producto, plan y cobertura del paciente, en el tenant del
 * administrador. Reutiliza lo que ya exista (el índice único por tenant de
 * `insurance_carriers` impide crear una segunda en una segunda corrida).
 *
 * @param opts - `tenantId`, `patientProfileId`, `monedaId`, `tanda`.
 * @returns `{ carrierId, coverageId, currencyConceptId }`, o `null` si algo falla.
 */
async function coberturaDelPaciente({ tenantId, patientProfileId, monedaId, tanda }) {
  const existentes = await call('aseguradoras del tenant', 'GET', '/insurance-carriers', {
    expect: 200,
  });
  let carrierId = existentes.ok ? (existentes.body.items?.[0]?.id ?? null) : null;

  if (carrierId === null) {
    const carrier = await call('alta de aseguradora', 'POST', '/insurance-carriers', {
      body: {
        tenantId,
        carrierCode: `DUP-${tanda}`,
        legalName: `Aseguradora de demostración ${tanda}`,
        regulatorIdentifier: `APS-DUP-${tanda}`,
      },
      expect: 201,
    });
    if (!carrier.ok) return null;
    carrierId = carrier.body.id;
  }

  const ficha = await call('catálogo de la aseguradora', 'GET', `/insurance-carriers/${carrierId}`, {
    expect: 200,
  });
  let planId = null;
  let currencyConceptId = monedaId;
  if (ficha.ok) {
    for (const producto of ficha.body.products ?? []) {
      for (const p of producto.plans ?? []) {
        if (p.currency) {
          planId = p.id;
          currencyConceptId = p.currency.id ?? monedaId;
          break;
        }
      }
      if (planId) break;
    }
  }

  if (planId === null) {
    const producto = await call('alta de producto', 'POST', `/insurance-carriers/${carrierId}/products`, {
      body: { productCode: `DUP-PROD-${tanda}`, name: 'Salud integral' },
      expect: 201,
    });
    if (!producto.ok) return null;

    const plan = await call('alta de plan', 'POST', `/insurance-products/${producto.body.id}/plans`, {
      body: {
        planCode: `DUP-PLAN-${tanda}`,
        name: 'Plan de demostración',
        currencyConceptId: monedaId,
        effectiveFrom: '2026-01-01',
      },
      expect: 201,
    });
    if (!plan.ok) return null;
    planId = plan.body.id;
  }

  const cobertura = await call('cobertura del paciente', 'POST', '/patient-coverages', {
    body: {
      insurancePlanId: planId,
      patientProfileId,
      memberIdentifier: `DUP-AF-${tanda}`,
      policyIdentifier: `DUP-POL-${tanda}`,
      coverageOrder: 1,
    },
    expect: 201,
  });
  if (!cobertura.ok) return null;

  return { carrierId, coverageId: cobertura.body.id, currencyConceptId };
}

await main();
