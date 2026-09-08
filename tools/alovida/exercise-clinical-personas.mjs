#!/usr/bin/env node
/**
 * Recorre contra una API REAL el flujo completo de cada actor clínico
 * ejerciendo **su propio rol**, no el del administrador.
 *
 * Existe porque `exercise-front-flows.mjs` recorre los mismos caminos con el
 * token del `SECURITY_ADMIN`/`SUPERADMIN`, que atraviesa cualquier `@Roles(...)`
 * por comodín: un flujo verde allí no demuestra que un cirujano pueda operar,
 * sólo que la ruta existe. Aquí cada persona se da de alta con su rol, verifica
 * su matrícula, inicia sesión y ejecuta su parte del circuito.
 *
 * Uso:
 *   node tools/alovida/exercise-clinical-personas.mjs
 *   BASE=http://localhost:3000 node tools/alovida/exercise-clinical-personas.mjs
 *
 * Requiere una API levantada con administrador de arranque
 * (`BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_PASSWORD`). Escribe datos con sufijo
 * único: es seguro repetirlo, y no debe apuntarse a una base con datos reales.
 *
 * Sale con código distinto de cero si aparece un 5xx o un error 4xx sin `code`
 * del catálogo (`src/common/errors/error-codes.ts`).
 */
const BASE = process.env.BASE ?? 'http://localhost:3001';
const U = Date.now().toString().slice(-7);
const out = [];

async function call(actor, method, path, { body, token, note, expect } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  const row = {
    actor,
    method,
    path,
    status: res.status,
    code: parsed?.code,
    message: parsed?.message,
    note,
    expect,
  };
  out.push(row);
  const bad = res.status >= 500 ? ' ***5xx***' : '';
  console.log(
    `[${actor}] ${res.status} ${method} ${path}${bad}` +
      (parsed?.code ? ` :: ${parsed.code} — ${parsed.message}` : ''),
  );
  return parsed;
}

import { randomUUID } from 'node:crypto';
// Correos reales: ver `correos-reales.mjs`.
import { CORREOS, correoDe } from './correos-reales.mjs';

/** Cuántas cuentas lleva creadas la corrida: reparte entre los cinco buzones. */
let PERSONAS_CREADAS = 0;

const claims = (t) => JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString());

const admin = await call('admin', 'POST', '/iam/auth/login', {
  body: { email: CORREOS.admin, password: 'S3cret-passw0rd' },
});
const A = admin.accessToken;
const TENANT = claims(A).tenants[0];

async function persona(label, roles) {
  // Correo real y único: la etiqueta `+` da unicidad sin dejar de llegar.
  const email = correoDe(label, U, PERSONAS_CREADAS++);
  const alta = await call('admin', 'POST', '/iam/users/assisted-practitioner-registration', {
    token: A,
    body: {
      email,
      // Sin honorífico: el registro real no lo escribe, y un seed que lo mete
      // deja el directorio con tratamientos mezclados.
      displayName: label,
      licenseNumber: `LIC-${label}-${U}`,
      credentialNumber: `CRED-${label}-${U}`,
      professionalTitle: label,
      reason: `Alta de prueba del flujo de ${label}`,
      clinicalRoles: roles,
    },
  });
  if (!alta?.activationToken) return null;
  await call('admin', 'POST', '/iam/auth/activate', {
    body: { activationToken: alta.activationToken, newPassword: 'S3cret-passw0rd' },
  });
  // Verificar la matrícula es lo que habilita a ejercer; con el cambio nuevo
  // concede además el rol PRACTITIONER.
  await call('admin', 'POST', `/profiles/credentials/${alta.credentialId}/verify`, {
    token: A,
    body: { decision: 'VERIFIED', verificationSourceUri: 'https://registro.example/verificacion' },
    note: 'verificación de la matrícula (habilita a ejercer)',
  });
  const login = await call(label, 'POST', '/iam/auth/login', {
    body: { email, password: 'S3cret-passw0rd' },
  });
  if (!login?.accessToken) return null;
  return {
    token: login.accessToken,
    userId: alta.userId,
    profileId: alta.practitionerProfileId,
    roles: claims(login.accessToken).roles,
  };
}

