import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { generate } from 'otplib';
import { JwtService } from '@nestjs/jwt';
import { CONCEPTS, TokenService } from '../../../src/common';
import { loadAuthEnv } from '../../../src/common/auth/auth.env';
import type { SmokeCase, SmokeCtx } from '../smoke-kit';

/**
 * Ayudas del smoke del gobierno de accesos (`support_staff_governance.smoke.ts`): el hospital
 * piloto sembrado por SQL (demos 04 y 07 del modelo más un archivo de fixtures propio), los
 * tokens reales de cada persona, el reloj del escenario (martes 2026-11-03 10:30 en La Paz) y el
 * segundo factor (TOTP real de `otplib`) para el paso extra.
 *
 * El smoke reinicia la base al arrancar (`resetBusinessData`), así que el piloto se carga DENTRO
 * de la corrida, con `psql`, y no antes. Las semillas de arranque (73 permisos, reglas SoD,
 * plantillas v2, catálogo de conceptos) ya las dejó el arnés.
 */

/** Organización del Hospital Piloto (`04-hospital-piloto.sql`). */
export const PILOT = '830e47e1-8e82-50ff-99c0-bfed0a7971a4';

/** Contraseña de todas las cuentas demo. */
export const DEMO_PASSWORD = 'Demo-Apoyo-2026';

/** Personas del piloto: clave → documento de acceso (`authentication_credentials.external_subject`). */
export const PEOPLE = {
  admin: 'DEMO-ADMINISTRADOR-HOSPITAL-PILOTO',
  gonzalo: 'DEMO-GONZALO-PINTO',
  ana: 'DEMO-ANA-GUTIERREZ',
  lucia: 'DEMO-LUCIA-PAZ',
  marcos: 'DEMO-MARCOS-RIBERA',
  rosa: 'DEMO-ROSA-QUIROGA',
  sofia: 'DEMO-SOFIA-CAMACHO',
  ricardo: 'DEMO-RICARDO-TERCEROS',
  mario: 'DEMO-MARIO-SALVATIERRA',
  nora: 'DEMO-NORA-VILLARROEL',
  pablo: 'DEMO-PABLO-MAMANI',
  perez: 'DEMO-ANDRES-PEREZ',
  mendez: 'DEMO-CARLA-MENDEZ',
  suarez: 'DEMO-MARTIN-SUAREZ',
  rojas: 'DEMO-VALERIA-ROJAS',
} as const;

/** Clave de una persona del piloto. */
export type Who = keyof typeof PEOPLE;

/** Nombre del módulo en el reporte del smoke. */
export const MODULE = 'GobiernoDeAccesos';

/** Reloj del escenario (CONTRATO-GOBIERNO §11.4): martes 2026-11-03 10:30 America/La_Paz (UTC-4). */
export const SCENARIO_NOW = '2026-11-03T10:30:00-04:00';

const RealDate = Date;
let offsetMs = 0;
let installed = false;

/** Cambia `Date` global por una subclase que suma un desplazamiento (solo el reloj; los temporizadores siguen reales). */
function installClock(): void {
  if (installed) return;
  installed = true;
  class ScenarioDate extends RealDate {
    constructor(...args: unknown[]) {
      if (args.length === 0) super(RealDate.now() + offsetMs);
      else super(...(args as [number]));
    }
    static now(): number {
      return RealDate.now() + offsetMs;
    }
  }
  (globalThis as { Date: DateConstructor }).Date =
    ScenarioDate as unknown as DateConstructor;
}

/** Pone el reloj de la aplicación en `iso` (sigue avanzando desde ahí). */
export function setClock(iso: string): void {
  installClock();
  offsetMs = new RealDate(iso).getTime() - RealDate.now();
}

/** Avanza el reloj `ms` milisegundos. */
export function advanceClock(ms: number): void {
  installClock();
  offsetMs += ms;
}

/** Devuelve el reloj al real. */
export function resetClock(): void {
  offsetMs = 0;
}

/** Falla con un mensaje claro si la afirmación no se cumple. */
export function must(ok: unknown, what: string): void {
  if (!ok) throw new Error(what);
}

/** Token de una persona del piloto, capturado en su login. */
export const tokenOf =
  (who: Who) =>
  (c: SmokeCtx): string | undefined =>
    c.vars[`gov_tok_${who}`];

/** Id de usuario de una persona del piloto (lo da el login). */
export const userIdOf = (c: SmokeCtx, who: Who): string =>
  c.vars[`gov_uid_${who}`] ?? '';

/**
 * Caso HTTP de una persona del piloto, con su token y la organización del piloto
 * (`X-Tenant-Id`). `headers` adicionales se suman.
 */
export const as = (
  who: Who,
  caso: Omit<SmokeCase, 'module' | 'token' | 'tenantScoped'>,
): SmokeCase => ({
  module: MODULE,
  token: tokenOf(who),
  ...caso,
  headers: (c) => ({
    'X-Tenant-Id': PILOT,
    ...(caso.headers ? caso.headers(c) : {}),
  }),
  capture: (b, c) => {
    // `GOV_DUMP=<archivo>`: guarda cada respuesta aceptada (para armar las afirmaciones del caso).
    if (process.env.GOV_DUMP) {
      appendFileSync(
        process.env.GOV_DUMP,
        `### ${caso.name}\n${JSON.stringify(b).slice(0, 6000)}\n`,
      );
    }
    caso.capture?.(b, c);
  },
});

