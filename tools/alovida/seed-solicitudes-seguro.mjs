#!/usr/bin/env node
/**
 * seed-solicitudes-seguro.mjs — Solicitudes de seguro presentadas, para poder
 * mirar la pantalla de la TAREA-16 con algo adentro.
 *
 * ## Por qué hace falta
 *
 * `insurance.insurance_claims` arranca vacía y ningún otro seeder la toca. Sin
 * filas, `/administration/insurance-claims` muestra su estado vacío para
 * siempre y no hay forma de distinguir «no hay solicitudes» de «la lectura no
 * funciona» — que es exactamente lo que un seeder existe para evitar.
 *
 * ## Por qué la aseguradora se crea en el tenant del administrador
 *
 * Las 25 aseguradoras que siembra el arranque viven **cada una en su propio
 * tenant**: así se aprovisiona un pagador. `GET /insurance-claims` acota por
 * las aseguradoras del tenant activo, así que desde el tenant del
 * administrador de arranque no se ve ninguna, y eso es correcto.
 *
 * Para que la pantalla se pueda mirar sin trucos de cabecera, esta corrida
 * crea **su propia** aseguradora, con producto y plan, dentro del tenant del
 * administrador. No se toca ninguna de las 25 reales: sembrar solicitudes a
 * nombre de La Boliviana Ciacruz sería poner datos inventados en la ficha de
 * una empresa que existe.
 *
 * ## Qué siembra, y por qué esa mezcla
 *
 * Cuatro solicitudes, deliberadamente distintas, porque cada una prueba algo
 * que las otras no:
 *
 * 1. **Aprobada entera.** El caso feliz: total aprobado = total facturado.
 * 2. **Aprobada en parte, con un ítem denegado.** Es la única que permite ver
 *    el motivo catalogado del rechazo y dos importes distintos en la misma
 *    fila.
 * 3. **Sin dictamen.** El «total aprobado» tiene que quedar **vacío**, no en
 *    `0.00`: es la diferencia entre «todavía no contestaron» y «denegaron
 *    todo», y confundirlas es un error contable. Sin esta fila no se puede
 *    comprobar.
 * 4. **Reclamada.** Con dictamen y con disputa abierta encima, para ver la
 *    marca de «Reclamada» en el listado y el historial en el detalle.
 *
 * Los importes llevan **dos decimales y también uno de tres** a propósito: el
 * total del reclamo se guarda con suma decimal exacta, y una línea de tres
 * decimales es lo que delata si alguien la vuelve a calcular con `Number()`.
 *
 * No es un mock: escribe por la API real, con sus guards y validaciones. Si el
 * contrato cambia, la corrida termina en rojo en vez de dejar datos a medias.
 *
 * ## Uso
 *
 *   node tools/alovida/seed-solicitudes-seguro.mjs
 *   node tools/alovida/seed-solicitudes-seguro.mjs --base-url http://localhost:3001
 *
 * Requiere una API levantada con el administrador de arranque
 * (`BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`).
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
const ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@redesa.test';
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'S3cret-passw0rd';

/** Contraseña de las cuentas sembradas. Fija y conocida: son de demostración. */
const CLAVE = 'D3mo-passw0rd!';

/**
 * Cuenta con la que se mira la pantalla de solicitudes.
 *
 * Fija —no lleva el sufijo de la corrida— para que el E2E y quien revise a
 * mano sepan de antemano con qué entrar, y para que dos siembras no dejen dos
 * operadores distintos.
 */
const OPERADOR_EMAIL =
  process.env.T16_BILLING_OPERATOR_EMAIL ?? 'facturacion.demo@alovida.test';

/** Sufijo de la corrida, para que dos pasadas no choquen por código único. */
const TANDA = Date.now().toString(36).slice(-5);

/**
 * Moneda de los planes sembrados: el boliviano del catálogo global.
 *
 * Se resuelve por **código** contra terminología y no se escribe el uuid: un
 * identificador copiado a mano deja de existir en cuanto alguien reconstruye
 * la base.
 */
const CODIGO_MONEDA = 'BOB';

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
  // diez por minuto por IP y esta corrida hace más que eso.
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
 * Municipio de residencia para las altas de paciente.
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

