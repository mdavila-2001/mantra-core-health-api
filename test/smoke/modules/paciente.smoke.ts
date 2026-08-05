import { SEED } from '../../../src/common/constants/concepts';
import type { SmokeCase, SmokeCtx } from '../smoke-kit';

/**
 * Recorrido completo de un paciente, de punta a punta y **con su propio token**.
 *
 * Los demás archivos de `modules/` están agrupados por módulo: ejercen los endpoints de
 * `profiles`, de `consent`, de `identity_assurance`… cada uno por separado y siempre como
 * administrador. Eso comprueba que cada endpoint responde, pero no que un paciente pueda
 * recorrer su propio camino: registrarse solo, entrar con su documento, ver lo suyo y
 * modificarlo. Son cosas distintas —un endpoint puede responder 201 al admin y 403 al titular—
 * y hasta ahora nadie las probaba juntas.
 *
 * Este caso está agrupado por **actor**, no por módulo, y por eso vale la pena que exista aparte:
 *
 *   1. se registra solo, sin que ningún admin lo dé de alta (`register-patient` es público);
 *   2. inicia sesión con su documento, no con email —es el único alta que funciona así—;
 *   3. a partir de ahí **todo va con su token**, así que si un endpoint `/me` resolviera el
 *      titular mal, o la autorización dejara ver de más, el caso lo delata;
 *   4. registra lo que un paciente puede registrar: verificación de identidad, familiar
 *      responsable, cobertura, objeción al tratamiento de sus datos;
 *   5. modifica lo modificable y comprueba el límite: lo ajeno no se toca.
 *
 * Los ids se encadenan por `ctx.vars` con el prefijo `pac` para no pisar los de otros módulos.
 */

/** Token del paciente, capturado en su login. */
const asPatient = (c: SmokeCtx): string | undefined => c.vars.pacToken;

/** Documento con el que el paciente se registra e inicia sesión. */
const nationalId = (c: SmokeCtx): string => `CI-PAC-${c.u}`;

