import { CONCEPTS } from '../../../src/common';
import type { SmokeCase, SmokeCtx } from '../smoke-kit';

/**
 * Recorrido completo del administrador de plataforma.
 *
 * Es el actor inverso a los otros tres: no se auto-registra —el primer `SECURITY_ADMIN` no se
 * puede crear por API, lo siembra `yarn postman:bootstrap`— y su trabajo consiste justamente en
 * habilitar y deshabilitar a los demás. Por eso su recorrido no prueba «puedo entrar y ver lo
 * mío» sino «puedo dar de alta, verificar, y dar de baja **sin borrar**».
 *
 * Las tres bajas lógicas que ejerce, de menor a mayor alcance, y por qué ninguna es un DELETE:
 *
 * - `lock` sobre un usuario: le corta el acceso. La cuenta sigue existiendo porque de ella
 *   cuelgan sus actos; borrarla dejaría huérfano todo lo que firmó.
 * - `revoke` sobre una credencial: invalida esa contraseña o ese factor concreto, no la cuenta.
 * - `suspend` sobre una organización entera: la saca de operación. Es un acto de plataforma, y
 *   el smoke de organización comprueba la contracara — que el owner no llega a este endpoint.
 *
 * `anonymize` es el caso aparte y el más delicado: no es una baja sino el derecho al olvido.
 * Vacía los datos personales pero conserva la fila, porque los actos clínicos que esa persona
 * firmó no se pueden borrar sin romper la trazabilidad de las historias de otros.
 *
 * Los ids se encadenan por `ctx.vars` con el prefijo `adm`.
 */

/** Token del usuario recién creado, para comprobar que el `lock` le corta el acceso. */
/** Concepto sembrado que sirve de país/jurisdicción: lo que importa es que exista. */
const CID = CONCEPTS.STATE_ACTIVE;

const asManaged = (c: SmokeCtx): string | undefined => c.vars.admManagedToken;

/** Correo del usuario que el administrador gestiona a lo largo del recorrido. */
const managedEmail = (c: SmokeCtx): string => `gestionado-${c.u}@example.test`;

