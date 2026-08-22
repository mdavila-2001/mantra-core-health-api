import type { SmokeCase, SmokeCtx } from '../smoke-kit';

/**
 * Recorrido completo de un profesional de salud, **con su propio token**.
 *
 * Complementa a `paciente.smoke.ts`: los archivos por módulo ejercen los endpoints de a uno y
 * siempre como administrador, lo que no prueba que el titular pueda recorrer su camino. Un
 * endpoint puede responder 201 al admin y 403 al médico, y esa diferencia es justamente la que
 * importa aquí — el médico declara una matrícula que nadie ha contrastado todavía.
 *
 * La idea que ordena todo el recorrido: **registrarse no es estar habilitado.** La licencia nace
 * PENDIENTE, y hasta que la plataforma la verifique el perfil no aparece habilitado ni acepta
 * pacientes. Los casos de abajo fijan ese contrato en los dos sentidos: lo que sí puede hacer
 * recién registrado, y lo que no.
 *
 * Cubre también la baja lógica del módulo: `POST /practitioner-delegates/{id}/revoke` no borra
 * la delegación, la revoca — el rastro de quién pudo actuar en nombre de quién tiene que
 * sobrevivir a la baja, porque es lo que se audita.
 *
 * Los ids se encadenan por `ctx.vars` con el prefijo `med` para no pisar los de otros módulos.
 */

/** Token del médico, capturado en su login. */
const asDoctor = (c: SmokeCtx): string | undefined => c.vars.medToken;

/** Correo con el que el médico se registra e inicia sesión. */
const email = (c: SmokeCtx): string => `medico-${c.u}@example.test`;