/** Los pacientes de la corrida. Sexo declarado, no deducido del nombre. */
const PACIENTES = [
  { nombre: 'Teresa', apellido: 'Aruquipa', ci: '3312874', sexo: 'FEMALE', nacimiento: '1968-11-05' },
  { nombre: 'Hernán', apellido: 'Cazorla', ci: '5540193', sexo: 'MALE', nacimiento: '1981-02-23' },
  { nombre: 'Lidia', apellido: 'Poma', ci: '7719260', sexo: 'FEMALE', nacimiento: '1994-07-14' },
];

/**
 * Las cuatro solicitudes, con lo que hay que poder ver en cada una.
 *
 * `dictamen: null` es la que deja el total aprobado vacío. `reclamo: true`
 * abre disputa después de dictaminar. Desde v4.2.9 (subtarea 2.2), toda línea
 * `DENIED` es OBLIGATORIA de mandar con `policyClauseReference` — la API
 * responde 400 si no viene —, así que `dictamen.clausulas`/`.justificaciones`
 * llevan un valor en cada posición cuya `decisiones[i] === 'DENIED'`.
 */
const SOLICITUDES = [
  {
    nota: 'aprobada entera',
    lineas: [
      { billedAmount: '450.00', patientResponsibilityAmount: '0.00' },
      { billedAmount: '180.50', patientResponsibilityAmount: '0.00' },
    ],
    dictamen: { outcome: 'APPROVED', decisiones: ['APPROVED', 'APPROVED'] },
    reclamo: false,
  },
  {
    nota: 'aprobada en parte, con un ítem denegado',
    lineas: [
      { billedAmount: '1200.00', patientResponsibilityAmount: '120.00' },
      { billedAmount: '75.125', patientResponsibilityAmount: '0.00' },
      { billedAmount: '340.00', patientResponsibilityAmount: '0.00' },
    ],
    dictamen: {
      outcome: 'DENIED',
      decisiones: ['APPROVED', 'DENIED', 'APPROVED'],
      clausulas: [null, 'Cláusula 12.3: Estudio no cubierto en el plan ambulatorio', null],
      justificaciones: [
        null,
        'El estudio requiere autorización previa del área médica según las condiciones generales de la póliza.',
        null,
      ],
    },
    reclamo: false,
  },
  {
    nota: 'sin dictamen — el total aprobado tiene que quedar VACÍO',
    lineas: [{ billedAmount: '620.00', patientResponsibilityAmount: '62.00' }],
    dictamen: null,
    reclamo: false,
  },
  {
    nota: 'reclamada',
    lineas: [
      { billedAmount: '2100.00', patientResponsibilityAmount: '210.00' },
      { billedAmount: '95.00', patientResponsibilityAmount: '0.00' },
    ],
    dictamen: {
      outcome: 'DENIED',
      decisiones: ['DENIED', 'APPROVED'],
      clausulas: ['Cláusula 4.1: Preexistencia declarada al momento de la afiliación', null],
      justificaciones: [
        'La condición fue declarada como preexistencia en la solicitud de afiliación y queda excluida durante el período de carencia.',
        null,
      ],
    },
    reclamo: true,
  },
];

/**
 * Punto de entrada.
 *
 * @returns Código de salida por `process.exitCode`.
 */