export const ADMINISTRADOR_SMOKE: SmokeCase[] = [
  // --- 1. Da de alta a una persona ----------------------------------------
  {
    module: 'Administrador',
    endpoint: 'POST /iam/users',
    name: 'happy: crea una cuenta con rol inicial USER',
    method: 'post',
    path: () => '/iam/users',
    body: (c) => ({
      displayName: 'Usuario Gestionado',
      email: managedEmail(c),
      password: 'S3cret-passw0rd',
      initialRole: 'USER',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.admManagedUserId = String(b.id ?? '');
    },
  },
  {
    module: 'Administrador',
    endpoint: 'POST /iam/users',
    name: 'límite: el mismo correo no se puede dar de alta dos veces',
    method: 'post',
    path: (c) => '/iam/users',
    body: (c) => ({
      displayName: 'Duplicado',
      email: managedEmail(c),
      password: 'S3cret-passw0rd',
      initialRole: 'USER',
    }),
    expectedStatus: 409,
  },
  {
    module: 'Administrador',
    endpoint: 'POST /iam/users',
    name: 'límite: un rol inicial que no existe no se acepta',
    method: 'post',
    // Sólo `USER` y `SECURITY_ADMIN` son roles de alta. Los 120 roles de negocio se componen
    // en authz y se asignan por tenant; aceptarlos aquí saltearía esa frontera.
    path: () => '/iam/users',
    body: (c) => ({
      displayName: 'Rol inventado',
      email: `rolmalo-${c.u}@example.test`,
      password: 'S3cret-passw0rd',
      initialRole: 'CLINICIAN',
    }),
    expectedStatus: 400,
  },
  {
    module: 'Administrador',
    endpoint: 'POST /iam/auth/login',
    name: 'happy: la cuenta creada puede iniciar sesión',
    method: 'post',
    auth: false,
    path: () => '/iam/auth/login',
    body: (c) => ({ email: managedEmail(c), password: 'S3cret-passw0rd' }),
    expectedStatus: 200,
    capture: (b, c) => {
      c.vars.admManagedToken = String(b.accessToken ?? '');
    },
  },

  // --- 2. Le concede y le quita poder -------------------------------------
  {
    module: 'Administrador',
    endpoint: 'POST /iam/users/{id}/global-roles',
    name: 'happy: lo eleva a SECURITY_ADMIN',
    method: 'post',
    path: (c) => `/iam/users/${c.vars.admManagedUserId}/global-roles`,
    body: () => ({ role: 'SECURITY_ADMIN', action: 'GRANT' }),
    expectedStatus: 200,
  },
  {
    module: 'Administrador',
    endpoint: 'POST /iam/users/{id}/global-roles',
    name: 'happy: y se lo revoca',
    method: 'post',
    path: (c) => `/iam/users/${c.vars.admManagedUserId}/global-roles`,
    body: () => ({ role: 'SECURITY_ADMIN', action: 'REVOKE' }),
    expectedStatus: 200,
  },

  // --- 3. Da de alta una organización por la vía administrativa -----------
  {
    module: 'Administrador',
    endpoint: 'POST /admin/tenants',
    name: 'happy: aprovisiona una organización con su owner',
    method: 'post',
    path: () => '/admin/tenants',
    body: (c) => ({
      code: `ADM-TEN-${c.u}`,
      legalName: `Organización Aprovisionada ${c.u}`,
      tenantType: 'MEDICAL_OFFICE',
      countryConceptId: CID,
      jurisdictionConceptId: CID,
      ownerUserId: c.vars.admManagedUserId,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.admTenantId = String(b.id ?? b.tenantId ?? '');
    },
  },
  {
    module: 'Administrador',
    endpoint: 'POST /admin/tenants/{tenantId}/verification',
    name: 'happy: verifica la organización (acto de plataforma)',
    method: 'post',
    path: (c) => `/admin/tenants/${c.vars.admTenantId}/verification`,
    body: () => ({}),
    expectedStatus: 200,
  },

  // --- 4. Bajas lógicas: cortar el acceso sin borrar el rastro ------------
  {
    module: 'Administrador',
    endpoint: 'POST /admin/tenants/{tenantId}/suspend',
    name: 'happy: suspende la organización (sigue existiendo)',
    method: 'post',
    // Suspender y no borrar: de la organización cuelgan historias clínicas, facturación y
    // consentimientos. Un DELETE dejaría todo eso apuntando al vacío.
    path: (c) => `/admin/tenants/${c.vars.admTenantId}/suspend`,
    body: () => ({ reason: 'Suspensión de prueba del smoke' }),
    expectedStatus: 200,
  },
  {
    module: 'Administrador',
    endpoint: 'POST /admin/tenants/{tenantId}/suspend',
    name: 'límite: suspender exige un motivo',
    method: 'post',
    // El motivo no es burocracia: una suspensión sin causa registrada no se puede revisar
    // después, y estas decisiones se revisan.
    path: (c) => `/admin/tenants/${c.vars.admTenantId}/suspend`,
    body: () => ({}),
    expectedStatus: 400,
  },
  {
    module: 'Administrador',
    endpoint: 'POST /iam/users/{id}/lock',
    name: 'happy: bloquea la cuenta del usuario',
    method: 'post',
    path: (c) => `/iam/users/${c.vars.admManagedUserId}/lock`,
    body: () => ({ reason: 'Bloqueo de prueba del smoke' }),
    expectedStatus: 200,
  },
  {
    module: 'Administrador',
    endpoint: 'POST /iam/auth/login',
    name: 'límite: la cuenta bloqueada ya no puede entrar',
    method: 'post',
    auth: false,
    // Es la prueba de que el bloqueo sirve para algo. Sin este caso, `lock` podría estar
    // marcando una columna que nadie mira en el login.
    path: () => '/iam/auth/login',
    body: (c) => ({ email: managedEmail(c), password: 'S3cret-passw0rd' }),
    expectedStatus: 401,
  },

  // --- 5. Derecho al olvido: vaciar sin borrar ----------------------------
  {
    module: 'Administrador',
    endpoint: 'POST /iam/users/{id}/anonymize',
    name: 'happy: anonimiza al usuario (la fila sobrevive)',
    method: 'post',
    // No es una baja más: es el derecho al olvido. Se vacían los datos personales pero la
    // fila queda, porque los actos que esa persona firmó forman parte de la historia de
    // otros pacientes y no se pueden borrar sin romper esa trazabilidad.
    path: (c) => `/iam/users/${c.vars.admManagedUserId}/anonymize`,
    expectedStatus: 200,
  },
  {
    module: 'Administrador',
    endpoint: 'POST /iam/users/{id}/lock',
    name: 'límite: un usuario que no existe no se puede bloquear',
    method: 'post',
    path: () => '/iam/users/00000000-0000-4000-8000-000000000000/lock',
    body: () => ({ reason: 'Inexistente' }),
    expectedStatus: 404,
  },

  // --- 6. La frontera del propio administrador ----------------------------
  {
    module: 'Administrador',
    endpoint: 'POST /iam/users',
    name: 'límite: sin token no se da de alta a nadie',
    method: 'post',
    auth: false,
    path: () => '/iam/users',
    body: (c) => ({
      displayName: 'Sin permiso',
      email: `anon-${c.u}@example.test`,
      password: 'S3cret-passw0rd',
      initialRole: 'USER',
    }),
    expectedStatus: 401,
  },
];