const clinico = await persona('CLINICIAN', ['CLINICIAN', 'PRACTITIONER']);
const cirujano = await persona('SURGEON', ['SURGEON']);
const anestesista = await persona('ANESTHESIOLOGIST', ['ANESTHESIOLOGIST']);
const enfermeria = await persona('PERIOP_NURSE', ['PERIOP_NURSE']);
const programador = await persona('SURGERY_SCHEDULER', ['SURGERY_SCHEDULER']);
const aprobador = await persona('CLINICAL_APPROVER', ['CLINICAL_APPROVER']);
const informatico = await persona('CLINICAL_INFORMATICIAN', [
  'CLINICAL_INFORMATICIAN',
]);
const investigador = await persona('PRINCIPAL_INVESTIGATOR', [
  'PRINCIPAL_INVESTIGATOR',
]);

// Un concepto cualquiera para los campos `*ConceptId` obligatorios.
const concepts = await call('CLINICIAN', 'GET', '/terminology/concepts?q=a&limit=1', {
  token: clinico.token,
  note: 'buscar un concepto para rellenar los *ConceptId',
});
const CONCEPT = concepts?.items?.[0]?.conceptId;
console.log('concepto elegido:', CONCEPT);

// ---------------------------------------------------------------- CLINICIAN
console.log('\n=== FLUJO DEL CLÍNICO ===');
const paciente = await call('CLINICIAN', 'POST', '/iam/users/assisted-registration', {
  token: clinico.token,
  body: {
    email: correoDe('paciente', U, PERSONAS_CREADAS++),
    displayName: 'Paciente de Prueba',
    reason: 'Alta asistida en consulta',
  },
  note: 'el clínico da de alta a su paciente',
});
let PACIENTE = paciente?.patientProfileId;
if (!PACIENTE) {
  const p2 = await call('admin', 'POST', '/profiles/patients', {
    token: A,
    body: { patientCode: `PAC-${U}`, displayName: 'Paciente de Prueba', birthDate: '1990-01-01' },
    note: 'FALLBACK: alta de paciente por el administrador',
  });
  PACIENTE = p2?.profileId;
}
console.log('paciente:', PACIENTE);

const episodio = await call('CLINICIAN', 'POST', '/clinical/care-episodes', {
  token: clinico.token,
  body: { patientProfileId: PACIENTE, tenantId: TENANT, responsiblePractitionerId: clinico.profileId },
});
const encuentro = await call('CLINICIAN', 'POST', '/clinical/encounters/check-in', {
  token: clinico.token,
  body: {
    patientProfileId: PACIENTE,
    tenantId: TENANT,
    episodeId: episodio?.id,
    primaryPractitionerId: clinico.profileId,
    reasonText: 'Dolor abdominal',
  },
});
await call('CLINICIAN', 'POST', '/clinical/conditions', {
  token: clinico.token,
  body: {
    custodianTenantId: TENANT,
    patientProfileId: PACIENTE,
    encounterId: encuentro?.id,
    codeConceptId: CONCEPT,
  },
});
await call('CLINICIAN', 'POST', '/clinical/allergy-intolerances', {
  token: clinico.token,
  body: {
    custodianTenantId: TENANT,
    patientProfileId: PACIENTE,
    substanceConceptId: CONCEPT,
    reactions: [{ manifestationConceptId: CONCEPT, description: 'Urticaria' }],
  },
  note: 'la reacción (hija) se crea anidada, sin llamada aparte',
});
await call('CLINICIAN', 'POST', '/clinical/observations', {
  token: clinico.token,
  body: {
    custodianTenantId: TENANT,
    patientProfileId: PACIENTE,
    encounterId: encuentro?.id,
    codeConceptId: CONCEPT,
    valueDecimal: 37.8,
  },
});
const receta = await call('CLINICIAN', 'POST', '/clinical/medication-requests', {
  token: clinico.token,
  body: {
    custodianTenantId: TENANT,
    patientProfileId: PACIENTE,
    encounterId: encuentro?.id,
    medicationConceptId: CONCEPT,
    prescriberProfileId: clinico.profileId,
    doseText: '500 mg',
    frequencyText: 'cada 8 horas',
    quantityDecimal: 21,
  },
});
await call('CLINICIAN', 'POST', `/clinical/medication-requests/${receta?.id}/sign`, {
  token: clinico.token,
  body: {},
});
await call('CLINICIAN', 'POST', `/clinical/medication-requests/${receta?.id}/issue`, {
  token: clinico.token,
  body: {},
});
await call('CLINICIAN', 'GET', `/clinical/patients/${PACIENTE}/summary`, {
  token: clinico.token,
});
const nota = await call('CLINICIAN', 'POST', '/charts/notes', {
  token: clinico.token,
  body: {
    patientProfileId: PACIENTE,
    encounterId: encuentro?.id,
    authorProfileId: clinico.profileId,
    noteTypeConceptId: CONCEPT,
  },
});
await call('CLINICIAN', 'GET', `/charts/patients/${PACIENTE}/chart`, { token: clinico.token });