async function main() {
  console.log(`\nSembrando solicitudes de seguro contra ${BASE}\n`);

  const acceso = await call('login del administrador', 'POST', '/iam/auth/login', {
    auth: false,
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    expect: 200,
  });
  if (!acceso.ok) {
    console.log(`✗ No se pudo entrar como ${ADMIN_EMAIL}.`);
    process.exitCode = 1;
    return;
  }
  token = acceso.body.accessToken;
  // El tenant viaja en el JWT, no en el cuerpo de la respuesta: el login
  // devuelve sólo los tokens y su vencimiento.
  const tenantId = tenantDelToken(token);
  if (!tenantId) {
    console.log('✗ El administrador no declara tenant: sin él no hay dónde crear la aseguradora.');
    process.exitCode = 1;
    return;
  }

  const monedaId = await conceptoPorCodigo(CODIGO_MONEDA);
  if (!monedaId) {
    console.log(`✗ El catálogo no tiene la moneda «${CODIGO_MONEDA}».`);
    process.exitCode = 1;
    return;
  }

  const municipio = await municipioDeLaPaz();
  if (!municipio) {
    console.log('✗ El catálogo no tiene el municipio de La Paz.');
    process.exitCode = 1;
    return;
  }

  /* ---- la práctica que presenta las solicitudes -------------------------- */

  // TAREA-16 · D1.a: el listado es la cara del **prestador que envió** el
  // reclamo, y acota por `billing_provider_entity_id` contra las prácticas
  // activas de la organización. Sin una práctica real acá, todo lo que siembre
  // esta corrida quedaría fuera de alcance y la pantalla se vería vacía.
  console.log('· Práctica que presenta las solicitudes…');

  const practicas = await call('prácticas del tenant', 'GET', '/practices', {
    expect: 200,
  });
  const listaPracticas = practicas.ok
    ? (Array.isArray(practicas.body) ? practicas.body : (practicas.body.items ?? []))
    : [];
  let practiceId = listaPracticas[0]?.id ?? null;

  if (practiceId === null) {
    const practica = await call('alta de práctica', 'POST', '/practices', {
      body: {
        tenantId,
        code: `PRAC-${TANDA}`,
        name: `Consultorio de demostración ${TANDA}`,
      },
      expect: 201,
    });
    if (!practica.ok) return fallar();
    practiceId = practica.body.id;
    console.log(`    práctica creada: ${practiceId}`);
  } else {
    console.log(`    práctica reutilizada: ${practiceId}`);
  }

  /* ---- el operador de facturación que va a mirar la pantalla ------------- */

  // D1.b: ver y reclamar es de `BILLING_OPERATOR`. El administrador entra por
  // el comodín `SUPERADMIN`, así que sin esta cuenta el E2E probaría un rol
  // que ningún usuario real tiene — que es justo el defecto que T16 corrige.
  await asegurarOperadorDeFacturacion(tenantId);

  /* ---- aseguradora, producto y plan del tenant del administrador --------- */

  // Reejecutable: `insurance.insurance_carriers` y `insurance_brokers` tienen
  // un índice único por `tenant_id` —**una** aseguradora y **un** corredor por
  // organización—, así que una segunda corrida no puede crear otra. Se
  // reutiliza la que ya está en vez de terminar en 409, que es lo que hacía
  // que la corrida sólo funcionara la primera vez.
  console.log('· Aseguradora, producto y plan de demostración…');

  const existentes = await call('aseguradoras del tenant', 'GET', '/insurance-carriers', {
    expect: 200,
  });
  let carrierId = existentes.ok ? (existentes.body.items?.[0]?.id ?? null) : null;
  let carrierNombre = existentes.ok ? (existentes.body.items?.[0]?.legalName ?? null) : null;

  if (carrierId === null) {
    const carrier = await call('alta de aseguradora', 'POST', '/insurance-carriers', {
      body: {
        tenantId,
        carrierCode: `DEMO-${TANDA}`,
        legalName: `Aseguradora de demostración ${TANDA}`,
        regulatorIdentifier: `APS-DEMO-${TANDA}`,
      },
      expect: 201,
    });
    if (!carrier.ok) return fallar();
    carrierId = carrier.body.id;
    carrierNombre = `Aseguradora de demostración ${TANDA}`;
    console.log(`    aseguradora creada: ${carrierNombre}`);
  } else {
    console.log(`    aseguradora reutilizada: ${carrierNombre}`);
  }

  // El producto y el plan **no** son únicos por tenant, así que cada corrida
  // agrega los suyos. Se reutiliza el primer plan que ya tenga moneda: sin
  // ella el importe llega sin unidad y la pantalla no puede mostrarlo entero.
  const ficha = await call('catálogo de la aseguradora', 'GET', `/insurance-carriers/${carrierId}`, {
    expect: 200,
  });
  let planId = null;
  if (ficha.ok) {
    for (const producto of ficha.body.products ?? []) {
      for (const p of producto.plans ?? []) {
        if (p.currency !== null && p.currency !== undefined) {
          planId = p.id;
          break;
        }
      }
      if (planId) break;
    }
  }

  if (planId === null) {
    const producto = await call(
      'alta de producto',
      'POST',
      `/insurance-carriers/${carrierId}/products`,
      { body: { productCode: `PROD-${TANDA}`, name: 'Salud integral' }, expect: 201 },
    );
    if (!producto.ok) return fallar();

    const plan = await call(
      'alta de plan',
      'POST',
      `/insurance-products/${producto.body.id}/plans`,
      {
        body: {
          planCode: `PLAN-${TANDA}`,
          name: 'Plan familiar',
          currencyConceptId: monedaId,
          effectiveFrom: '2026-01-01',
        },
        expect: 201,
      },
    );
    if (!plan.ok) return fallar();
    planId = plan.body.id;
    console.log('    plan creado, con moneda');
  } else {
    console.log('    plan reutilizado');
  }

  const brokersExistentes = await call('corredores del tenant', 'GET', '/insurance-brokers', {
    expect: 200,
  });
  let brokerId = brokersExistentes.ok
    ? (brokersExistentes.body.items?.[0]?.id ?? null)
    : null;
  if (brokerId === null) {
    const broker = await call('alta de corredor', 'POST', '/insurance-brokers', {
      body: {
        tenantId,
        brokerCode: `BRK-${TANDA}`,
        legalName: `Correduría de demostración ${TANDA}`,
        licenseNumber: `APS-BRK-${TANDA}`,
      },
      expect: 201,
    });
    if (broker.ok) brokerId = broker.body.id;
  }

  /* ---- pacientes y coberturas ------------------------------------------- */

  console.log(`· Dando de alta ${PACIENTES.length} pacientes con su cobertura…`);
  const coberturas = [];
  for (const [indice, persona] of PACIENTES.entries()) {
    const ci = `${persona.ci}${TANDA.slice(-2)}`;
    const correo = `${persona.nombre.toLowerCase()}.${persona.apellido.toLowerCase()}.${TANDA}${indice}@alovida.test`;
    const quien = `${persona.nombre} ${persona.apellido}`;

    const alta = await call(`alta de ${quien}`, 'POST', '/iam/auth/register-patient', {
      auth: false,
      body: {
        nationalId: ci,
        password: CLAVE,
        name: persona.nombre,
        lastName: persona.apellido,
        email: correo,
        birthDate: persona.nacimiento,
        residenceMunicipalityConceptId: municipio,
        phone: `+591 7${String(30_000_000 + indice * 317).slice(0, 7)}`,
        sexAtBirth: persona.sexo,
      },
      expect: 201,
    });
    if (!alta.ok) continue;

    // `register-patient` devuelve el perfil de paciente, que es la persona:
    // `patient_coverages.patient_profile_id` apunta a `persons.id`.
    const patientProfileId =
      alta.body?.patientProfileId ?? alta.body?.profileId ?? alta.body?.personId;
    if (!patientProfileId) {
      console.log(`    ✗ ${quien}: el alta no devolvió el perfil de paciente`);
      continue;
    }

    const cobertura = await call(
      `cobertura de ${quien}`,
      'POST',
      '/patient-coverages',
      {
        body: {
          insurancePlanId: planId,
          patientProfileId,
          memberIdentifier: `AF-${TANDA}-${indice + 1}`,
          policyIdentifier: `POL-${TANDA}-${indice + 1}`,
          coverageOrder: 1,
          ...(brokerId ? { insuranceBrokerId: brokerId } : {}),
        },
        expect: 201,
      },
    );
    if (!cobertura.ok) continue;

    coberturas.push({ quien, id: cobertura.body.id });
    console.log(`    ${indice + 1}/${PACIENTES.length}  ${quien}`);
  }

  if (coberturas.length === 0) {
    console.log('✗ Sin coberturas no hay a qué colgar una solicitud.');
    return fallar();
  }

  /* ---- solicitudes ------------------------------------------------------- */

  console.log(`· Presentando ${SOLICITUDES.length} solicitudes…`);
  let presentadas = 0;
  let dictaminadas = 0;
  let reclamadas = 0;

  for (const [indice, receta] of SOLICITUDES.entries()) {
    const cobertura = coberturas[indice % coberturas.length];
    const identificador = `CLM-${TANDA}-${String(indice + 1).padStart(3, '0')}`;

    const solicitud = await call(
      `solicitud ${identificador}`,
      'POST',
      '/insurance-claims',
      {
        body: {
          insuranceCarrierId: carrierId,
          patientCoverageId: cobertura.id,
          // La entidad facturadora es **la práctica que presenta el reclamo**
          // (TAREA-16 · D1.a). Antes acá iba la aseguradora, que se facturaba a
          // sí misma: con el alcance del prestador esa fila no la ve nadie.
          billingProviderEntityId: practiceId,
          claimIdentifier: identificador,
          idempotencyKey: `${TANDA}-${indice}`,
          lines: receta.lineas.map((linea, orden) => ({
            lineSequence: orden + 1,
            quantity: '1',
            // La referencia clínica de origen. Va como texto porque es lo
            // único que el modelo ofrece para una atención: la clave foránea
            // sólo existe para estudios y dispensaciones.
            supportingClinicalReference: `ENC-${TANDA}-${indice + 1}-${orden + 1}`,
            ...linea,
          })),
        },
        expect: 201,
      },
    );
    if (!solicitud.ok) continue;
    presentadas += 1;

    if (receta.dictamen === null) {
      console.log(`    ${indice + 1}/${SOLICITUDES.length}  ${identificador} — ${receta.nota}`);
      continue;
    }

    // Los ítems se releen para adjudicar: la adjudicación va por
    // `insuranceClaimLineId`, y esos ids los pone el servidor.
    const detalle = await call(
      `ítems de ${identificador}`,
      'GET',
      `/insurance-claims/${solicitud.body.id}`,
      { expect: 200 },
    );
    if (!detalle.ok) continue;

    const lineas = detalle.body.lines ?? [];

    // Los totales de la versión se calculan a partir de las decisiones por
    // ítem y se **mandan**: el servicio no los deriva, y sin ellos la columna
    // «total aprobado» del listado quedaría vacía también en las solicitudes
    // que sí tienen dictamen — indistinguible de las que no lo tienen, que es
    // justo la diferencia que esta corrida existe para poder mirar.
    const adjudicaciones = lineas.map((linea, orden) => {
      const decision = receta.dictamen.decisiones[orden] ?? 'APPROVED';
      const facturado = linea.billedAmount.amount;
      return {
        insuranceClaimLineId: linea.id,
        decision,
        // Con la misma escala que el facturado: un «0» junto a un «2100.00»
        // en la misma columna se lee como un dato de otra clase.
        approvedAmount: decision === 'APPROVED' ? facturado : ceroComo(facturado),
        deniedAmount: decision === 'APPROVED' ? ceroComo(facturado) : facturado,
        patientAmount: linea.patientResponsibilityAmount?.amount ?? '0',
        // Subtarea 2.2 (v4.2.9): DENIED sin cláusula responde 400 desde este
        // patch. Los dos campos son `undefined` en una línea APPROVED —no se
        // manda un string vacío ni null: la propiedad simplemente no viaja.
        ...(decision === 'DENIED'
          ? {
              policyClauseReference: receta.dictamen.clausulas?.[orden] ?? undefined,
              denialRationale: receta.dictamen.justificaciones?.[orden] ?? undefined,
            }
          : {}),
      };
    });
    const sumar = (clave) =>
      sumaDecimal(adjudicaciones.map((a) => a[clave]));

    const dictamen = await call(
      `dictamen de ${identificador}`,
      'POST',
      `/insurance-claims/${solicitud.body.id}/adjudications`,
      {
        body: {
          outcome: receta.dictamen.outcome,
          dispositionText:
            receta.dictamen.outcome === 'APPROVED'
              ? 'Prestaciones cubiertas por el plan familiar.'
              : 'Se cubre lo prestado en red; el ítem señalado queda fuera de cobertura.',
          totalApprovedAmount: sumar('approvedAmount'),
          totalDeniedAmount: sumar('deniedAmount'),
          totalPatientAmount: sumar('patientAmount'),
          lineAdjudications: adjudicaciones,
        },
        expect: 201,
      },
    );
    if (dictamen.ok) dictaminadas += 1;

    if (receta.reclamo) {
      const disputa = await call(
        `reclamo de ${identificador}`,
        'POST',
        `/insurance-claims/${solicitud.body.id}/disputes`,
        { body: { initiatedBy: 'PROVIDER' }, expect: 201 },
      );
      if (disputa.ok) reclamadas += 1;
    }

    console.log(`    ${indice + 1}/${SOLICITUDES.length}  ${identificador} — ${receta.nota}`);
  }

  console.log('\n─── Resumen ───');
  console.log(`  Aseguradora: ${carrierNombre} (tenant del administrador)`);
  console.log(`  ${coberturas.length} coberturas · ${presentadas} solicitudes · ${dictaminadas} dictaminadas · ${reclamadas} reclamadas`);
  console.log(`  Pantalla: /administration/insurance-claims`);
  console.log(`  Entrá como ${ADMIN_EMAIL}\n`);
}

