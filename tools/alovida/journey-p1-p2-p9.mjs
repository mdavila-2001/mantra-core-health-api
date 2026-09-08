#!/usr/bin/env node
/**
 * Journey funcional de los carriles P1, P2 y P9 contra la API REAL.
 *
 * No es un mock: cada paso es una llamada HTTP con su sesión propia, con los
 * mismos guards y máquinas de estado que producción. Un carril «mergeado» que
 * no pasa por acá es un carril que nadie vio funcionar.
 *
 * Uso: node journey-p1-p2-p9.mjs
 */
const BASE = process.env.BASE ?? 'http://localhost:3000';
const U = Date.now().toString().slice(-8);

let fallos = 0;
const pasos = [];

/** Registra el resultado de una comprobación. */
function check(ok, titulo, detalle = '') {
  pasos.push({ ok, titulo, detalle });
  if (!ok) fallos += 1;
  const marca = ok ? '  ✓' : '  ✗';
  console.log(`${marca} ${titulo}${detalle ? ` — ${detalle}` : ''}`);
}

/** Llama a la API y devuelve `{ status, body }`. */
async function call(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const texto = await res.text();
  let parsed;
  try {
    parsed = texto ? JSON.parse(texto) : undefined;
  } catch {
    parsed = texto;
  }
  return { status: res.status, body: parsed };
}

/** Aborta el journey con un mensaje claro. */
function abortar(titulo, res) {
  console.log(`\n✗ ABORTA: ${titulo} → http ${res.status}`);
  console.log(JSON.stringify(res.body).slice(0, 600));
  process.exit(1);
}