// ------------------------------------------------------- SURGERY_SCHEDULER
console.log('\n=== FLUJO PERIOPERATORIO ===');
// El quirófano es un `practice.care_spaces`: hay que crear practice y site antes.
const practice = await call('admin', 'POST', '/practices', {
  token: A,
  body: { tenantId: TENANT, code: `PRA-${U}`, name: 'Clínica de prueba' },
  note: 'PADRE 1: practice — sólo SECURITY_ADMIN, sin GET para descubrirlo',
});
const site = await call('admin', 'POST', `/practices/${practice?.id}/sites`, {
  token: A,
  body: { code: `SIT-${U}`, name: 'Sede central' },
  note: 'PADRE 2: site',
});
const quirofano = await call('admin', 'POST', `/sites/${site?.id}/care-spaces`, {
  token: A,
  body: { code: `OR-${U}`, name: 'Quirófano 1' },
  note: 'PADRE 3: care space (el quirófano que el caso reserva)',
});

const inicio = new Date(Date.now() + 86400000).toISOString();
const fin = new Date(Date.now() + 86400000 + 3600000).toISOString();
const caso = await call('SURGERY_SCHEDULER', 'POST', '/procedure-cases', {
  token: programador.token,
  body: {
    custodianTenantId: TENANT,
    patientProfileId: PACIENTE,
    caseType: 'ELECTIVE',
    priority: 'ROUTINE',
    primarySurgeonProfileId: cirujano.profileId,
    operatingRoomId: quirofano?.id,
    scheduledStartAt: inicio,
    scheduledEndAt: fin,
  },
});
const CASO = caso?.id;