/**
 * Un cero con la misma cantidad de decimales que el importe de referencia.
 *
 * @param referencia - Importe del que se copia la escala.
 * @returns `'0.00'`, `'0.000'`… según corresponda.
 */
function ceroComo(referencia) {
  const decimales = String(referencia).split('.')[1]?.length ?? 0;
  return decimales === 0 ? '0' : `0.${'0'.repeat(decimales)}`;
}

/**
 * Deja lista la cuenta con la que se mira la pantalla: `BILLING_OPERATOR`.
 *
 * TAREA-16 · D1.b (Justin, 2026-09-04): ver el listado, abrir el detalle y
 * reclamar es del operador de facturación **del prestador**. El administrador
 * de arranque llega igual, pero por el comodín `SUPERADMIN`: certificar sólo
 * con él dejaría sin probar el único rol que un usuario real va a tener.
 *
 * Idempotente: si la cuenta ya existe se reutiliza, y la asignación de rol se
 * repite sin duplicar (el servicio de `authz` devuelve la vigente).
 *
 * @param tenantId - Organización del administrador, la misma de las solicitudes.
 * @returns Nada; informa por consola y no interrumpe la siembra si falla.
 */
async function asegurarOperadorDeFacturacion(tenantId) {
  console.log('· Operador de facturación (BILLING_OPERATOR)…');

  const alta = await call('alta del operador', 'POST', '/iam/users', {
    body: {
      displayName: 'Operadora de facturación (demo)',
      email: OPERADOR_EMAIL,
      password: CLAVE,
      // `initialRole` sólo admite roles **globales** de plataforma; el de
      // dominio vive en `authz` y se asigna abajo, acotado al tenant.
      initialRole: 'USER',
    },
    expect: [201, 409],
  });

  let userId = alta.status === 201 ? alta.body.id : null;
  if (userId === null) {
    const existentes = await call('búsqueda del operador', 'GET', `/iam/users?q=${encodeURIComponent(OPERADOR_EMAIL)}`, {
      expect: 200,
    });
    userId = existentes.ok ? (existentes.body.items?.[0]?.id ?? null) : null;
  }
  if (userId === null) {
    console.log('    ⚠ no se pudo crear ni encontrar la cuenta: seguí con el admin');
    return;
  }

  // Sin membresía la sesión entra pero no tiene organización activa, y toda
  // pantalla que dependa del tenant queda pidiendo una que la cuenta no tiene.
  await call('membresía del operador', 'POST', `/tenants/${tenantId}/memberships`, {
    body: { userId, role: 'STAFF', accessScope: 'ALL_TENANT' },
    expect: [201, 409],
  });

  const rol = await call(
    'rol BILLING_OPERATOR',
    'POST',
    `/authz/users/${userId}/role-assignments`,
    { body: { roleCode: 'BILLING_OPERATOR', tenantId }, expect: [201, 409] },
  );

  if (rol.ok || rol.status === 409) {
    console.log(`    ${OPERADOR_EMAIL} / ${CLAVE}`);
  } else {
    console.log('    ⚠ la cuenta existe pero no se le pudo asignar el rol');
  }
}

