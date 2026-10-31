import type { SmokeCase, SmokeCtx } from '../smoke-kit';
import { advanceClock, totpNow } from './support_staff_governance.kit';

/**
 * Ayudas compartidas por los casos de smoke del personal de apoyo: la persona
 * (token propio, correo único por corrida), la administración (tenant semilla)
 * y las fechas/rangos de la agenda.
 */

export const PASSWORD = 'Str0ng-Passw0rd!';

/** Token de la persona de apoyo, capturado en su login. */
export const asSupport = (c: SmokeCtx): string | undefined => c.vars.supToken;

/** Correo de la persona de apoyo. */
export const email = (c: SmokeCtx): string => `apoyo-${c.u}@example.test`;

/** Marca los casos de admin con el tenant semilla (el admin es SUPERADMIN). */
export const admin = (
  caso: Omit<SmokeCase, 'module' | 'tenantScoped'>,
): SmokeCase => ({ module: 'PersonalDeApoyo', tenantScoped: true, ...caso });

/** Un instante futuro y único por corrida (cita puntual): `slot` separa las citas entre sí. */
export const futureAt = (c: SmokeCtx, slot: number): string =>
  new Date(Date.UTC(2031, 0, 2 + (c.u % 300), 8 + slot, 0, 0)).toISOString();

/** Teléfono único por corrida: el alta no debe tropezar con parecidos de corridas anteriores. */
export const smokePhone = (c: SmokeCtx): string =>
  `+5917${String(c.u % 10_000_000).padStart(7, '0')}`;

/** Rango de la agenda combinada: cubre las citas de `futureAt` de esta corrida. */
export const agendaRange = (c: SmokeCtx): string => {
  const from = new Date(Date.UTC(2031, 0, 1 + (c.u % 300), 0, 0, 0));
  const to = new Date(from.getTime() + 3 * 24 * 3600 * 1000);
  return `from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
};

/**
 * Caso de la persona de apoyo sobre una ruta CON organización activa (agenda,
 * citas): lleva su token y `X-Tenant-Id` con el tenant semilla, como la
 * pantalla cuando la persona elige la organización con la que trabaja.
 */
export const scoped = (
  caso: Omit<SmokeCase, 'module' | 'token' | 'tenantScoped'>,
): SmokeCase => ({
  module: 'PersonalDeApoyo',
  token: asSupport,
  tenantScoped: true,
  ...caso,
});

/** Caso de la propia persona de apoyo, con su token. */
export const person = (
  caso: Omit<SmokeCase, 'module' | 'token'>,
): SmokeCase => ({
  module: 'PersonalDeApoyo',
  token: asSupport,
  ...caso,
});

/** Falla con un mensaje claro si la respuesta no cumple lo que el caso afirma. */
export const must = (ok: boolean, what: string): void => {
  if (!ok) throw new Error(what);
};

/**
 * Paso extra de la administración del smoke (la cuenta de pruebas del arnés).
 *
 * Desde la ronda 1 de revisión de seguridad aprobar o ajustar una solicitud (y otorgar o ampliar
 * permisos) exige el segundo paso (`STEP_UP_REQUIRED`, 10 minutos de vigencia). La cuenta del
 * arnés no tiene factor: se le da de alta un TOTP (`POST /iam/users/{id}/mfa-factors`), se
 * verifica y se sella su sesión con `POST /iam/me/step-up`. Cada código vale una vez por paso de
 * tiempo: el reloj se adelanta 31 s entre el uso de un código y el siguiente.
 */
export const ADMIN_STEP_UP_ENROLL: SmokeCase[] = [
  {
    module: 'PersonalDeApoyo',
    endpoint: 'POST /iam/users/{id}/mfa-factors',
    name: 'paso extra: la administración de la prueba da de alta un TOTP',
    method: 'post',
    path: (c) => `/iam/users/${c.adminUserId}/mfa-factors`,
    // La cuenta del arnés no tiene contraseña y dar de alta un factor PROPIO exige reautenticarse:
    // se le copia la credencial de la persona de apoyo creada por HTTP (misma contraseña, otro sujeto).
    setup: async (c) => {
      await c.orm.em.getConnection().execute(
        `insert into iam.authentication_credentials
           (id, user_id, method_concept_id, external_subject, secret_hash, hash_algorithm_concept_id, state_concept_id, created_at, updated_at, row_version)
         select gen_random_uuid(), ?, method_concept_id, ?, secret_hash, hash_algorithm_concept_id, state_concept_id, now(), now(), 1
           from iam.authentication_credentials where user_id = ? and secret_hash is not null limit 1`,
        [c.adminUserId, `smoke-admin-${c.u}`, c.vars.supUserId],
      );
    },
    body: () => ({
      factorType: 'TOTP',
      label: 'Smoke apoyo',
      currentPassword: PASSWORD,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.supAdminTotp = String(b.secret ?? '');
      c.vars.supAdminFactor = String(b.id ?? '');
      must(!!c.vars.supAdminTotp, 'el alta del TOTP debía devolver el secreto');
    },
  },
  {
    module: 'PersonalDeApoyo',
    endpoint: 'POST /iam/users/{id}/mfa-factors',
    name: 'paso extra: se verifica el factor con el código vigente',
    method: 'post',
    path: (c) => `/iam/users/${c.adminUserId}/mfa-factors`,
    setup: async (c) => {
      c.vars.supAdminCode = await totpNow(c.vars.supAdminTotp);
    },
    body: (c) => ({
      verify: true,
      factorId: c.vars.supAdminFactor,
      code: c.vars.supAdminCode,
    }),
    expectedStatus: 201,
  },
];

/** Sella (o vuelve a sellar) la sesión de la administración con un código nuevo. */
export const ADMIN_STEP_UP: SmokeCase = {
  module: 'PersonalDeApoyo',
  endpoint: 'POST /iam/me/step-up',
  name: 'paso extra: la administración de la prueba sella su sesión (POST /iam/me/step-up → 200)',
  method: 'post',
  path: () => '/iam/me/step-up',
  setup: async (c) => {
    advanceClock(31_000);
    c.vars.supAdminCode = await totpNow(c.vars.supAdminTotp);
  },
  body: (c) => ({ code: c.vars.supAdminCode }),
  expectedStatus: 200,
};