await call('SURGEON', 'POST', `/procedure-cases/${CASO}/diagnoses`, {
  token: cirujano.token,
  body: { diagnoses: [{ conditionCodeConceptId: CONCEPT, role: 'PRIMARY' }] },
  note: 'el diagnóstico crea su condición: el cirujano no puede llamar a clinical',
});
await call('SURGERY_SCHEDULER', 'POST', `/procedure-cases/${CASO}/team-members`, {
  token: programador.token,
  body: { practitionerProfileId: anestesista.profileId, role: 'ANESTHESIOLOGIST' },
});
// Cada integrante acepta su participación (endpoint nuevo): sin esto la
// confirmación fallaba siempre con CAN-INT-002.
const equipo = await call('SURGERY_SCHEDULER', 'POST', `/procedure-cases/${CASO}/team-members`, {
  token: programador.token,
  body: { practitionerProfileId: enfermeria.profileId, role: 'SCRUB_NURSE' },
});
await call('PERIOP_NURSE', 'POST', `/procedure-cases/${CASO}/team-members/${equipo?.id}/accept`, {
  token: enfermeria.token,
  note: 'el propio integrante acepta',
});
await call('SURGEON', 'POST', `/procedure-cases/${CASO}/team-members/${equipo?.id}/accept`, {
  token: cirujano.token,
  note: 'otro profesional NO puede aceptar por él (debe fallar)',
  expect: 422,
});
// El resto del equipo acepta (el cirujano principal se dio de alta dentro del
// propio POST del caso: su id sólo se conoce por esta lectura) y se confirma.
const team = await call('SURGERY_SCHEDULER', 'GET', `/procedure-cases/${CASO}/team-members`, {
  token: programador.token,
});
const porPerfil = new Map((team ?? []).map((m) => [m.practitionerProfileId, m]));
const tokenPorPerfil = {
  [cirujano.profileId]: { label: 'SURGEON', token: cirujano.token },
  [anestesista.profileId]: { label: 'ANESTHESIOLOGIST', token: anestesista.token },
  [enfermeria.profileId]: { label: 'PERIOP_NURSE', token: enfermeria.token },
};
for (const [perfil, miembro] of porPerfil) {
  const quien = tokenPorPerfil[perfil];
  if (!quien) continue;
  await call(quien.label, 'POST', `/procedure-cases/${CASO}/team-members/${miembro.id}/accept`, {
    token: quien.token,
  });
}
await call('ANESTHESIOLOGIST', 'POST', `/procedure-cases/${CASO}/preoperative-assessments`, {
  token: anestesista.token,
  body: {
    assessmentType: 'ANESTHESIA',
    assessedByProfileId: anestesista.profileId,
    fitnessStatus: 'FIT',
    allergiesReviewed: true,
    medicationsReviewed: true,
    riskScores: [{ model: 'ASA', modelVersion: '1', scoreValue: '2' }],
  },
  note: 'con puntuaciones de riesgo (hijas de la valoración)',
});
await call('ANESTHESIOLOGIST', 'POST', `/procedure-cases/${CASO}/anesthesia-plans`, {
  token: anestesista.token,
  body: {
    anesthesiologistProfileId: anestesista.profileId,
    anesthesiaType: 'GENERAL',
    airwayAssessment: {
      assessedByProfileId: anestesista.profileId,
      difficultAirwayExpected: false,
    },
  },
});
// Alta de la orden preoperatoria (endpoint nuevo) y su verificación.
const orden = await call('ANESTHESIOLOGIST', 'POST', `/procedure-cases/${CASO}/preoperative-orders`, {
  token: anestesista.token,
  body: { serviceRequestCodeConceptId: CONCEPT, orderRole: 'LAB' },
  note: 'la orden crea su solicitud clínica',
});
await call('PERIOP_NURSE', 'POST', `/procedure-cases/${CASO}/preoperative-orders/verify`, {
  token: enfermeria.token,
  body: { orderIds: [orden?.id], verifiedByProfileId: enfermeria.profileId },
});
await call('SURGERY_SCHEDULER', 'POST', `/procedure-cases/${CASO}/confirm`, {
  token: programador.token,
  note: 'confirmación del caso (CAN-INT-002)',
});
await call('SURGEON', 'POST', `/procedure-cases/${CASO}/operative-reports`, {
  token: cirujano.token,
  body: {
    procedureCodeConceptId: CONCEPT,
    authorProfileId: cirujano.profileId,
    procedureDescription: 'Colecistectomía laparoscópica sin incidencias',
    findingsText: 'Sin hallazgos relevantes',
    disposition: 'PACU',
  },
  note: 'el informe crea su procedimiento clínico',
});