/**
 * Suma importes decimales sin pasar por coma flotante.
 *
 * Con `Number()`, `75.125 + 0` deja de ser `75.125` en cuanto se suma con
 * otros; el total del dictamen dejaría de cuadrar con la suma de sus ítems por
 * un céntimo que nadie puede explicar después. Se opera sobre la
 * representación decimal literal.
 *
 * @param importes - Importes como cadena.
 * @returns La suma como cadena decimal.
 */
function sumaDecimal(importes) {
  const escalas = importes.map((texto) => {
    const [entera, fraccion = ''] = String(texto).split('.');
    return { entera, fraccion };
  });
  const decimales = escalas.reduce((max, e) => Math.max(max, e.fraccion.length), 0);
  const total = escalas.reduce(
    (acc, e) => acc + BigInt(`${e.entera}${e.fraccion.padEnd(decimales, '0')}`),
    0n,
  );
  if (decimales === 0) return total.toString();
  const digitos = total.toString().padStart(decimales + 1, '0');
  const corte = digitos.length - decimales;
  return `${digitos.slice(0, corte)}.${digitos.slice(corte)}`;
}

/**
 * Primer tenant declarado por un JWT.
 *
 * Se lee el payload sin verificar la firma **a propósito**: acá no se está
 * autorizando nada, sólo averiguando a nombre de qué organización va a escribir
 * la corrida. La API verifica la firma en cada llamada.
 *
 * @param jwt - El token de acceso.
 * @returns El identificador del tenant, o `null`.
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

/** Marca la corrida como fallida. */
function fallar() {
  process.exitCode = 1;
}

await main();