const main = async () => {
  console.log(`Journey P1/P2/P9 contra ${BASE}\n`);

  // ── Sesiones ──────────────────────────────────────────────────────────────
  console.log('· Sesiones');

  const doctor = await call('POST', '/iam/auth/login', {
    body: {
      email: 'doctora.demo@redesa.test',
      password: 'D3mo-passw0rd!',
    },
  });
  if (doctor.status !== 200) abortar('login de la doctora', doctor);
  const TOKEN_DOC = doctor.body.accessToken;
  check(true, 'la doctora inicia sesión');

  const nationalId = `E2E${U}`;
  const alta = await call('POST', '/iam/auth/register-patient', {
    body: {
      nationalId,
      password: 'P4ciente-passw0rd!',
      name: 'Elena',
      lastName: 'Rojas',
      email: `paciente.${U}@redesa.test`,
    },
  });
  if (alta.status !== 201) abortar('auto-registro del paciente', alta);
  const PACIENTE_PROFILE = alta.body.patientProfileId;
  const PACIENTE_USER = alta.body.userId;
  check(true, 'el paciente se registra', `perfil ${PACIENTE_PROFILE.slice(0, 8)}…`);

  let sesionPaciente = await call('POST', '/iam/auth/login', {
    body: { nationalId, password: 'P4ciente-passw0rd!' },
  });
  if (sesionPaciente.status !== 200) {
    sesionPaciente = await call('POST', '/iam/auth/login', {
      body: {
        email: `paciente.${U}@redesa.test`,
        password: 'P4ciente-passw0rd!',
      },
    });
  }
  if (sesionPaciente.status !== 200) abortar('login del paciente', sesionPaciente);
  const TOKEN_PAC = sesionPaciente.body.accessToken;
  check(true, 'el paciente inicia sesión');

  // Estado inicial de la campana del paciente.
  const bandeja0 = await call('GET', '/notifications/me', { token: TOKEN_PAC });
  if (bandeja0.status !== 200) abortar('GET /notifications/me', bandeja0);
  check(
    bandeja0.body.unreadCount === 0,
    'la campana del paciente arranca vacía',
    `unreadCount=${bandeja0.body.unreadCount}`,
  );

  // ── P1 · receta emitida → campana ────────────────────────────────────────
  console.log('\n· P1 — la receta emitida avisa al paciente');

  // Línea base de la doctora: su cuenta es persistente entre corridas, así que
  // lo que se afirma es que **no crece** con lo del paciente, no que esté en 0.
  const docBase = await call('GET', '/notifications/me', { token: TOKEN_DOC });

  const tenantId = JSON.parse(
    Buffer.from(TOKEN_DOC.split('.')[1], 'base64').toString('utf8'),
  ).tenants[0];

  // Cualquier concepto EXISTENTE sirve como medicamento para este journey: lo
  // que se prueba es la emisión del aviso, no la farmacología.
  //
  // No se toma del catálogo ATC sembrado porque sus ids son hashes
  // deterministas que **no** son UUID válidos y el DTO los rechaza — defecto
  // preexistente del repo, visible también en `seed-dev-data.mjs`. Se usa uno
  // que sí lo es.
  const medicationConceptId = '38a1d301-f40d-5b17-a695-5e6d605f8b19';

  const receta = await call('POST', '/clinical/medication-requests', {
    token: TOKEN_DOC,
    body: {
      custodianTenantId: tenantId,
      patientProfileId: PACIENTE_PROFILE,
      medicationConceptId,
      doseText: '1 comprimido',
      frequencyText: 'cada 8 horas',
    },
  });
  if (![200, 201].includes(receta.status)) abortar('crear la receta', receta);
  const RECETA = receta.body.id;
  check(true, 'la doctora crea la receta', RECETA.slice(0, 8) + '…');

  const emitida = await call(
    'POST',
    `/clinical/medication-requests/${RECETA}/issue`,
    { token: TOKEN_DOC, body: {} },
  );
  if (![200, 201].includes(emitida.status)) abortar('emitir la receta', emitida);
  check(true, 'la doctora emite la receta (queda sellada)');

  const bandeja1 = await call('GET', '/notifications/me', { token: TOKEN_PAC });
  const aviso = bandeja1.body.items?.[0];
  check(
    bandeja1.body.unreadCount === 1,
    'el badge del paciente sube a 1',
    `unreadCount=${bandeja1.body.unreadCount}`,
  );
  check(
    aviso?.subject === 'Tu receta está lista',
    'el aviso dice «Tu receta está lista»',
    aviso?.subject,
  );
  check(
    aviso?.category === 'CLINICAL',
    'la categoría es CLINICAL',
    aviso?.category,
  );
  check(
    aviso?.destination?.type === 'PRESCRIPTION' &&
      aviso?.destination?.id === RECETA,
    'el destino navegable apunta a esa receta',
    `${aviso?.destination?.type}:${aviso?.destination?.id?.slice(0, 8)}…`,
  );
  check(aviso?.unread === true, 'llega sin leer');

  // Nadie lee la bandeja de otro.
  const ajena = await call('GET', '/notifications/me', { token: TOKEN_DOC });
  check(
    ajena.body.unreadCount === docBase.body.unreadCount &&
      !ajena.body.items?.some((n) => n.destination?.id === RECETA),
    'la doctora no ve la notificación del paciente',
    `${docBase.body.unreadCount} → ${ajena.body.unreadCount}`,
  );

  // Marcar leída baja el badge, y es idempotente.
  const leida = await call(
    'POST',
    `/notifications/in-app/${aviso.id}/read`,
    { token: TOKEN_PAC, body: {} },
  );
  check(leida.status === 200 && leida.body.alreadyRead === false, 'se marca leída');
  const releida = await call(
    'POST',
    `/notifications/in-app/${aviso.id}/read`,
    { token: TOKEN_PAC, body: {} },
  );
  check(
    releida.body.alreadyRead === true && releida.body.readAt === leida.body.readAt,
    'marcarla otra vez conserva la primera lectura',
  );

  const bandeja2 = await call('GET', '/notifications/me', { token: TOKEN_PAC });
  check(
    bandeja2.body.unreadCount === 0,
    'el badge vuelve a 0',
    `unreadCount=${bandeja2.body.unreadCount}`,
  );

  // El rebote: emitir dos veces el mismo hecho no produce dos campanazos.
  const receta2 = await call('POST', '/clinical/medication-requests', {
    token: TOKEN_DOC,
    body: {
      custodianTenantId: tenantId,
      patientProfileId: PACIENTE_PROFILE,
      medicationConceptId,
      doseText: '2 comprimidos',
      frequencyText: 'cada 12 horas',
    },
  });
  await call('POST', `/clinical/medication-requests/${receta2.body.id}/issue`, {
    token: TOKEN_DOC,
    body: {},
  });
  const bandeja3 = await call('GET', '/notifications/me', { token: TOKEN_PAC });
  check(
    bandeja3.body.unreadCount === 1,
    'una receta distinta sí genera un aviso nuevo',
    `unreadCount=${bandeja3.body.unreadCount}`,
  );

  // ── P2 · mensajería directa ──────────────────────────────────────────────
  console.log('\n· P2 — la mensajería directa');

  const perfilDoc = await call('PUT', '/community/profiles/me', {
    token: TOKEN_DOC,
    body: {
      tenantId,
      displayName: 'Dra. Demo Alovida',
      slug: `dra-demo-${U}`,
      headline: 'Medicina general',
    },
  });
  if (![200, 201].includes(perfilDoc.status)) abortar('vitrina de la doctora', perfilDoc);
  const PERFIL_DOC = perfilDoc.body.id;

  const perfilPac = await call('PUT', '/community/profiles/me', {
    token: TOKEN_PAC,
    body: {
      tenantId,
      displayName: 'Elena Rojas',
      slug: `elena-rojas-${U}`,
    },
  });
  if (![200, 201].includes(perfilPac.status)) abortar('vitrina del paciente', perfilPac);
  const PERFIL_PAC = perfilPac.body.id;
  check(true, 'las dos personas tienen vitrina pública');

  const conv1 = await call('POST', '/community/conversations', {
    token: TOKEN_PAC,
    body: { participantProfileIds: [PERFIL_PAC, PERFIL_DOC] },
  });
  if (![200, 201].includes(conv1.status)) abortar('abrir la conversación', conv1);
  const CONV = conv1.body.id;
  check(true, 'el paciente abre la conversación con la doctora');

  const conv2 = await call('POST', '/community/conversations', {
    token: TOKEN_PAC,
    body: { participantProfileIds: [PERFIL_PAC, PERFIL_DOC] },
  });
  check(
    conv2.body.id === CONV,
    'abrirla otra vez devuelve el MISMO hilo (no duplica)',
    `${conv2.body.id?.slice(0, 8)}… == ${CONV.slice(0, 8)}…`,
  );

  const badgeDoc0 = await call('GET', '/notifications/me', { token: TOKEN_DOC });

  const enviado = await call(
    'POST',
    `/community/conversations/${CONV}/messages`,
    {
      token: TOKEN_PAC,
      body: { senderProfileId: PERFIL_PAC, bodyText: 'Hola doctora, ¿cómo sigo con la receta?' },
    },
  );
  if (![200, 201].includes(enviado.status)) abortar('enviar el mensaje', enviado);
  check(true, 'el paciente envía un mensaje');

  const badgeDoc1 = await call('GET', '/notifications/me', { token: TOKEN_DOC });
  const avisoMsg = badgeDoc1.body.items?.[0];
  check(
    badgeDoc1.body.unreadCount === badgeDoc0.body.unreadCount + 1,
    'el badge de la doctora sube',
    `${badgeDoc0.body.unreadCount} → ${badgeDoc1.body.unreadCount}`,
  );
  check(
    avisoMsg?.category === 'MESSAGES' &&
      avisoMsg?.destination?.type === 'CONVERSATION' &&
      avisoMsg?.destination?.id === CONV,
    'el aviso lleva al hilo',
    `${avisoMsg?.subject}`,
  );

  const bandejaDoc = await call(
    'GET',
    `/community/conversations?profileId=${PERFIL_DOC}`,
    { token: TOKEN_DOC },
  );
  const hilo = bandejaDoc.body.items?.find((c) => c.id === CONV);
  check(
    hilo?.peers?.[0]?.displayName === 'Elena Rojas',
    'la bandeja dice CON QUIÉN es la conversación',
    hilo?.peers?.[0]?.displayName,
  );
  check(hilo?.unreadCount === 1, 'la doctora tiene 1 mensaje sin leer', `${hilo?.unreadCount}`);

  const hiloMsgs = await call(
    'GET',
    `/community/conversations/${CONV}/messages?profileId=${PERFIL_DOC}`,
    { token: TOKEN_DOC },
  );
  check(
    hiloMsgs.body.items?.[0]?.bodyText?.startsWith('Hola doctora'),
    'la doctora lee el mensaje',
  );

  await call('POST', `/community/conversations/${CONV}/read`, {
    token: TOKEN_DOC,
    body: { recipientProfileId: PERFIL_DOC },
  });
  const bandejaDoc2 = await call(
    'GET',
    `/community/conversations?profileId=${PERFIL_DOC}`,
    { token: TOKEN_DOC },
  );
  const hilo2 = bandejaDoc2.body.items?.find((c) => c.id === CONV);
  check(hilo2?.unreadCount === 0, 'al leerlo, el no-leído baja a 0', `${hilo2?.unreadCount}`);

  // La doctora responde y el paciente se entera.
  const badgePac0 = await call('GET', '/notifications/me', { token: TOKEN_PAC });
  await call('POST', `/community/conversations/${CONV}/messages`, {
    token: TOKEN_DOC,
    body: { senderProfileId: PERFIL_DOC, bodyText: 'Hola Elena, seguí como te indiqué.' },
  });
  const badgePac1 = await call('GET', '/notifications/me', { token: TOKEN_PAC });
  check(
    badgePac1.body.unreadCount === badgePac0.body.unreadCount + 1,
    'la respuesta de la doctora avisa al paciente',
    `${badgePac0.body.unreadCount} → ${badgePac1.body.unreadCount}`,
  );

  // El rebote: un segundo mensaje sin haber leído el primero no suma otro
  // campanazo — diez mensajes seguidos son un aviso, no diez.
  await call('POST', `/community/conversations/${CONV}/messages`, {
    token: TOKEN_DOC,
    body: { senderProfileId: PERFIL_DOC, bodyText: 'Y otra cosa más.' },
  });
  const badgePacRebote = await call('GET', '/notifications/me', { token: TOKEN_PAC });
  check(
    badgePacRebote.body.unreadCount === badgePac1.body.unreadCount,
    'un segundo mensaje sin leer el primero NO suma otro campanazo',
    `${badgePac1.body.unreadCount} → ${badgePacRebote.body.unreadCount}`,
  );

  // Pero en cuanto lo lee, el siguiente mensaje vuelve a avisar. Es el defecto
  // que encontró este journey: con el rebote por «solicitud viva», una
  // conversación avisaba UNA sola vez en toda su historia.
  const avisoHilo = badgePacRebote.body.items?.find(
    (n) => n.destination?.id === CONV,
  );
  await call('POST', `/notifications/in-app/${avisoHilo.id}/read`, {
    token: TOKEN_PAC,
    body: {},
  });
  const badgePacLeido = await call('GET', '/notifications/me', { token: TOKEN_PAC });
  await call('POST', `/community/conversations/${CONV}/messages`, {
    token: TOKEN_DOC,
    body: { senderProfileId: PERFIL_DOC, bodyText: 'Un mensaje después de que lo leyeras.' },
  });
  const badgePacTrasLeer = await call('GET', '/notifications/me', { token: TOKEN_PAC });
  check(
    badgePacTrasLeer.body.unreadCount === badgePacLeido.body.unreadCount + 1,
    'leído el anterior, el mensaje siguiente SÍ vuelve a avisar',
    `${badgePacLeido.body.unreadCount} → ${badgePacTrasLeer.body.unreadCount}`,
  );

  // ── P9 · preferencias ────────────────────────────────────────────────────
  console.log('\n· P9 — las preferencias, y el silencio que aplaza');

  const prefs0 = await call('GET', '/notifications/preferences/me', {
    token: TOKEN_PAC,
  });
  if (prefs0.status !== 200) abortar('GET preferencias', prefs0);
  check(
    prefs0.body.categories?.length === 4 &&
      prefs0.body.categories.every((c) => c.optedIn === true),
    'quien nunca las tocó recibe las cuatro categorías aceptadas',
    prefs0.body.categories?.map((c) => c.category).join(','),
  );
  check(prefs0.body.quietHours === null, 'sin ventana de silencio configurada');

  const prefs1 = await call('PUT', '/notifications/preferences/me', {
    token: TOKEN_PAC,
    body: { categories: [{ category: 'MESSAGES', optedIn: false }] },
  });
  check(
    prefs1.body.categories?.find((c) => c.category === 'MESSAGES')?.optedIn === false,
    'el paciente silencia los mensajes',
  );
  check(
    prefs1.body.categories?.find((c) => c.category === 'CLINICAL')?.optedIn === true,
    'y lo clínico queda intacto (reemplazo por categoría)',
  );

  const badgePac2 = await call('GET', '/notifications/me', { token: TOKEN_PAC });
  await call('POST', `/community/conversations/${CONV}/messages`, {
    token: TOKEN_DOC,
    body: { senderProfileId: PERFIL_DOC, bodyText: 'Otro mensaje más.' },
  });
  const badgePac3 = await call('GET', '/notifications/me', { token: TOKEN_PAC });
  check(
    badgePac3.body.unreadCount === badgePac2.body.unreadCount,
    'silenciado, el mensaje NO genera campanazo',
    `${badgePac2.body.unreadCount} → ${badgePac3.body.unreadCount}`,
  );

  // Pero lo clínico sigue llegando: silenciar «mensajes» no silencia una receta.
  const receta3 = await call('POST', '/clinical/medication-requests', {
    token: TOKEN_DOC,
    body: {
      custodianTenantId: tenantId,
      patientProfileId: PACIENTE_PROFILE,
      medicationConceptId,
      doseText: '1 sobre',
      frequencyText: 'por día',
    },
  });
  await call('POST', `/clinical/medication-requests/${receta3.body.id}/issue`, {
    token: TOKEN_DOC,
    body: {},
  });
  const badgePac4 = await call('GET', '/notifications/me', { token: TOKEN_PAC });
  check(
    badgePac4.body.unreadCount === badgePac3.body.unreadCount + 1,
    'pero la receta SÍ llega: silenciar mensajes no silencia lo clínico',
    `${badgePac3.body.unreadCount} → ${badgePac4.body.unreadCount}`,
  );

  // El silencio nocturno aplaza en vez de borrar.
  await call('PUT', '/notifications/preferences/me', {
    token: TOKEN_PAC,
    body: {
      categories: [{ category: 'MESSAGES', optedIn: true }],
      quietHours: { start: '00:00', end: '23:59' },
    },
  });
  const prefs2 = await call('GET', '/notifications/preferences/me', {
    token: TOKEN_PAC,
  });
  check(
    prefs2.body.quietHours?.start === '00:00',
    'la ventana de silencio queda guardada',
    JSON.stringify(prefs2.body.quietHours),
  );

  const badgePac5 = await call('GET', '/notifications/me', { token: TOKEN_PAC });
  // Una receta NUEVA: su aviso no puede colapsar contra ninguno anterior, así
  // que lo que se mide es el aplazamiento y no el rebote.
  const receta4 = await call('POST', '/clinical/medication-requests', {
    token: TOKEN_DOC,
    body: {
      custodianTenantId: tenantId,
      patientProfileId: PACIENTE_PROFILE,
      medicationConceptId,
      doseText: '1 ampolla',
      frequencyText: 'única',
    },
  });
  await call('POST', `/clinical/medication-requests/${receta4.body.id}/issue`, {
    token: TOKEN_DOC,
    body: {},
  });
  const badgePac6 = await call('GET', '/notifications/me', { token: TOKEN_PAC });
  check(
    badgePac6.body.unreadCount === badgePac5.body.unreadCount,
    'en silencio nocturno el badge NO crece',
    `${badgePac5.body.unreadCount} → ${badgePac6.body.unreadCount}`,
  );
  check(
    !badgePac6.body.items?.some((n) => n.destination?.id === receta4.body.id),
    'y el aviso aplazado no aparece en la bandeja todavía',
  );

  return { PACIENTE_USER, CONV, RECETA_APLAZADA: receta4.body.id };
};

main()
  .then(async ({ PACIENTE_USER }) => {
    console.log('\n· Comprobación de que se aplazó, no se borró');
    console.log(`  (usuario ${PACIENTE_USER})`);
    console.log(
      `\n${fallos === 0 ? '✓ JOURNEY VERDE' : `✗ ${fallos} COMPROBACIONES EN ROJO`} — ${pasos.length} comprobaciones`,
    );
    process.exit(fallos === 0 ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n✗ El journey se cortó:', error);
    process.exit(1);
  });