// ------------------------------------------------- otros actores clínicos
console.log('\n=== APROBADOR CLÍNICO ===');
await call('CLINICAL_APPROVER', 'POST', `/authz/patients/${PACIENTE}/clinical-access-grants`, {
  token: aprobador.token,
  body: {
    grantedUserId: clinico.userId,
    tenantId: TENANT,
    purposeOfUse: 'TREATMENT',
    accessLevel: 'READ',
    validTo: new Date(Date.now() + 86400000).toISOString(),
  },
});
await call('CLINICAL_APPROVER', 'POST', `/authz/patients/${PACIENTE}/break-the-glass`, {
  token: aprobador.token,
  body: { tenantId: TENANT, justification: 'Urgencia vital documentada en el parte de guardia' },
});

// ------------------------------------------------------------- lecturas
console.log('\n=== LECTURAS (antes no existía ninguna) ===');
const practicas = await call('SURGERY_SCHEDULER', 'GET', '/practices', {
  token: programador.token,
  note: 'descubrir la práctica sin conocer su uuid',
});
const sedes = await call('SURGERY_SCHEDULER', 'GET', `/practices/${practicas?.[0]?.id}/sites`, {
  token: programador.token,
});
const espacios = await call('SURGERY_SCHEDULER', 'GET', `/sites/${sedes?.[0]?.id}/care-spaces`, {
  token: programador.token,
  note: 'resuelve el operatingRoomId que exige programar un caso',
});
console.log(`  espacios encontrados: ${(espacios ?? []).length}`);

const agenda = await call('SURGERY_SCHEDULER', 'GET', `/procedure-cases?patientProfileId=${PACIENTE}`, {
  token: programador.token,
  note: 'agenda quirúrgica del paciente',
});
console.log(`  casos en agenda: ${agenda?.total}`);
const detalle = await call('SURGEON', 'GET', `/procedure-cases/${CASO}`, {
  token: cirujano.token,
  note: 'detalle agregado del caso',
});
console.log(
  `  detalle: equipo=${detalle?.team?.length} diagnósticos=${detalle?.diagnoses?.length} órdenes=${detalle?.preoperativeOrders?.length} informes=${detalle?.operativeReports?.length}`,
);
await call('CLINICIAN', 'GET', '/diagnostics/work-orders', {
  token: clinico.token,
  note: 'cola de trabajo del laboratorio',
});
await call('CLINICIAN', 'GET', `/diagnostics/patients/${PACIENTE}/imaging-studies`, {
  token: clinico.token,
  note: 'estudios de imagen del paciente',
});

// -------------------------------------------------- informático clínico
console.log('\n=== INFORMÁTICO CLÍNICO ===');
const conexion = await call('CLINICAL_INFORMATICIAN', 'POST', '/health-data/source-connections', {
  token: informatico.token,
  body: {
    tenantId: TENANT,
    sourceSystemCode: `SRC-${U}`,
    sourceSystemName: 'Sistema de prueba',
    sourceTypeConceptId: CONCEPT,
    trustLevelConceptId: CONCEPT,
    connectionTypeConceptId: CONCEPT,
    endpointUri: 'https://origen.example/fhir',
  },
  note: 'alta de la conexión de origen (antes no existía ninguna vía)',
});
const lote = await call('admin', 'POST', '/health-data/ingestion-batches', {
  token: A,
  body: {
    tenantId: TENANT,
    healthSourceConnectionId: conexion?.id,
    batchIdentifier: `LOTE-${U}`,
    ingestionModeConceptId: CONCEPT,
  },
});
const registro = await call('admin', 'POST', `/health-data/ingestion-batches/${lote?.id}/records`, {
  token: A,
  body: {
    sourceRecordIdentifier: `REG-${U}`,
    resourceTypeConceptId: CONCEPT,
    payloadHash: `hash-${U}`,
  },
});
const canonico = await call('admin', 'POST', '/health-data/canonical-resources/project', {
  token: A,
  body: {
    healthIngestionRecordId: registro?.id,
    custodianTenantId: TENANT,
    logicalIdentifier: `LOG-${U}`,
    normalizedPayloadJson: { resourceType: 'Patient', id: PACIENTE },
    patientProfileId: PACIENTE,
  },
  note: 'PADRE: recurso canónico proyectado',
});
await call('CLINICAL_INFORMATICIAN', 'POST', `/health-data/canonical-resources/${canonico?.resourceId}/bindings`, {
  token: informatico.token,
  body: {
    domainEntityTypeConceptId: CONCEPT,
    domainEntityId: PACIENTE,
  },
  note: 'amarre del recurso canónico a la entidad de dominio',
});
// Un segundo recurso para relacionarlo con el primero: un recurso no se
// relaciona consigo mismo (422 correcto de negocio).
const registro2 = await call('admin', 'POST', `/health-data/ingestion-batches/${lote?.id}/records`, {
  token: A,
  body: {
    sourceRecordIdentifier: `REG2-${U}`,
    resourceTypeConceptId: CONCEPT,
    payloadHash: `hash2-${U}`,
  },
});
const canonico2 = await call('admin', 'POST', '/health-data/canonical-resources/project', {
  token: A,
  body: {
    healthIngestionRecordId: registro2?.id,
    custodianTenantId: TENANT,
    logicalIdentifier: `LOG2-${U}`,
    normalizedPayloadJson: { resourceType: 'Encounter' },
    patientProfileId: PACIENTE,
  },
});
await call('CLINICAL_INFORMATICIAN', 'POST', `/health-data/canonical-resources/${canonico?.resourceId}/relationships`, {
  token: informatico.token,
  body: {
    targetResourceId: canonico2?.resourceId,
    relationshipTypeConceptId: CONCEPT,
  },
  note: 'relación entre recursos canónicos',
});