/** Consulta SQL de lectura contra la base de la corrida. */
export async function q<T = Record<string, unknown>>(
  c: SmokeCtx,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  return (await c.orm.em
    .getConnection()
    .execute(sql, params)) as unknown as T[];
}

/** Sentencia SQL de escritura (solo fixtures del escenario). */
export async function exec(
  c: SmokeCtx,
  sql: string,
  params: unknown[] = [],
): Promise<void> {
  await c.orm.em.getConnection().execute(sql, params);
}

/**
 * Caso que no ejerce una ruta del escenario sino un paso previo (SQL, reloj, comprobación en la
 * base): hace un `GET /iam/me/step-up` inocuo y todo el trabajo va en `run`, que corre en el
 * `setup` del caso; si lanza, el caso falla con su mensaje.
 */
export const step = (
  name: string,
  run: (c: SmokeCtx) => Promise<void> | void,
): SmokeCase => ({
  module: MODULE,
  endpoint: 'GET /health',
  name,
  method: 'get',
  auth: false,
  path: () => '/health',
  setup: async (c) => {
    await run(c);
  },
  expectedStatus: 200,
});

/** Ruta del directorio de fixtures SQL propios del smoke. */
const FIXTURES = resolve(process.cwd(), 'test', 'smoke', 'fixtures');

/** Archivos del piloto, en orden, bajo `GOVERNANCE_DEMO_DIR` (los de `salud-db/demo` del modelo). */
const DEMO_FILES = [
  '04-hospital-piloto.sql',
  '07-gobierno-hospital-piloto.sql',
  '09-agenda-chat-piloto.sql',
];

/** ¿Se puede cargar el piloto? (hace falta la carpeta de demos del modelo y `psql`.) */
export function pilotAvailable(): boolean {
  const dir = process.env.GOVERNANCE_DEMO_DIR;
  return !!dir && existsSync(resolve(dir, '04-hospital-piloto.sql'));
}

/** Carga con `psql` un archivo SQL en la base de la corrida (bandera `demo_accounts=1` incluida). */
function psql(file: string): void {
  execFileSync(
    'psql',
    [
      '-X',
      '-q',
      '-v',
      'ON_ERROR_STOP=1',
      '-v',
      'demo_accounts=1',
      '-h',
      process.env.DB_HOST ?? '127.0.0.1',
      '-p',
      process.env.DB_PORT ?? '5432',
      '-U',
      process.env.DB_USER ?? 'mantra',
      '-d',
      process.env.DB_NAME ?? 'mantra_smoke_test',
      '-f',
      file,
    ],
    {
      env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD ?? '' },
      stdio: ['ignore', 'ignore', 'pipe'],
    },
  );
}

/** Siembra el piloto: demos 04, 07 (y 09 si existe) y los fixtures propios del smoke. */
export function loadPilot(): void {
  const dir = process.env.GOVERNANCE_DEMO_DIR as string;
  for (const name of DEMO_FILES) {
    const file = resolve(dir, name);
    if (existsSync(file)) psql(file);
  }
  psql(resolve(FIXTURES, 'support_staff_governance.fixture.sql'));
}

/** Código TOTP vigente (con el reloj del escenario) de un secreto base32. */
export async function totpNow(secret: string): Promise<string> {
  return generate({ secret });
}

/** Caso de login de una persona del piloto: guarda `gov_tok_<clave>` y `gov_uid_<clave>`. */
export const loginCase = (who: Who, again = false): SmokeCase => ({
  module: MODULE,
  endpoint: 'POST /iam/auth/login',
  name: `setup: ${who} ${again ? 'vuelve a iniciar' : 'inicia'} sesión con su documento (token real)`,
  method: 'post',
  auth: false,
  path: () => '/iam/auth/login',
  body: () => ({ nationalId: PEOPLE[who], password: DEMO_PASSWORD }),
  expectedStatus: 200,
  capture: (b, c) => {
    const token = String(b.accessToken ?? '');
    c.vars[`gov_tok_${who}`] = token;
    // El id de la persona es el `sub` del JWT (la respuesta del login no lo trae).
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'),
    ) as { sub?: string };
    must(payload.sub, `el token de ${who} debía traer sub`);
    c.vars[`gov_uid_${who}`] = String(payload.sub);
  },
});

/**
 * Caso que pone un TOTP real a una persona del piloto y sella su sesión con el paso extra:
 * `POST /iam/users/{id}/mfa-factors` (alta y verificación por la administración) y
 * `POST /iam/me/step-up` con el código vigente. El reloj se adelanta 31 s entre ambos porque cada
 * código solo vale una vez por paso de tiempo.
 */