export const MEDICO_SMOKE: SmokeCase[] = [
  // --- 1. Alta pública: se registra con su matrícula ------------------------
  {
    module: 'Médico',
    endpoint: 'POST /iam/auth/register-practitioner',
    name: 'happy: se registra solo, declarando su matrícula',
    method: 'post',
    auth: false, // público: un profesional puede darse de alta sin que nadie lo cargue
    path: () => '/iam/auth/register-practitioner',
    body: (c) => ({
      email: email(c),
      password: 'S3cret-passw0rd',
      name: 'Ana',
      middleName: 'Smoke',
      lastName: 'Rojas',
      motherLastName: 'Paz',
      licenseNumber: `MP-${c.u}`,
      credentialNumber: `TIT-${c.u}`,
      phone: '+591 70012345',
      gender: 'FEMALE',
      sexAtBirth: 'FEMALE',
      birthDate: '1985-04-12',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.medUserId = String(b.userId ?? '');
      c.vars.medPersonId = String(b.personId ?? '');
      c.vars.medProfileId = String(b.practitionerProfileId ?? '');
      c.vars.medLicenseId = String(b.licenseId ?? '');
      // La licencia nace PENDIENTE: se guarda para afirmarlo, no para decorar.
      c.vars.medLicenseStatus = String(b.verificationStatus ?? '');
    },
  },
  {
    module: 'Médico',
    endpoint: 'POST /iam/auth/register-practitioner',
    name: 'límite: el mismo correo no se puede registrar dos veces',
    method: 'post',
    auth: false,
    path: () => '/iam/auth/register-practitioner',
    body: (c) => ({
      email: email(c),
      password: 'S3cret-passw0rd',
      displayName: 'Dra. Duplicada',
      licenseNumber: `MP-DUP-${c.u}`,
      credentialNumber: `TIT-DUP-${c.u}`,
    }),
    expectedStatus: 409,
  },

  // --- 2. Sesión propia ----------------------------------------------------
  {
    module: 'Médico',
    endpoint: 'POST /iam/auth/login',
    name: 'happy: inicia sesión con su correo',
    method: 'post',
    auth: false,
    path: () => '/iam/auth/login',
    body: (c) => ({ email: email(c), password: 'S3cret-passw0rd' }),
    expectedStatus: 200,
    capture: (b, c) => {
      c.vars.medToken = String(b.accessToken ?? '');
      c.vars.medRefreshToken = String(b.refreshToken ?? '');
    },
  },

  // --- 3. Prueba su identidad y su matrícula -------------------------------
  {
    module: 'Médico',
    endpoint: 'POST /common/files',
    name: 'setup: sube la foto de su documento',
    method: 'post',
    token: asDoctor,
    path: () => '/common/files',
    body: (c) => ({
      originalName: `dni-medico-${c.u}.jpg`,
      category: 'DOCUMENT',
      sensitivity: 'NORMAL',
      mimeType: 'image/jpeg',
      sizeBytes: 4096,
      contentHash: `med-dni-${c.u}`,
      storageUri: `s3://bucket/dni-medico-${c.u}.jpg`,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.medDniFileId = String(b.id ?? '');
    },
  },
  {
    module: 'Médico',
    endpoint: 'POST /common/files',
    name: 'setup: sube el certificado de su matrícula',
    method: 'post',
    token: asDoctor,
    path: () => '/common/files',
    body: (c) => ({
      originalName: `matricula-${c.u}.pdf`,
      category: 'DOCUMENT',
      sensitivity: 'NORMAL',
      mimeType: 'application/pdf',
      sizeBytes: 8192,
      contentHash: `med-lic-${c.u}`,
      storageUri: `s3://bucket/matricula-${c.u}.pdf`,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.medLicenseFileId = String(b.id ?? '');
    },
  },
  {
    module: 'Médico',
    endpoint: 'POST /identity/me/practitioner/identity-verification',
    name: 'happy: abre su caso de verificación de identidad',
    method: 'post',
    token: asDoctor,
    path: () => '/identity/me/practitioner/identity-verification',
    body: (c) => ({ evidenceFileId: c.vars.medDniFileId }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.medIdCaseId = String(b.id ?? b.caseId ?? '');
    },
  },
  {
    module: 'Médico',
    endpoint:
      'POST /profiles/practitioners/{profileId}/jurisdiction-authorizations',
    name: 'happy: registra la jurisdicción donde puede ejercer',
    method: 'post',
    path: (c) =>
      `/profiles/practitioners/${c.vars.medProfileId}/jurisdiction-authorizations`,
    body: (c) => ({ licenseNumber: `MP-JUR-${c.u}` }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.medJurisdictionId = String(b.id ?? '');
    },
  },
  {
    module: 'Médico',
    endpoint: 'POST /identity/me/practitioner/license-verification',
    name: 'happy: pide que le verifiquen la matrícula',
    method: 'post',
    token: asDoctor,
    // Es el caso que distingue al profesional del paciente: además de probar quién es, tiene
    // que probar que puede ejercer. Son dos casos de verificación distintos, no uno.
    path: () => '/identity/me/practitioner/license-verification',
    body: (c) => ({
      evidenceFileId: c.vars.medLicenseFileId,
      jurisdictionAuthorizationId: c.vars.medJurisdictionId,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.medLicCaseId = String(b.id ?? b.caseId ?? '');
    },
  },
  {
    module: 'Médico',
    endpoint: 'GET /identity/me/verification-cases',
    name: 'happy: ve sus dos casos abiertos (identidad y matrícula)',
    method: 'get',
    token: asDoctor,
    path: () => '/identity/me/verification-cases',
    expectedStatus: 200,
  },
  {
    module: 'Médico',
    endpoint: 'POST /identity/me/practitioner/license-verification',
    name: 'límite: sin evidencia no se abre el caso',
    method: 'post',
    token: asDoctor,
    // Declarar la matrícula no la prueba: sin archivo no hay nada que contrastar.
    path: () => '/identity/me/practitioner/license-verification',
    body: (c) => ({ jurisdictionAuthorizationId: c.vars.medJurisdictionId }),
    expectedStatus: 400,
  },

  // --- 4. Su perfil profesional --------------------------------------------
  {
    module: 'Médico',
    endpoint: 'POST /profiles/practitioners/{profileId}/specialties',
    name: 'happy: declara su especialidad',
    method: 'post',
    path: (c) => `/profiles/practitioners/${c.vars.medProfileId}/specialties`,
    body: () => ({ isPrimary: true, boardCertified: false }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.medSpecialtyId = String(b.id ?? '');
    },
  },

  // --- 5. Su vínculo con un paciente, y su baja lógica ---------------------
  {
    module: 'Médico',
    endpoint: 'POST /profiles/patients',
    name: 'setup: un paciente a quien atender',
    method: 'post',
    // Propio del recorrido y no reutilizado del smoke del paciente: así este archivo se
    // sostiene solo y no depende del orden en que corran los actores.
    path: () => '/profiles/patients',
    body: (c) => ({ patientCode: `PAT-MED-${c.u}` }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.medPatientProfileId = String(b.id ?? b.profileId ?? '');
    },
  },
  {
    module: 'Médico',
    endpoint: 'POST /authz/care-relationships',
    name: 'happy: abre la relación asistencial con su paciente',
    method: 'post',
    path: () => '/authz/care-relationships',
    body: (c) => ({
      tenantId: c.tenantId,
      patientProfileId: c.vars.medPatientProfileId,
      practitionerProfileId: c.vars.medProfileId,
      relationshipType: 'TREATING',
      purposeOfUse: 'TREATMENT',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.medCareRelId = String(b.id ?? '');
    },
  },
  {
    module: 'Médico',
    endpoint: 'POST /authz/care-relationships/{id}/revoke',
    name: 'happy: cierra la relación (baja lógica, no borrado)',
    method: 'post',
    // Revocar y no borrar es deliberado: el vínculo es lo que justificó cada acceso al
    // historial, y un DELETE se llevaría puesta la evidencia que después se audita.
    path: (c) => `/authz/care-relationships/${c.vars.medCareRelId}/revoke`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Médico',
    endpoint: 'GET /authz/care-relationships',
    name: 'happy: la relación revocada sigue existiendo, no desaparece',
    method: 'get',
    // La contracara de la baja lógica: si al revocar el registro se borrara, esta lectura
    // no lo encontraría y no habría qué auditar.
    path: (c) =>
      `/authz/care-relationships?tenantId=${c.tenantId}&patientProfileId=${c.vars.medPatientProfileId}`,
    expectedStatus: 200,
  },

  // --- 5.bis · Su día de trabajo, con SU token -----------------------------
  //
  // Faltaba, y el hueco costó caro: el humo del médico cubría su alta, su
  // verificación y sus relaciones de cuidado, pero **nunca le pedía abrir su
  // agenda ni un expediente** — que es literalmente lo que hace todos los días.
  //
  // Por eso pasó desapercibido que `PRACTITIONER` y `CLINICIAN` no existían
  // como concepto de rol: los 57 endpoints que los exigen sólo respondían al
  // administrador, que es con quien se probaba todo. Un médico real recibía 403
  // en su agenda y en el expediente de sus pacientes.
  //
  // Estos casos son la red que faltaba: si el rol vuelve a desaparecer del
  // token, fallan acá y no en la demo.
  {
    module: 'Médico',
    endpoint: 'GET /scheduling/resources',
    name: 'happy: ve los recursos agendables de su organización',
    method: 'get',
    token: asDoctor,
    path: (c) => `/scheduling/resources?tenantId=${c.tenantId}`,
    expectedStatus: 200,
  },
  {
    module: 'Médico',
    endpoint: 'GET /scheduling/slots',
    name: 'happy: consulta los cupos de una ventana',
    method: 'get',
    token: asDoctor,
    // La ventana es obligatoria: sin ella el backend barre la tabla entera.
    path: () =>
      `/scheduling/slots?from=${new Date().toISOString()}&to=${new Date(Date.now() + 7 * 86_400_000).toISOString()}&limit=1`,
    expectedStatus: 200,
  },
  {
    module: 'Médico',
    endpoint: 'GET /scheduling/bookings',
    name: 'contrato: pedir citas sin acotar responde 422, no una tabla entera',
    method: 'get',
    token: asDoctor,
    // Es el 422 que la agenda del portal evita eligiendo siempre un recurso.
    path: () => '/scheduling/bookings',
    expectedStatus: 422,
  },
  {
    module: 'Médico',
    endpoint: 'GET /clinical/patients/{id}/summary',
    name: 'happy: abre el resumen clínico de su paciente',
    method: 'get',
    token: asDoctor,
    path: (c) => `/clinical/patients/${c.vars.medPatientProfileId}/summary`,
    expectedStatus: 200,
  },
  {
    module: 'Médico',
    endpoint: 'GET /charts/patients/{id}/chart',
    name: 'happy: abre el expediente narrativo de su paciente',
    method: 'get',
    token: asDoctor,
    path: (c) => `/charts/patients/${c.vars.medPatientProfileId}/chart`,
    expectedStatus: 200,
  },
  {
    module: 'Médico',
    endpoint: 'POST /clinical/encounters/check-in',
    name: 'happy: deja constancia de que atendió — abre el encuentro',
    method: 'post',
    token: asDoctor,
    path: () => '/clinical/encounters/check-in',
    body: (c) => ({
      patientProfileId: c.vars.medPatientProfileId,
      tenantId: c.tenantId,
      reasonText: 'Control de humo',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.medEncounterId = String((b as { id?: string }).id ?? '');
    },
  },
  {
    module: 'Médico',
    endpoint: 'POST /clinical/encounters/{id}/close',
    name: 'happy: cierra el encuentro que abrió',
    method: 'post',
    token: asDoctor,
    path: (c) => `/clinical/encounters/${c.vars.medEncounterId}/close`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Médico',
    endpoint: 'POST /clinical/encounters/{id}/close',
    name: 'contrato: cerrar dos veces no es idempotente — responde 422',
    method: 'post',
    token: asDoctor,
    path: (c) => `/clinical/encounters/${c.vars.medEncounterId}/close`,
    body: () => ({}),
    expectedStatus: 422,
  },

  // --- 5.ter · Lo que un médico NO puede hacer -----------------------------
  //
  // La otra mitad del contrato, y la que un humo «todo verde» suele olvidar:
  // tener rol clínico no es tener rol administrativo. Si alguno de estos
  // empezara a responder 200, el médico habría ganado el padrón de la
  // institución sin que nadie lo decidiera.
  {
    module: 'Médico',
    endpoint: 'GET /profiles/patients',
    name: 'restricción: el padrón de pacientes es de administración — 403',
    method: 'get',
    token: asDoctor,
    path: () => '/profiles/patients?limit=1',
    expectedStatus: 403,
  },
  {
    module: 'Médico',
    endpoint: 'GET /iam/users',
    name: 'restricción: el listado de cuentas es de administración — 403',
    method: 'get',
    token: asDoctor,
    path: () => '/iam/users?limit=1',
    expectedStatus: 403,
  },
  {
    module: 'Médico',
    endpoint: 'GET /admin/tenants',
    name: 'restricción: las organizaciones son de administración — 403',
    method: 'get',
    token: asDoctor,
    path: () => '/admin/tenants?limit=1',
    expectedStatus: 403,
  },

  // --- 6. Cierre de sesión -------------------------------------------------
  {
    module: 'Médico',
    endpoint: 'POST /iam/auth/logout',
    name: 'happy: cierra su sesión',
    method: 'post',
    token: asDoctor,
    path: () => '/iam/auth/logout',
    body: (c) => ({ refreshToken: c.vars.medRefreshToken }),
    expectedStatus: 200,
  },
];