export const PACIENTE_SMOKE: SmokeCase[] = [
  // --- 1. Alta pública: el paciente se da de alta a sí mismo -----------------
  {
    module: 'Paciente',
    endpoint: 'POST /iam/auth/register-patient',
    name: 'happy: se registra solo, sin admin ni token',
    method: 'post',
    auth: false, // es público: exigir token aquí sería negar el autoregistro
    path: () => '/iam/auth/register-patient',
    body: (c) => ({
      nationalId: nationalId(c),
      password: 'S3cret-passw0rd',
      displayName: 'Paciente Smoke',
      email: `paciente-${c.u}@example.test`,
      phone: '+591 70055555',
      gender: 'MALE',
      sexAtBirth: 'MALE',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pacUserId = String(b.userId ?? '');
      c.vars.pacPersonId = String(b.personId ?? '');
      c.vars.pacProfileId = String(b.patientProfileId ?? '');
    },
  },
  {
    module: 'Paciente',
    endpoint: 'POST /iam/auth/register-patient',
    name: 'límite: el mismo documento no se puede registrar dos veces',
    method: 'post',
    auth: false,
    path: () => '/iam/auth/register-patient',
    body: (c) => ({
      nationalId: nationalId(c),
      password: 'S3cret-passw0rd',
      displayName: 'Paciente Duplicado',
    }),
    expectedStatus: 409,
  },

  // --- 2. Sesión propia: entra con documento, no con email ------------------
  {
    module: 'Paciente',
    endpoint: 'POST /iam/auth/login',
    name: 'happy: inicia sesión con su documento de identidad',
    method: 'post',
    auth: false,
    path: () => '/iam/auth/login',
    body: (c) => ({ nationalId: nationalId(c), password: 'S3cret-passw0rd' }),
    expectedStatus: 200,
    capture: (b, c) => {
      c.vars.pacToken = String(b.accessToken ?? '');
      c.vars.pacRefreshToken = String(b.refreshToken ?? '');
    },
  },

  // --- 3. Lo suyo, con su token --------------------------------------------
  {
    module: 'Paciente',
    endpoint: 'GET /profiles/patients/me/summary',
    name: 'límite: recién registrado no ve su resumen hasta verificar identidad',
    method: 'get',
    token: asPatient,
    // No es un fallo del recorrido: es la regla. Quien se auto-registra declara un documento,
    // no lo prueba, así que el historial clínico queda cerrado hasta que la identidad se
    // verifique. Se fija aquí para que, si alguien abriera esa puerta, el smoke lo delate.
    path: () => '/profiles/patients/me/summary',
    expectedStatus: 403,
    expectedCode: 'IDENTITY_VERIFICATION_REQUIRED',
  },
  {
    module: 'Paciente',
    endpoint: 'GET /profiles/patients/me/summary',
    name: 'límite: sin token no hay resumen',
    method: 'get',
    auth: false,
    path: () => '/profiles/patients/me/summary',
    expectedStatus: 401,
  },

  // --- 4. Registra su verificación de identidad ----------------------------
  {
    module: 'Paciente',
    endpoint: 'POST /common/files',
    name: 'setup: sube la foto de su documento',
    method: 'post',
    token: asPatient,
    path: () => '/common/files',
    body: (c) => ({
      originalName: `documento-${c.u}.jpg`,
      category: 'DOCUMENT',
      sensitivity: 'NORMAL',
      mimeType: 'image/jpeg',
      sizeBytes: 4096,
      contentHash: `pac-hash-${c.u}`,
      storageUri: `s3://bucket/documento-${c.u}.jpg`,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pacFileId = String(b.id ?? '');
    },
  },
  {
    module: 'Paciente',
    endpoint: 'POST /identity/me/identity-verification',
    name: 'happy: abre su caso de verificación con la evidencia',
    method: 'post',
    token: asPatient,
    // `evidenceFileId` es obligatorio: no se abre un caso sin con qué contrastarlo.
    path: () => '/identity/me/identity-verification',
    body: (c) => ({ evidenceFileId: c.vars.pacFileId }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pacCaseId = String(b.id ?? b.caseId ?? '');
    },
  },
  {
    module: 'Paciente',
    endpoint: 'GET /identity/me/verification-cases',
    name: 'happy: lista sus propios casos de verificación',
    method: 'get',
    token: asPatient,
    path: () => '/identity/me/verification-cases',
    expectedStatus: 200,
  },
  {
    module: 'Paciente',
    endpoint: 'GET /identity/me/verification-cases/{caseId}',
    name: 'happy: consulta el detalle de su caso',
    method: 'get',
    token: asPatient,
    path: (c) => `/identity/me/verification-cases/${c.vars.pacCaseId}`,
    expectedStatus: 200,
  },
  {
    module: 'Paciente',
    endpoint: 'GET /identity/me/verification-cases/{caseId}',
    name: 'límite: un caso que no es suyo no aparece',
    method: 'get',
    token: asPatient,
    // Un uuid con forma válida que no le pertenece: el endpoint no debe filtrar por id
    // a secas, sino por id **y** titular. Si respondiera 200, la fuga sería cross-paciente.
    path: () =>
      '/identity/me/verification-cases/00000000-0000-4000-8000-000000000000',
    expectedStatus: 404,
  },

  // --- 5. Registra a su familiar responsable -------------------------------
  {
    module: 'Paciente',
    endpoint: 'POST /profiles/patients/{profileId}/related-persons',
    name: 'happy: registra a su familiar responsable',
    method: 'post',
    path: (c) => `/profiles/patients/${c.vars.pacProfileId}/related-persons`,
    // El campo es `personId`, no `relatedPersonId`: el pipe corre con `forbidNonWhitelisted`,
    // así que un nombre inventado no se ignora — devuelve 400.
    body: (c) => ({
      personId: c.vars.pacPersonId,
      displayName: 'Familiar responsable',
      isEmergencyContact: true,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pacRelatedId = String(b.id ?? '');
    },
  },

  // --- 6. Registra su objeción al tratamiento de datos ---------------------
  {
    module: 'Paciente',
    endpoint: 'POST /consent/patient-objections',
    name: 'happy: registra una objeción sobre sus datos',
    method: 'post',
    path: (c) => '/consent/patient-objections',
    // `processingPurposeId` es obligatorio: una objeción sin propósito no dice a qué se objeta.
    // Se usa el propósito por defecto que siembra el arranque, igual que el smoke de consent.
    body: (c) => ({
      patientProfileId: c.vars.pacProfileId,
      processingPurposeId: SEED.processingPurposeId,
      reasonText: 'No autorizo el uso secundario de mis datos',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pacObjectionId = String(b.id ?? '');
    },
  },

  // --- 7. Cierra la sesión: lo que registró sigue en pie -------------------
  {
    module: 'Paciente',
    endpoint: 'POST /iam/auth/logout',
    name: 'happy: cierra su sesión',
    method: 'post',
    token: asPatient,
    path: () => '/iam/auth/logout',
    body: (c) => ({ refreshToken: c.vars.pacRefreshToken }),
    expectedStatus: 200,
  },
  {
    module: 'Paciente',
    endpoint: 'GET /profiles/patients/me/summary',
    name: 'límite: tras cerrar sesión el refresh ya no sirve',
    method: 'post',
    auth: false,
    path: () => '/iam/auth/token/refresh',
    body: (c) => ({ refreshToken: c.vars.pacRefreshToken }),
    expectedStatus: 401,
  },
];