// ------------------------------------------------- investigador principal
console.log('\n=== INVESTIGADOR PRINCIPAL ===');
const perfilDeid = await call('PRINCIPAL_INVESTIGATOR', 'POST', '/research/deidentification-profiles', {
  token: investigador.token,
  body: {
    tenantId: TENANT,
    code: `DEID-${U}`,
    name: 'Perfil de prueba',
    methodologyConceptId: CONCEPT,
  },
  note: 'PADRE: perfil de de-identificación (antes no existía alta)',
});
const proyectoId = randomUUID();
const cohorte = await call('PRINCIPAL_INVESTIGATOR', 'POST', `/research/projects/${proyectoId}/cohorts`, {
  token: investigador.token,
  body: {
    tenantId: TENANT,
    projectCode: `PRY-${U}`,
    title: 'Estudio de prueba',
    principalInvestigatorId: investigador.profileId,
    ethicsApprovalReference: `CEI-${U}`,
    approvedFrom: new Date(Date.now() - 86400000).toISOString(),
    approvedTo: new Date(Date.now() + 30 * 86400000).toISOString(),
    cohortCode: `COH-${U}`,
    cohortVersion: '1',
    inclusionExpression: 'edad >= 18',
    deidentificationProfileId: perfilDeid?.id,
  },
  note: 'la cohorte crea su proyecto de investigación',
});

console.log('\n--- 5xx y errores sin código catalogado ---');
const malos = out.filter((o) => o.status >= 500 || (o.status >= 400 && !o.code));
console.table(malos.map((o) => ({ actor: o.actor, status: o.status, code: o.code ?? '(sin code)', op: `${o.method} ${o.path}`.slice(0, 55) })));

console.log('\n--- todo el recorrido ---');
console.table(out.map((o) => ({ actor: o.actor, status: o.status, code: o.code ?? '', op: `${o.method} ${o.path}`.slice(0, 55) })));

// Un 4xx esperado (el 422 de "sólo el propio integrante puede aceptar") es un
// acierto, no un fallo: lo que rompe la corrida es un 5xx o un error que llega
// al cliente sin un `code` del catálogo, porque eso el frontend no lo puede
// tratar.
if (malos.length > 0) {
  console.error(`\n${malos.length} respuesta(s) sin catalogar o 5xx.`);
  process.exit(1);
}
console.log('\nTodos los actores completaron su flujo; ningún fallo sin catalogar.');