export const stepUpCases = (who: Who): SmokeCase[] => [
  {
    module: MODULE,
    endpoint: 'POST /iam/users/{id}/mfa-factors',
    name: `paso extra: la administración da de alta un TOTP para ${who}`,
    method: 'post',
    token: (c) => c.vars.gov_tok_system,
    path: (c) => `/iam/users/${userIdOf(c, who)}/mfa-factors`,
    body: () => ({ factorType: 'TOTP', label: 'Smoke gobierno' }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars[`gov_totp_${who}`] = String(b.secret ?? '');
      c.vars[`gov_factor_${who}`] = String(b.id ?? '');
      must(
        c.vars[`gov_totp_${who}`],
        'el alta del TOTP debía devolver el secreto',
      );
    },
  },
  {
    module: MODULE,
    endpoint: 'POST /iam/users/{id}/mfa-factors',
    name: `paso extra: se verifica el factor de ${who} con el código vigente`,
    method: 'post',
    token: (c) => c.vars.gov_tok_system,
    path: (c) => `/iam/users/${userIdOf(c, who)}/mfa-factors`,
    setup: async (c) => {
      c.vars.gov_code = await totpNow(c.vars[`gov_totp_${who}`]);
    },
    body: (c) => ({
      verify: true,
      factorId: c.vars[`gov_factor_${who}`],
      code: c.vars.gov_code,
    }),
    expectedStatus: 201,
  },
  {
    module: MODULE,
    endpoint: 'POST /iam/me/step-up',
    name: `paso extra: ${who} sella su sesión con su código (POST /iam/me/step-up → 200)`,
    method: 'post',
    token: tokenOf(who),
    path: () => '/iam/me/step-up',
    setup: async (c) => {
      advanceClock(31_000);
      c.vars.gov_code = await totpNow(c.vars[`gov_totp_${who}`]);
    },
    body: (c) => ({ code: c.vars.gov_code }),
    expectedStatus: 200,
  },
];

/** Administrador de las pruebas de integración (`harness.TEST_ADMIN_ID`). */
const TEST_ADMIN_ID = '00000000-0000-4000-8000-000000000001';

/**
 * Token de plataforma (`SUPERADMIN`, para las rutas `SYSTEM`) firmado con el reloj del escenario:
 * el del arnés es de la hora real y vence al adelantar el reloj. Su sesión se inserta con vigencia
 * larga (la del arnés dura un día de la hora real y tampoco sobrevive al reloj).
 */
export async function mintSystemToken(c: SmokeCtx): Promise<void> {
  const env = loadAuthEnv();
  const tokens = new TokenService(
    new JwtService({
      secret: env.secret,
      signOptions: { expiresIn: env.accessTtl },
    } as never),
  );
  const sid = `gov-system-${Date.now()}`;
  await exec(
    c,
    `insert into iam.sessions (id, user_id, token_id, state_concept_id, expires_at, created_at, updated_at)
     values (gen_random_uuid(), ?, ?, ?, timestamptz '2035-01-01', now(), now())`,
    [TEST_ADMIN_ID, sid, CONCEPTS.STATE_ACTIVE],
  );
  c.vars.gov_tok_system = tokens.signAccessToken(
    TEST_ADMIN_ID,
    sid,
    ['SUPERADMIN', 'SECURITY_ADMIN'],
    [],
  );
}

/** Caso `SYSTEM` (barridos): con el token de plataforma y sin organización activa. */
export const asSystem = (
  caso: Omit<SmokeCase, 'module' | 'token' | 'tenantScoped'>,
): SmokeCase => ({
  module: MODULE,
  token: (c) => c.vars.gov_tok_system,
  ...caso,
  capture: (b, c) => {
    if (process.env.GOV_DUMP) {
      appendFileSync(
        process.env.GOV_DUMP,
        `### ${caso.name}\n${JSON.stringify(b).slice(0, 6000)}\n`,
      );
    }
    caso.capture?.(b, c);
  },
});

/** Cantidad de filas de todas las tablas de `delegated_access` (prueba de «cero filas nuevas»). */
export async function rowsOfGovernance(c: SmokeCtx): Promise<number> {
  const [row] = await q<{ n: string }>(
    c,
    `select sum((xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', schemaname, tablename), false, true, '')))[1]::text::int)::text as n
       from pg_tables where schemaname = 'delegated_access'`,
  );
  return Number(row.n);
}

/** ISO de `days` días a partir de ahora (con el reloj del escenario). */
export const inDays = (days: number): string =>
  new Date(Date.now() + days * 86_400_000).toISOString();

/** Renueva el paso extra de una persona que ya tiene su TOTP (código nuevo: otro paso de tiempo). */
export const restepCase = (who: Who): SmokeCase => ({
  module: MODULE,
  endpoint: 'POST /iam/me/step-up',
  name: `paso extra: ${who} lo renueva con un código nuevo (POST /iam/me/step-up → 200)`,
  method: 'post',
  token: tokenOf(who),
  path: () => '/iam/me/step-up',
  setup: async (c) => {
    advanceClock(31_000);
    c.vars.gov_code = await totpNow(c.vars[`gov_totp_${who}`]);
  },
  body: (c) => ({ code: c.vars.gov_code }),
  expectedStatus: 200,
});
