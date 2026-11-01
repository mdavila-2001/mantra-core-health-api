import { Test } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/postgresql';
import type { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createHash } from 'node:crypto';
import pg from 'pg';
import { AppModule } from '../../src/app.module';
import {
  CONCEPTS,
  SEED,
  TokenService,
  createGlobalValidationPipe,
  createdBy,
} from '../../src/common';
import { Logger } from 'nestjs-pino';
import { Users, UserGlobalRoles } from '../../src/modules/iam/entities';
import {
  HttpDispatcherService,
  type OutboundDispatchResult,
} from '../../src/common';
import {
  Persons,
  HealthPractitionerProfiles,
  SecretaryProfiles,
  PatientProfiles,
} from '../../src/modules/profiles/entities';
import { SpecialtyChartTemplates } from '../../src/modules/chart/entities';
import { SeedBootstrapService } from '../../src/common/seed/seed-bootstrap.service';
import { boDepartmentConceptId } from '../../src/common/seed/bo-geography.catalog';
import {
  assertDisposableResetTarget,
  assertPermanentResidueTarget,
  assertServerIdentity,
  resolveResetTarget,
} from './disposable-database';
import { qualifiedViolationTable } from './cleanup-errors';

/**
 * Identidad ficticia obligatoria para altas profesionales en integración.
 * Derivarla del correo mantiene cada fixture determinista y único sin usar un
 * documento real; Santa Cruz es un concepto de departamento sembrado.
 * @param email - Correo único del profesional sintético.
 * @returns CI ficticio y departamento emisor.
 */
export function identidadProfesional(email: string): {
  nationalId: string;
  issuerAdministrativeAreaConceptId: string;
} {
  const suffix = createHash('sha256').update(email).digest('hex').slice(0, 32);
  return {
    nationalId: `MED${suffix}`,
    issuerAdministrativeAreaConceptId: boDepartmentConceptId('SC'),
  };
}

/**
 * Vacía todos los datos de negocio antes de un arranque, dejando la base limpia
 * para que la corrida sea reproducible: sin esto, los recursos con constraints
 * de unicidad (p. ej. una farmacia por tenant, una política por recurso) chocan
 * en la segunda ejecución del smoke. El seed de conceptos/tenant/propósito y el
 * admin se rematerializan en el arranque, así que truncar es seguro.
 *
 * Trunca toda tabla de los esquemas de negocio (no del sistema) con CASCADE para
 * respetar las FK. Antes de conectar exige la bandera de destrucción, un host
 * local (o declarado) y un nombre de base descartable, y tras conectar confirma
 * la base con `current_database()` (ver `disposable-database.ts`): si algo no
 * cuadra, lanza sin enviar un solo `TRUNCATE`.
 *
 * @throws UnsafeResetTargetError si el destino no se prueba descartable.
 */
export async function resetBusinessData(): Promise<void> {
  const target = resolveResetTarget(process.env);
  assertDisposableResetTarget(target, process.env);
  const client = new pg.Client({
    host: target.host,
    port: target.port,
    user: process.env.DB_USER ?? 'mantra',
    password: process.env.DB_PASSWORD,
    database: target.database,
  });
  await client.connect();
  try {
    const identity = await client.query<{
      /** Base a la que quedó conectada la sesión según el servidor. */
      db: string;
    }>('select current_database() as db');
    assertServerIdentity(identity.rows[0]?.db ?? '', target);
    const { rows } = await client.query<{
      /**
       * Valor de qualified mantenido por la instancia.
       */
      qualified: string;
    }>(
      `select format('%I.%I', table_schema, table_name) as qualified
         from information_schema.tables
        where table_type = 'BASE TABLE'
          and table_schema not in ('pg_catalog', 'information_schema', 'public', 'pg_toast')
          and table_schema !~ '^_'
          and table_schema not in (
            'timescaledb_experimental',
            'timescaledb_information',
            'toolkit_experimental'
          )`,
    );
    if (rows.length > 0) {
      const list = rows.map((r) => r.qualified).join(', ');
      await client.query(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
    }
  } finally {
    await client.end();
  }
}

/**
 * Arranque de una instancia real de NestJS para las pruebas de integración.
 *
 * Levanta el `AppModule` completo -mismos guards, pipes y filtro que producción-
 * contra la base configurada en el entorno. Fija `ORM_SCHEMA_SYNC=off` porque el
 * esquema ya está materializado; el seed de conceptos corre solo vía
 * `OnApplicationBootstrap`. Además siembra un usuario administrador determinista
 * y devuelve su token para poder ejercer los endpoints protegidos.
 */
export interface TestContext {
  /**
   * Valor de app mantenido por la instancia.
   */
  app: INestApplication;
  /**
   * Valor de orm mantenido por la instancia.
   */
  orm: MikroORM;
  /**
   * Identificador asociado a admin user.
   */
  adminUserId: string;
  /**
   * Valor de admin token mantenido por la instancia.
   */
  adminToken: string;
  /** Token privilegiado sin membresías, reservado para pruebas fail-closed. */
  tenantlessAdminToken: string;
  /** Fixtures cross-módulo: ids de subtipos de profiles y una plantilla de chart. */
  practitionerSubtypeId: string;
  secretaryProfileId: string;
  patientSubtypeId: string;
  chartTemplateId: string;
  /**
   * Puerto real donde escucha la app, sólo si `opts.realtime` lo pidió. Los
   * demás suites de integración usan `app.getHttpServer()` con `supertest` sin
   * necesitar un puerto real — éste existe únicamente para que un cliente
   * `socket.io-client` externo al proceso de Nest tenga a dónde conectarse.
   */
  httpPort?: number;
}

/** Id determinista del administrador de pruebas (FK válida para created_by). */
export const TEST_ADMIN_ID = '00000000-0000-4000-8000-000000000001';

/**
 * Ids deterministas de los fixtures cross-módulo. Los subtipos de profiles usan
 * `profile_id` (= id de la persona) como CLAVE PRIMARIA, así que el "id del
 * subtipo" es el id de la persona una vez existe la fila del subtipo.
 */
export const FIX = {
  practPerson: '00000000-0000-4000-8000-0000000f1001',
  secPerson: '00000000-0000-4000-8000-0000000f1003',
  patPerson: '00000000-0000-4000-8000-0000000f1005',
  chartTemplate: '00000000-0000-4000-8000-0000000f1007',
};

/**
 * Ejecuta la operación bootstrap test app.
 *
 * @param opts - Valor de opts requerido por la operación.
 * @returns Resultado de bootstrap test app conforme al contrato `Promise<TestContext>`.
 */
export async function bootstrapTestApp(
  opts: {
    /**
     * Valor de reset mantenido por la instancia.
     */
    reset?: boolean;
    /** Sustituto determinista del transporte HTTP para pruebas de contrato. */
    httpDispatch?: (input: unknown) => Promise<OutboundDispatchResult>;
    /**
     * Escucha en un puerto real (`app.listen(0)`) con el adaptador de
     * socket.io ya montado. Sólo lo necesita la suite de mensajería en tiempo
     * real: `supertest` no lo requiere, así que el resto sigue sin abrir
     * puerto.
     */
    realtime?: boolean;
  } = {},
): Promise<TestContext> {
  process.env.ORM_SCHEMA_SYNC = process.env.ORM_SCHEMA_SYNC ?? 'off';
  // La siembra deja de colgar del ciclo de vida y pasa a ser un paso explicito
  // de este arnes (ver mas abajo). Asi el resumen de la cadena queda atado al
  // arranque de la prueba que lo pidio, y un seed que falla no se pierde entre
  // los logs de `app.init()`.
  process.env.SEED_ON_BOOT = 'false';
  // Las pruebas disparan muchas peticiones desde el mismo IP; sin esto el
  // ThrottlerGuard global las cortaría con 429.
  process.env.RATE_LIMIT_DISABLED = 'true';

  // Reset opcional (lo usa el smoke) para una corrida reproducible desde cero.
  if (opts.reset) {
    await resetBusinessData();
  }

  const builder = Test.createTestingModule({
    imports: [AppModule],
  });
  if (opts.httpDispatch) {
    builder.overrideProvider(HttpDispatcherService).useValue({
      post: opts.httpDispatch,
    });
  }
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication({ bufferLogs: true });
  // Mismo logger que producción (nestjs-pino). El filtro global de excepciones ya
  // está registrado como APP_FILTER en AppModule, así que no se vuelve a añadir.
  app.useLogger(app.get(Logger));
  app.flushLogs();
  app.useGlobalPipes(createGlobalValidationPipe());
  // Mismo adaptador que `main.ts`. Tiene que ir antes de `init()`: es cuando
  // Nest conecta cada `@WebSocketGateway` al servidor.
  if (opts.realtime) {
    app.useWebSocketAdapter(new IoAdapter(app));
  }
  await app.init();

  let httpPort: number | undefined;
  if (opts.realtime) {
    await app.listen(0);
    const address = app.getHttpServer().address();
    httpPort =
      typeof address === 'object' && address ? address.port : undefined;
  }

  // Sin el parámetro de tipo explícito, `app.get` infiere el genérico con una
  // tupla `readonly` de entidades que no es asignable al `MikroORM` mutable que
  // declaran `TestApp.orm` y `seedAdmin`. Es varianza pura del contenedor, sin
  // efecto en runtime; fijar `TResult` lo resuelve sin recurrir a una aserción.
  const orm = app.get<MikroORM>(MikroORM);

  // Siembra explicita, despues de `app.init()` y del TRUNCATE opcional. El
  // orden importa: `resetBusinessData()` vacia los esquemas de negocio, y
  // `seedAdmin`/`seedFixtures` escriben filas cuyas columnas `*_concept_id`
  // son FK al catalogo que esta cadena materializa.
  const seedSummary = await app.get(SeedBootstrapService).run();
  if (seedSummary.failed > 0) {
    // Antes un seed caido dejaba la base a medias y la prueba fallaba mas
    // adelante con una violacion de FK que no decia nada del origen real.
    throw new Error(
      `La siembra dejo ${seedSummary.failed} seed(s) omitido(s): ` +
        seedSummary.steps
          .filter((paso) => paso.failed)
          .map((paso) => paso.name)
          .join(', '),
    );
  }

  await seedAdmin(orm);
  await seedFixtures(orm);

  // Desde MCH-004 un access token sólo autentica si su `sid` tiene una sesión
  // activa en `iam.sessions`: los tokens que firma el harness necesitan la suya.
  await ensureTestSession(orm, TEST_ADMIN_ID, 'test-session');
  await ensureTestSession(orm, TEST_ADMIN_ID, 'test-session-tenantless');

  const tokenService = app.get(TokenService);
  const adminToken = tokenService.signAccessToken(
    TEST_ADMIN_ID,
    'test-session',
    ['SUPERADMIN', 'SECURITY_ADMIN'],
    [SEED.tenantId],
  );
  const tenantlessAdminToken = tokenService.signAccessToken(
    TEST_ADMIN_ID,
    'test-session-tenantless',
    ['SUPERADMIN', 'SECURITY_ADMIN'],
  );

  return {
    app,
    orm,
    adminUserId: TEST_ADMIN_ID,
    adminToken,
    tenantlessAdminToken,
    practitionerSubtypeId: FIX.practPerson,
    secretaryProfileId: FIX.secPerson,
    patientSubtypeId: FIX.patPerson,
    chartTemplateId: FIX.chartTemplate,
    httpPort,
  };
}

/**
 * Materializa fixtures cross-módulo que varios smokes necesitan como FK reales y
 * que ningún endpoint expone directamente: los subtipos de profiles
 * (`health_practitioner_profiles`, `secretary_profiles`, `patient_profiles`) van
 * sobre `persons`, y una plantilla de chart. Determinista e idempotente. Los
 * `*_concept_id` requeridos usan un concepto ya sembrado (`STATE_ACTIVE`).
 */
async function seedFixtures(orm: MikroORM): Promise<void> {
  const em = orm.em.fork();
  if (
    await em.findOne(HealthPractitionerProfiles, { profileId: FIX.practPerson })
  ) {
    return;
  }
  const audit = createdBy(TEST_ADMIN_ID);
  const active = CONCEPTS.STATE_ACTIVE;

  // Personas base (padres de los subtipos; su id es la PK del subtipo).
  for (const personId of [FIX.practPerson, FIX.secPerson, FIX.patPerson]) {
    em.create(
      Persons,
      { id: personId, personStatusConceptId: active, ...audit },
      { partial: true },
    );
  }
  await em.flush();

  em.create(
    HealthPractitionerProfiles,
    {
      profileId: FIX.practPerson,
      practitionerCode: 'FIX-HP-1',
      practitionerCategoryConceptId: active,
      verificationStatusConceptId: active,
      practiceStatusConceptId: active,
      ...audit,
    },
    { partial: true },
  );
  em.create(
    SecretaryProfiles,
    { profileId: FIX.secPerson, ...audit },
    { partial: true },
  );
  em.create(
    PatientProfiles,
    { profileId: FIX.patPerson, patientCode: 'FIX-PAT-1', ...audit },
    { partial: true },
  );
  em.create(
    SpecialtyChartTemplates,
    {
      id: FIX.chartTemplate,
      specialtyConceptId: active,
      code: 'FIX-TPL-1',
      name: 'Fixture template',
      version: 1,
      statusConceptId: active,
      ...audit,
    },
    { partial: true },
  );
  await em.flush();
}

/**
 * Materializa un administrador de seguridad determinista. Su id es una FK válida
 * para las columnas `created_by_user_id`/`recorded_by_user_id` que pueblan los
 * servicios, evitando violaciones de clave foránea al ejercer los endpoints.
 */
/**
 * Deja activa la sesión `sid` del usuario, para firmar tokens de prueba a mano.
 *
 * El `JwtStrategy` exige que el `sid` del token corresponda a una sesión activa
 * y vigente del mismo usuario (MCH-004). Es idempotente: si la sesión existe se
 * reactiva, se le extiende la vigencia y se la reasigna a `userId`: una corrida
 * que murió a medias deja la fila `session-…` con el usuario de entonces, y sin
 * reasignarla el `JwtStrategy` rechaza con 401 al usuario nuevo de las corridas
 * siguientes.
 *
 * @param orm - ORM del contexto de pruebas.
 * @param userId - Dueño de la sesión; debe existir en `iam.users` y estar activo.
 * @param sid - Valor que irá en el claim `sid` del token.
 */
export async function ensureTestSession(
  orm: MikroORM,
  userId: string,
  sid: string,
): Promise<void> {
  await orm.em
    .fork()
    .getConnection()
    .execute(
      `insert into iam.sessions
       (id, user_id, token_id, state_concept_id, expires_at, created_at, updated_at)
     values (gen_random_uuid(), ?, ?, ?, now() + interval '1 day', now(), now())
     on conflict (token_id) do update
       set user_id = excluded.user_id,
           state_concept_id = excluded.state_concept_id,
           expires_at = excluded.expires_at,
           updated_at = now()`,
      [userId, sid, CONCEPTS.STATE_ACTIVE],
    );
}

async function seedAdmin(orm: MikroORM): Promise<void> {
  const em = orm.em.fork();
  if (await em.findOne(Users, { id: TEST_ADMIN_ID })) {
    return;
  }
  em.create(
    Users,
    {
      id: TEST_ADMIN_ID,
      statusConceptId: CONCEPTS.USER_ACTIVE,
      displayName: 'Integration Test Admin',
      mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
      emailVerified: true,
      phoneVerified: false,
      ...createdBy(),
    },
    { partial: true },
  );
  await em.flush();
  em.create(
    UserGlobalRoles,
    {
      userId: TEST_ADMIN_ID,
      roleConceptId: CONCEPTS.ROLE_SECURITY_ADMIN,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      ...createdBy(TEST_ADMIN_ID),
    },
    { partial: true },
  );
  await em.flush();
}

/** Authorization header helper. */
/**
 * Los campos que `POST /iam/auth/register-patient` exige además de la
 * identidad, con valores válidos y un municipio real del catálogo.
 *
 * Existe porque el DTO se endureció —`birthDate`, `phone`, `sexAtBirth` y
 * `residenceMunicipalityConceptId` pasaron a obligatorios cuando se implementó
 * el orden de campos que pidió el propietario— y **once suites de integración
 * quedaron atrás sin que nadie se enterara**: CI sólo corre
 * `postgres-privileges` de este directorio, así que el 400 no rompía ningún
 * check. Cada suite volvía a escribir su propio alta, así que el próximo campo
 * obligatorio habría vuelto a romperlas una por una.
 *
 * **Ampliado en la subtarea 1.4** con `issuerAdministrativeAreaConceptId`
 * (departamento emisor del documento), obligatorio desde el PR #390 del
 * front: mismo motivo, mismo riesgo de romper suites en silencio.
 *
 * El municipio y el departamento se **buscan**, no se clavan: los ids son
 * deterministas, pero fijarlos haría caducar las suites el día que el
 * namespace cambie. El departamento se busca con el mismo predicado que
 * comprueba `AdministrativeAreaCatalogService.assertIsAdministrativeArea`
 * (versión por defecto de `VS_BO_DEPARTMENT`, miembros incluidos): si algún
 * día ese predicado cambia, esta consulta debe cambiar con él.
 *
 * @param ctx - El contexto de la prueba, del que sale la conexión.
 * @returns Los cinco campos, listos para desparramar en el cuerpo del alta.
 */
export async function camposObligatoriosDePaciente(ctx: TestContext): Promise<{
  birthDate: string;
  phone: string;
  sexAtBirth: string;
  residenceMunicipalityConceptId: string;
  issuerAdministrativeAreaConceptId: string;
}> {
  const municipios = await ctx.orm.em.getConnection().execute<{ id: string }[]>(
    `select id from terminology.catalog_concepts
        where code like 'geo:bo:municipality:%' order by code limit 1`,
  );
  const departamentos = await ctx.orm.em
    .getConnection()
    .execute<{ id: string }[]>(
      `select m.concept_id as id
         from terminology.value_set_members m
         join terminology.value_set_versions v on v.id = m.value_set_version_id
         join terminology.value_sets vs on vs.id = v.value_set_id
        where vs.internal_code = 'VS_BO_DEPARTMENT'
          and v.is_default
          and m.included
        order by m.ordinal
        limit 1`,
    );

  return {
    birthDate: '1990-01-01',
    phone: '+591 70000000',
    sexAtBirth: 'FEMALE',
    residenceMunicipalityConceptId: municipios[0]?.id ?? '',
    issuerAdministrativeAreaConceptId: departamentos[0]?.id ?? '',
  };
}

export function bearer(token: string): {
  /**
   * Valor de authorization mantenido por la instancia.
   */
  Authorization: string;
} {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Conexión a la base de pruebas, con los mismos defaults que `resetBusinessData`.
 *
 * `ssl` sólo se incluye cuando `DB_SSL` está activo, igual que
 * `orm.config.ts`: contra el compose local (sin certificado) pasar el objeto
 * rompería la conexión, y contra Neon (P20, `deleteRegisteredPractitioners`)
 * su ausencia la rompe al revés — `pg` corta con "connection is insecure
 * (try using sslmode=require)".
 */
function testDbClient(): pg.Client {
  const ssl = process.env.DB_SSL === 'true';
  return new pg.Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5434),
    user: process.env.DB_USER ?? 'mantra',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'mantra_redesa_health',
    ...(ssl ? { ssl: { rejectUnauthorized: true } } : {}),
  });
}

/** Una arista del grafo de FK: qué columna de qué tabla apunta a cuál. */
interface ForeignKeyEdge {
  /**
   * Valor de childTable mantenido por la instancia.
   */
  childTable: string;
  /**
   * Valor de childColumn mantenido por la instancia.
   */
  childColumn: string;
  /**
   * Valor de parentTable mantenido por la instancia.
   */
  parentTable: string;
  /**
   * Valor de parentColumn mantenido por la instancia.
   */
  parentColumn: string;
  /**
   * Si la columna hija admite NULL: decide si una referencia se puede cortar en
   * vez de arrastrar la fila.
   */
  childNullable: boolean;
}

/** El grafo de FK y la PK de cada tabla, leídos del catálogo en una sola pasada. */
interface SchemaGraph {
  /**
   * Valor de edges mantenido por la instancia.
   */
  edges: ForeignKeyEdge[];
  /**
   * Valor de primaryKey mantenido por la instancia.
   */
  primaryKey: Map<string, string>;
  /** Tablas cuyo trigger WORM prohíbe borrar. */
  noBorrables: Set<string>;
  /** Tablas cuyo trigger WORM prohíbe actualizar. */
  noActualizables: Set<string>;
}

/**
 * Lee del catálogo el grafo de FK de los esquemas de negocio.
 *
 * Se consulta `pg_constraint` en vez de escribir la lista de tablas a mano: una
 * lista fija envejece en silencio, y el día que una suite escriba en una tabla
 * nueva el borrado la ignoraría y el fixture quedaría en la base compartida.
 *
 * El schema `audit` **entra**: sus tablas `*_history` referencian al expediente con
 * FK obligatoria, así que excluirlas dejaba el borrado del encabezado bloqueado.
 * Lo que no se toca son las tablas cuyo trigger WORM lo prohíbe, y esas se
 * averiguan del propio catálogo (`pg_trigger`) en vez de darlas por sabidas: hoy
 * son cinco y ninguna cuelga de los fixtures. Se excluyen además las tablas sin
 * clave primaria de una sola columna, que no se pueden borrar por id.
 */
async function readSchemaGraph(client: pg.Client): Promise<SchemaGraph> {
  const { rows: edges } = await client.query<ForeignKeyEdge>(
    `select format('%I.%I', cn.nspname, cc.relname) as "childTable",
            ca.attname                              as "childColumn",
            format('%I.%I', pn.nspname, pc.relname) as "parentTable",
            pa.attname                              as "parentColumn",
            not ca.attnotnull                       as "childNullable"
       from pg_constraint k
       join pg_class cc     on cc.oid = k.conrelid
       join pg_namespace cn on cn.oid = cc.relnamespace
       join pg_class pc     on pc.oid = k.confrelid
       join pg_namespace pn on pn.oid = pc.relnamespace
       join lateral unnest(k.conkey)  with ordinality as ck(attnum, ord) on true
       join lateral unnest(k.confkey) with ordinality as pk(attnum, ord) on ck.ord = pk.ord
       join pg_attribute ca on ca.attrelid = cc.oid and ca.attnum = ck.attnum
       join pg_attribute pa on pa.attrelid = pc.oid and pa.attnum = pk.attnum
      where k.contype = 'f'`,
  );

  const { rows: pks } = await client.query<{
    /**
     * Valor de table mantenido por la instancia.
     */
    table: string; /**
     * Valor de column mantenido por la instancia.
     */
    column: string;
  }>(
    `select format('%I.%I', n.nspname, c.relname) as "table",
            min(a.attname)                        as "column"
       from pg_index i
       join pg_class c      on c.oid = i.indrelid
       join pg_namespace n  on n.oid = c.relnamespace
       join pg_attribute a  on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
      where i.indisprimary
      group by 1
     having count(*) = 1`,
  );

  const { rows: worm } = await client.query<{
    /**
     * Valor de table mantenido por la instancia.
     */
    table: string; /**
     * Valor de forbidsDelete mantenido por la instancia.
     */
    forbidsDelete: boolean; /**
     * Valor de forbidsUpdate mantenido por la instancia.
     */
    forbidsUpdate: boolean;
  }>(
    `select format('%I.%I', n.nspname, c.relname) as "table",
            bool_or((t.tgtype & 8) > 0)           as "forbidsDelete",
            bool_or((t.tgtype & 16) > 0)          as "forbidsUpdate"
       from pg_trigger t
       join pg_class c     on c.oid = t.tgrelid
       join pg_namespace n on n.oid = c.relnamespace
      where not t.tgisinternal and t.tgname like '%forbid%'
      group by 1`,
  );

  return {
    edges,
    primaryKey: new Map(pks.map((r) => [r.table, r.column])),
    noBorrables: new Set(
      worm.filter((r) => r.forbidsDelete).map((r) => r.table),
    ),
    noActualizables: new Set(
      worm.filter((r) => r.forbidsUpdate).map((r) => r.table),
    ),
  };
}

/**
 * Filas que la limpieza no pudo borrar porque una tabla WORM las sigue
 * nombrando, directa o transitivamente: tabla calificada → claves primarias.
 */
type Residuo = Map<string, Set<string>>;

/**
 * Borra filas y todo lo que dependa de ellas, hijas antes que madre.
 *
 * El recorrido corta por ciclos con un registro de lo ya visitado:
 * `profiles.persons` se referencia a sí misma (`related_persons`) y sin ese corte
 * la recursión no terminaría. Los ids viajan como texto para no depender del tipo
 * de cada clave.
 *
 * Una fila que una tabla WORM nombra no se borra (el trigger lo prohíbe y la FK
 * lo impide, y ninguna de las dos se debilita desde una prueba), y tampoco las
 * filas de las que ella depende por una columna que no se puede anular: la
 * admisión de un profesional queda nombrada por su bitácora inmutable
 * (`practitioner_admission_events`, v4267), y con ella su perfil y su persona.
 * Esas filas no se tocan: se anotan en `residuo` para que quien llama las
 * declare como residuo permanente con {@link declararResiduoPermanente}, la
 * misma regla que rige para los tenants fijados por `audit.audit_log`. Lo que
 * cuelga de ellas y sí se puede borrar se borra igual.
 *
 * @param residuo - Acumulador compartido por toda la limpieza; se completa acá.
 */
async function deleteWithDependents(
  client: pg.Client,
  graph: SchemaGraph,
  table: string,
  ids: readonly string[],
  visited: Set<string>,
  residuo: Residuo,
): Promise<number> {
  const pk = graph.primaryKey.get(table);
  if (pk === undefined || ids.length === 0 || graph.noBorrables.has(table))
    return 0;

  const pending = ids.filter((id) => !visited.has(`${table}:${id}`));
  if (pending.length === 0) return 0;
  for (const id of pending) visited.add(`${table}:${id}`);

  let borradas = 0;
  // Filas de esta tabla que una hija que no se puede borrar sigue reteniendo.
  const retenidas = new Set<string>();
  // Hijas que se borran DESPUÉS de esta tabla, no antes. Ver `esDependenciaCircular`.
  const diferidas: { tabla: string; ids: string[] }[] = [];
  for (const edge of graph.edges.filter((e) => e.parentTable === table)) {
    // Una referencia que se puede anular no retiene: el corte de ciclos de abajo
    // la pone en NULL antes del `delete`.
    const retiene =
      !edge.childNullable || graph.noActualizables.has(edge.childTable);
    if (graph.noBorrables.has(edge.childTable)) {
      if (!retiene) continue;
      const { rows } = await client.query<{ id: string }>(
        `select t."${pk}"::text as id from ${table} t
          where t."${pk}"::text = any($1::text[])
            and exists (select 1 from ${edge.childTable} c
                         where c."${edge.childColumn}"::text = t."${edge.parentColumn}"::text)`,
        [pending],
      );
      for (const r of rows) retenidas.add(r.id);
      continue;
    }
    if (!graph.primaryKey.has(edge.childTable)) continue;
    const childPk = graph.primaryKey.get(edge.childTable) as string;
    const referidos = await client.query<{
      /**
       * Valor de valor mantenido por la instancia.
       */
      valor: string;
    }>(
      `select distinct "${edge.parentColumn}"::text as valor
         from ${table} where "${pk}"::text = any($1::text[])`,
      [pending],
    );
    const claves = referidos.rows.map((r) => r.valor).filter((v) => v !== null);
    if (claves.length === 0) continue;

    const hijas = await client.query<{
      /**
       * Valor de id mantenido por la instancia.
       */
      id: string;
    }>(
      `select "${childPk}"::text as id
         from ${edge.childTable} where "${edge.childColumn}"::text = any($1::text[])`,
      [claves],
    );
    const idsHijas = hijas.rows.map((r) => r.id);
    if (esDependenciaCircular(graph, edge)) {
      diferidas.push({ tabla: edge.childTable, ids: idsHijas });
      continue;
    }
    borradas += await deleteWithDependents(
      client,
      graph,
      edge.childTable,
      idsHijas,
      visited,
      residuo,
    );

    const hijasRetenidas = idsHijas.filter((id) =>
      residuo.get(edge.childTable)?.has(id),
    );
    if (retiene && hijasRetenidas.length > 0) {
      const { rows } = await client.query<{ id: string }>(
        `select t."${pk}"::text as id from ${table} t
          where t."${pk}"::text = any($1::text[])
            and t."${edge.parentColumn}"::text in (
              select c."${edge.childColumn}"::text from ${edge.childTable} c
               where c."${childPk}"::text = any($2::text[]))`,
        [pending, hijasRetenidas],
      );
      for (const r of rows) retenidas.add(r.id);
    }
  }

  const borrables = pending.filter((id) => !retenidas.has(id));
  if (retenidas.size > 0) {
    const anotadas = residuo.get(table) ?? new Set<string>();
    for (const id of retenidas) anotadas.add(id);
    residuo.set(table, anotadas);
  }
  if (borrables.length === 0) return borradas;

  // Corte de ciclos: dos tablas pueden apuntarse entre sí —una nota tiene versiones
  // y a la vez declara cuál es su versión vigente—, así que el recorrido no alcanza:
  // llegue por donde llegue, una de las dos se borra con la otra todavía viva. Antes
  // de borrar se anulan las referencias que ADMITEN nulo; las obligatorias no hacen
  // falta, porque esas filas ya cayeron en la recursión de arriba.
  for (const edge of graph.edges.filter(
    (e) =>
      e.parentTable === table &&
      e.childNullable &&
      !graph.noActualizables.has(e.childTable),
  )) {
    await client.query(
      `update ${edge.childTable} set "${edge.childColumn}" = null
        where "${edge.childColumn}"::text in (
          select "${edge.parentColumn}"::text from ${table}
           where "${pk}"::text = any($1::text[]))`,
      [borrables],
    );
  }

  const res = await client.query(
    `delete from ${table} where "${pk}"::text = any($1::text[])`,
    [borrables],
  );
  borradas += res.rowCount ?? 0;

  // Ya sin las filas de las que dependían: ahora sí se pueden borrar ellas.
  for (const { tabla, ids: hijasDiferidas } of diferidas) {
    borradas += await deleteWithDependents(
      client,
      graph,
      tabla,
      hijasDiferidas,
      visited,
      residuo,
    );
  }
  return borradas;
}

/**
 * Admite el residuo que dejó la limpieza, o falla explicando por qué no.
 *
 * Misma guarda que los tenants fijados por la bitácora
 * ({@link deleteRegisteredOrganizations}): una fila que una tabla WORM nombra
 * queda para siempre, así que sólo se acepta en una base que se declare
 * descartable ({@link assertPermanentResidueTarget}). Sobre una base compartida
 * la limpieza lanza con el detalle, y nunca desactiva un trigger.
 *
 * @param residuo - Lo que no se pudo borrar, por tabla.
 * @param descripcion - Qué se estaba limpiando, para el mensaje.
 * @throws Si hay residuo y la base no se declara descartable.
 */
function declararResiduoPermanente(
  residuo: Residuo,
  descripcion: string,
): void {
  if (residuo.size === 0) return;
  try {
    assertPermanentResidueTarget(resolveResetTarget(process.env), process.env);
  } catch (err) {
    const detalle = [...residuo]
      .map(([tabla, ids]) => `${tabla} (${ids.size})`)
      .join(', ');
    throw new Error(
      `No se pudo limpiar el fixture ${descripcion}: una tabla WORM (trigger ` +
        `forbid) sigue nombrando ${detalle} y no se puede borrar. ` +
        (err as Error).message,
    );
  }
}

/**
 * Cuentas que alguna fila del residuo nombra por FK: no se pueden borrar sin
 * romper esa FK, así que se anonimizan como las que fija la bitácora.
 *
 * @param client - Conexión ya abierta.
 * @param graph - El grafo de FK, ya leído.
 * @param residuo - Lo que no se pudo borrar, por tabla.
 * @returns Los ids de `iam.users` que el residuo referencia.
 */
async function cuentasNombradasPorResiduo(
  client: pg.Client,
  graph: SchemaGraph,
  residuo: Residuo,
): Promise<Set<string>> {
  const cuentas = new Set<string>();
  for (const [tabla, ids] of residuo) {
    const pk = graph.primaryKey.get(tabla);
    if (pk === undefined) continue;
    for (const edge of graph.edges.filter(
      (e) => e.childTable === tabla && e.parentTable === 'iam.users',
    )) {
      const { rows } = await client.query<{ id: string }>(
        `select distinct "${edge.childColumn}"::text as id from ${tabla}
          where "${pk}"::text = any($1::text[]) and "${edge.childColumn}" is not null`,
        [[...ids]],
      );
      for (const r of rows) cuentas.add(r.id);
    }
  }
  return cuentas;
}

/**
 * Si la arista `padre ← hija` cierra un ciclo con una dependencia obligatoria
 * en sentido contrario: la hija admite NULL en su referencia al padre, pero el
 * padre exige a la hija en alguna columna NOT NULL.
 *
 * Es el caso de `chart.clinical_note_headers` y `chart.clinical_note_versions`:
 * la versión apunta a su nota con `clinical_note_id NOT NULL` y la nota apunta a
 * su versión vigente con `current_version_id` (nullable). Si el recorrido llega
 * por las versiones y baja a las notas «hijas», la nota ve que sus versiones ya
 * están visitadas (siguen vivas, esperando que termine la llamada de arriba),
 * las salta y su `delete` choca con `fk_clinical_note_versions_clinical_note_id`.
 * El orden correcto es el inverso: anular la referencia nullable, borrar al
 * padre y recién después borrar a esas hijas, que ya no tienen quién las retenga.
 */
function esDependenciaCircular(
  graph: SchemaGraph,
  edge: ForeignKeyEdge,
): boolean {
  return (
    edge.childNullable &&
    graph.edges.some(
      (back) =>
        back.parentTable === edge.childTable &&
        back.childTable === edge.parentTable &&
        !back.childNullable,
    )
  );
}

/**
 * Borra los fixtures que una suite de integración creó, por su marca de corrida.
 *
 * Las suites corren contra la **base compartida** —la misma que alimenta la demo—
 * y hasta ahora no limpiaban nada: cada corrida dejaba sus actores («Dr. agenda»,
 * «Dr. cancel», «Dr. ventana»…) en el padrón, donde la Guía de profesionales los
 * publica junto a los médicos de verdad, duplicados una vez por corrida. La
 * analista funcional los reportó como defecto del producto, que es exactamente lo
 * que un fixture olvidado parece desde la pantalla.
 *
 * La marca es el sufijo único que la suite ya usaba para no chocar por unicidad
 * (`Date.now()`), presente en los códigos naturales `MED-<marca>-…` y
 * `PAC-<marca>-…`. De esas dos raíces —las dos son `profiles.persons`— cuelga todo
 * lo demás: credenciales, encuentros, notas, agendas y reservas.
 *
 * @param marca - Sufijo único de la corrida, tal como se compuso en los códigos.
 * @throws Si sobrevive algún fixture con la marca: uno que queda en silencio es
 *   justamente el defecto que esta función existe para impedir.
 */
export async function deleteFixturesByRunMark(
  marca: string | number,
): Promise<void> {
  const medicos = `MED-${marca}-%`;
  const pacientes = `PAC-${marca}-%`;
  const client = testDbClient();
  await client.connect();
  try {
    const graph = await readSchemaGraph(client);
    const { rows } = await client.query<{
      /**
       * Valor de id mantenido por la instancia.
       */
      id: string;
    }>(
      `select profile_id::text as id from profiles.health_practitioner_profiles
        where practitioner_code like $1
       union
       select profile_id::text as id from profiles.patient_profiles
        where patient_code like $2`,
      [medicos, pacientes],
    );
    const residuo: Residuo = new Map();
    await deleteWithDependents(
      client,
      graph,
      'profiles.persons',
      rows.map((r) => r.id),
      new Set<string>(),
      residuo,
    );
    declararResiduoPermanente(residuo, `con la marca ${marca}`);

    // Lo que una tabla WORM retuvo ya quedó declarado arriba; cualquier otro
    // sobreviviente es un huérfano.
    const declarados = [
      ...(residuo.get('profiles.health_practitioner_profiles') ?? []),
      ...(residuo.get('profiles.patient_profiles') ?? []),
    ];
    const { rows: resto } = await client.query<{
      /**
       * Valor de total mantenido por la instancia.
       */
      total: string;
    }>(
      `select (select count(*) from profiles.health_practitioner_profiles
                where practitioner_code like $1
                  and not (profile_id::text = any($3::text[])))
            + (select count(*) from profiles.patient_profiles
                where patient_code like $2
                  and not (profile_id::text = any($3::text[]))) as total`,
      [medicos, pacientes, declarados],
    );
    const pendientes = Number(resto[0]?.total ?? 0);
    if (pendientes > 0) {
      throw new Error(
        `La limpieza dejó ${pendientes} fixture(s) con la marca ${marca} en la base compartida.`,
      );
    }
  } finally {
    await client.end();
  }
}

/**
 * Tablas que cuelgan de `iam.users` por una columna semántica (no auditoría)
 * y que un autorregistro de profesional puede llegar a escribir. Hijas antes
 * que madres: `practice.practices` primero porque de ahí cuelgan, por FK, sus
 * sedes y las asignaciones de rol del consultorio propio (P20).
 *
 * **Lista corta y deliberada, no la raíz `iam.users`**: hay ~1 850 FKs hacia
 * `iam.users` en el modelo (casi todas `created_by_user_id`/
 * `updated_by_user_id` de auditoría), y recorrerlas todas con
 * {@link deleteWithDependents} contra una base remota (Neon) costaría miles
 * de viajes de ida y vuelta por corrida. Si el alta empieza a escribir una
 * tabla nueva por columna semántica, {@link deleteRegisteredPractitioners}
 * revienta con el detalle de la FK en vez de dejar un huérfano en silencio.
 */
const CUENTA_ESCRIBE_EN: readonly { table: string; column: string }[] = [
  // `HistoryMirrorSubscriber` (`src/orm/subscribers/history-mirror.subscriber.ts`)
  // sella una revisión en `audit.users_history` en cada alta de cuenta —
  // sistémico, no algo que este flujo declare—, y esa tabla no tiene otra
  // columna semántica que `user_id`. Va primero: es la única entrada de esta
  // lista sin más hijos propios, así que no importa el orden relativo al resto.
  { table: 'audit.users_history', column: 'user_id' },
  { table: 'practice.practices', column: 'admin_user_id' },
  { table: 'iam.sessions', column: 'user_id' },
  { table: 'iam.authentication_credentials', column: 'user_id' },
  { table: 'iam.user_global_roles', column: 'user_id' },
  { table: 'iam.email_verifications', column: 'user_id' },
  { table: 'iam.account_activations', column: 'user_id' },
  { table: 'iam.security_events', column: 'user_id' },
  // Los PDFs reclamados durante el alta profesional son propiedad del usuario
  // recién creado aunque su tenant siga siendo DEFAULT; limpiarlos por
  // `tenant_id` borraría archivos de otras cuentas de prueba.
  { table: 'common.files', column: 'created_by_user_id' },
  { table: 'directory.tenant_memberships', column: 'user_id' },
  { table: 'authz.user_role_assignments', column: 'user_id' },
  { table: 'messaging.notification_requests', column: 'recipient_user_id' },
  { table: 'messaging.in_app_notifications', column: 'recipient_user_id' },
  // `iam.refresh_tokens` NO tiene `user_id`: se llega a través de
  // `session_id → iam.sessions.id`, y como esa FK sí está en el grafo,
  // borrar `iam.sessions` de la fila de arriba ya arrastra sus tokens.
  //
  // Las cuatro siguientes las destapó el int-spec de C-14/C-23: un
  // profesional que abre un encuentro, registra observaciones, interna a un
  // paciente o pide una relación asistencial queda como `created_by_user_id`
  // de esas filas, y ninguna colgaba de acá — la limpieza fallaba con la FK
  // de `clinical.encounters` en el detalle.
  { table: 'clinical.encounters', column: 'created_by_user_id' },
  { table: 'clinical.care_episodes', column: 'created_by_user_id' },
  { table: 'clinical.observations', column: 'created_by_user_id' },
  { table: 'authz.care_relationships', column: 'created_by_user_id' },
];

/**
 * Tablas transversales que guardan `owner_id` sin FK declarada (el modelo
 * las deja polimórficas a propósito): el grafo de {@link readSchemaGraph} no
 * las ve, así que se limpian aparte, después de {@link CUENTA_ESCRIBE_EN}
 * (`practice_sites.address_id` apunta acá).
 */
const OWNER_SIN_FK = [
  'common.addresses',
  'common.contact_points',
  'common.identifiers',
] as const;

/**
 * Borra las cuentas dadas y todo lo que {@link CUENTA_ESCRIBE_EN} y
 * {@link OWNER_SIN_FK} dicen que cuelga de ellas.
 *
 * Extraído de la limpieza del autorregistro de profesional (P20) para que el
 * de organizaciones (subtarea 1.5) la reutilice: los dos flujos crean una
 * cuenta ACTIVA con la misma forma alrededor (sesión, credencial, rol
 * global, verificación de correo, evento de seguridad...) - sólo cambia qué
 * cuelga de la persona o del tenant *antes* de llegar acá, que resuelve cada
 * llamador por su cuenta.
 *
 * Una cuenta que una tabla WORM sigue nombrando —desde `@Audited`
 * obligatorio (#621), toda ruta que muta deja su fila en `audit.audit_log`—
 * no se borra: se anonimiza como lo hace el propio producto en UC-01-12
 * (DSAR, `IamUsersService.anonymize`). Con credencial, sesiones y roles ya
 * borrados por {@link CUENTA_ESCRIBE_EN}, lo que queda es una lápida sin
 * datos personales que no puede iniciar sesión ni aparecer en un padrón, y
 * la bitácora conserva su integridad referencial. Ver
 * {@link anonymizeWormPinnedAccounts}.
 *
 * Ruidoso por diseño: si borrar `iam.users` choca con una FK que
 * {@link CUENTA_ESCRIBE_EN} no conoce, lanza explicando cuál - nunca
 * deshabilita un trigger ni la replicación para forzar el borrado.
 *
 * @param client - Conexión ya abierta.
 * @param graph - El grafo de FK, ya leído.
 * @param visited - Lo ya borrado en esta corrida, compartido con quien
 *   llama: si el borrado del padre (persona o tenant) ya alcanzó una fila,
 *   no se reprocesa.
 * @param userIds - Las cuentas a borrar.
 * @param personIds - Personas asociadas, si las hay. El autorregistro de
 *   organización no crea ninguna (`readonly []`); `OWNER_SIN_FK` también las
 *   limpia por `owner_id`.
 * @param descripcion - Cómo nombrar el fixture en el mensaje del `throw`
 *   final ("de profesional", "de organización"...).
 * @param conservadas - Cuentas que no se borran aunque ninguna tabla WORM las
 *   nombre, porque una fila que quien llama deja viva las referencia; se
 *   anonimizan igual que las fijadas por la bitácora.
 * @param residuo - Lo que la limpieza ya no pudo borrar (compartido con quien
 *   llama). Se declara con {@link declararResiduoPermanente}, y las cuentas
 *   del fixture que esas filas nombran se anonimizan en vez de borrarse.
 * @throws Si algo sobrevive al borrado: un huérfano en silencio es
 *   exactamente el defecto que este helper existe para impedir.
 */
async function deleteAccounts(
  client: pg.Client,
  graph: SchemaGraph,
  visited: Set<string>,
  userIds: readonly string[],
  personIds: readonly string[],
  descripcion: string,
  conservadas: ReadonlySet<string> = new Set(),
  residuo: Residuo = new Map(),
): Promise<void> {
  for (const { table, column } of CUENTA_ESCRIBE_EN) {
    const pk = graph.primaryKey.get(table);
    if (pk === undefined) continue;
    const { rows } = await client.query<{ id: string }>(
      `select "${pk}"::text as id from ${table} where "${column}"::text = any($1::text[])`,
      [userIds],
    );
    await deleteWithDependents(
      client,
      graph,
      table,
      rows.map((r) => r.id),
      visited,
      residuo,
    );
  }

  declararResiduoPermanente(residuo, descripcion);
  // Una fila del residuo que nombra a una cuenta del fixture (p. ej. la admisión
  // retenida por su bitácora, `created_by_user_id`) impide borrarla: se anonimiza.
  // Sólo las del fixture: el residuo también puede nombrar al admin de pruebas.
  const nombradas = await cuentasNombradasPorResiduo(client, graph, residuo);
  const conservar = new Set([
    ...conservadas,
    ...userIds.filter((id) => nombradas.has(id)),
  ]);

  // Después de CUENTA_ESCRIBE_EN: `practice_sites.address_id` apunta acá.
  for (const tabla of OWNER_SIN_FK) {
    await client.query(
      `delete from ${tabla} where owner_id::text = any($1::text[])`,
      [[...userIds, ...personIds]],
    );
  }

  const anonimizadas = await anonymizeWormPinnedAccounts(
    client,
    graph,
    userIds,
    conservar,
  );
  const borrables = userIds.filter((id) => !anonimizadas.has(id));

  try {
    await client.query(
      `delete from iam.users where id::text = any($1::text[])`,
      [borrables],
    );
  } catch (err) {
    const pgErr = err as {
      code?: string;
      schema?: string;
      table?: string;
      constraint?: string;
      detail?: string;
      message: string;
    };
    if (pgErr.code === '23503') {
      const tablaHija = qualifiedViolationTable(pgErr);
      if (graph.noBorrables.has(tablaHija)) {
        throw new Error(
          `No se pudo limpiar iam.users: "${tablaHija}" es WORM (trigger forbid) ` +
            `y la suite no debería ejercitar un flujo que escriba ahí contra la ` +
            `base compartida. Detalle: ${pgErr.detail ?? pgErr.message}`,
        );
      }
      throw new Error(
        `No se pudo limpiar iam.users: sigue referenciado desde "${tablaHija}" ` +
          `(constraint "${pgErr.constraint ?? '?'}"). Agréguela a CUENTA_ESCRIBE_EN ` +
          `en harness.ts. Detalle: ${pgErr.detail ?? pgErr.message}`,
      );
    }
    throw err;
  }

  const { rows: resto } = await client.query<{ total: string }>(
    `select count(*)::text as total from iam.users
      where id::text = any($1::text[]) and anonymized_at is null`,
    [userIds],
  );
  const pendientes = Number(resto[0]?.total ?? 0);
  if (pendientes > 0) {
    throw new Error(
      `La limpieza dejó ${pendientes} cuenta(s) ${descripcion} en la base compartida.`,
    );
  }
}

/**
 * Anonimiza, en vez de borrar, las cuentas que alguna tabla WORM sigue
 * nombrando, y devuelve cuáles fueron.
 *
 * Las tablas WORM y sus FKs hacia `iam.users` salen del grafo que ya se leyó
 * del catálogo (`pg_trigger` + `pg_constraint`), no de una lista escrita a
 * mano: hoy es `audit.audit_log` (`user_id` y `recorded_by_user_id`), y si
 * mañana otra bitácora inmutable empieza a nombrar cuentas, cae acá sola.
 *
 * Por qué anonimizar y no las alternativas: el trigger `trg_forbid_mutation`
 * es justamente lo que el ADR-0021 y la promoción del WORM al modelo (v4.0.10)
 * protegen, así que no se desactiva ni se esquiva con
 * `session_replication_role = replica` —eso exige superusuario y sería, en la
 * base compartida, el mismo agujero que el WORM existe para cerrar—. El
 * estado final es el que deja UC-01-12 con una cuenta real: misma
 * `status_concept_id`, mismo `display_name` y `anonymized_at` sellado.
 *
 * @param client - Conexión ya abierta.
 * @param graph - El grafo de FK, ya leído.
 * @param userIds - Las cuentas del fixture.
 * @param conservadas - Cuentas que además hay que conservar (anonimizadas) porque
 *   una fila que la limpieza deja viva las nombra, como un tenant fijado por la
 *   bitácora (`created_by_user_id`).
 * @returns Las cuentas anonimizadas; el resto se puede borrar.
 */
async function anonymizeWormPinnedAccounts(
  client: pg.Client,
  graph: SchemaGraph,
  userIds: readonly string[],
  conservadas: ReadonlySet<string> = new Set(),
): Promise<Set<string>> {
  const fijadas = await wormPinnedIds(client, graph, 'iam.users', userIds);
  for (const id of conservadas) fijadas.add(id);
  if (fijadas.size === 0) return fijadas;

  await client.query(
    `update iam.users
        set status_concept_id = $2,
            anonymized_at     = coalesce(anonymized_at, now()),
            display_name      = 'ANONYMIZED',
            updated_at        = now(),
            row_version       = row_version + 1
      where id::text = any($1::text[])`,
    [[...fijadas], CONCEPTS.USER_ANONYMIZED],
  );
  return fijadas;
}

/**
 * Cuáles de las filas dadas de `parentTable` nombra alguna tabla WORM.
 *
 * Las tablas WORM y sus FKs salen del grafo ya leído del catálogo, no de una
 * lista escrita a mano. Una fila así no se puede borrar mientras la bitácora la
 * nombre: el trigger lo prohíbe y la FK lo impide, y ninguna de las dos se
 * debilita desde una prueba.
 *
 * @param client - Conexión ya abierta.
 * @param graph - El grafo de FK, ya leído.
 * @param parentTable - Tabla madre, calificada por esquema (`iam.users`).
 * @param ids - Claves primarias candidatas, como texto.
 * @returns Las claves que alguna tabla WORM sigue nombrando.
 */
async function wormPinnedIds(
  client: pg.Client,
  graph: SchemaGraph,
  parentTable: string,
  ids: readonly string[],
): Promise<Set<string>> {
  const fijadas = new Set<string>();
  const aristasWorm = graph.edges.filter(
    (e) => e.parentTable === parentTable && graph.noBorrables.has(e.childTable),
  );
  for (const edge of aristasWorm) {
    const { rows } = await client.query<{ id: string }>(
      `select distinct "${edge.childColumn}"::text as id from ${edge.childTable}
        where "${edge.childColumn}"::text = any($1::text[])`,
      [ids],
    );
    for (const r of rows) fijadas.add(r.id);
  }
  return fijadas;
}

/**
 * Borra la cuenta, la persona y todo lo que el auto-registro de profesional
 * escribió a su alrededor —incluido el consultorio propio de P20—, dejando
 * la base compartida (Neon, la misma que alimenta la demo) tal como estaba.
 *
 * `deleteFixturesByRunMark` no sirve acá: busca `practitioner_code LIKE
 * 'MED-<marca>-%'`, y el autorregistro genera `PRC-<uuid>`. Este helper parte
 * de `profiles.persons` (mismo camino ya probado) y delega en
 * {@link deleteAccounts} lo que cuelga de la cuenta y no de la persona.
 *
 * @param fixtures - Las cuentas y personas creadas por la suite.
 * @throws Si algo sobrevive al borrado: un huérfano en silencio es
 *   exactamente el defecto que este helper existe para impedir.
 */
export async function deleteRegisteredPractitioners(
  fixtures: readonly { userId: string; personId: string }[],
): Promise<void> {
  if (fixtures.length === 0) return;
  const userIds = fixtures.map((f) => f.userId);
  const personIds = fixtures.map((f) => f.personId);
  const client = testDbClient();
  await client.connect();
  try {
    const graph = await readSchemaGraph(client);
    const visited = new Set<string>();
    const residuo: Residuo = new Map();

    await deleteWithDependents(
      client,
      graph,
      'profiles.persons',
      personIds,
      visited,
      residuo,
    );

    await deleteAccounts(
      client,
      graph,
      visited,
      userIds,
      personIds,
      'de profesional',
      new Set(),
      residuo,
    );

    // Una persona que sobrevive sin figurar en el residuo declarado es un
    // huérfano en silencio, justo lo que esta limpieza existe para impedir.
    const retenidas = residuo.get('profiles.persons') ?? new Set<string>();
    const { rows: resto } = await client.query<{ total: string }>(
      `select count(*)::text as total from profiles.persons
        where id::text = any($1::text[]) and not (id::text = any($2::text[]))`,
      [personIds, [...retenidas]],
    );
    const pendientes = Number(resto[0]?.total ?? 0);
    if (pendientes > 0) {
      throw new Error(
        `La limpieza dejó ${pendientes} persona(s) de profesional sin declarar en la base compartida.`,
      );
    }
  } finally {
    await client.end();
  }
}

/**
 * Tablas que cuelgan de `directory.tenants` por una columna semántica
 * (`tenant_id` u otro nombre propio) y que el autorregistro de organización
 * puede llegar a escribir. Mismo criterio que {@link CUENTA_ESCRIBE_EN}:
 * lista corta y deliberada, no la raíz `directory.tenants` a secas —tiene
 * ~300 FKs entrantes en el modelo, muchas de auditoría, y recorrerlas todas
 * contra una base remota sería lento sin aportar nada que esta lista no dé.
 *
 * Sus hijos (sedes de práctica, sedes y ofertas de la unidad diagnóstica, el
 * historial de auditoría de `practice.practices`...) los alcanza
 * {@link deleteWithDependents} solo, recorriendo el grafo de FK desde acá.
 */
const TENANT_ESCRIBE_EN: readonly { table: string; column: string }[] = [
  { table: 'audit.tenants_history', column: 'tenant_id' },
  { table: 'directory.tenant_memberships', column: 'tenant_id' },
  // P50: el alta de farmacia crea su fila de `pharmacy.pharmacies` (de la que
  // cuelgan sus `pharmacy_sites`) y la registra en `directory.branches`. Va
  // ANTES de `practice.practices`: `pharmacies.primary_practice_site_id` y
  // `pharmacy_sites.practice_site_id` apuntan a las sedes de esa práctica.
  { table: 'pharmacy.pharmacies', column: 'tenant_id' },
  { table: 'directory.branches', column: 'tenant_id' },
  { table: 'practice.practices', column: 'tenant_id' },
  { table: 'diagnostic_units.diagnostic_units', column: 'tenant_id' },
  { table: 'messaging.notification_requests', column: 'tenant_id' },
  { table: 'messaging.in_app_notifications', column: 'tenant_id' },
  // Un tenant PAYER materializa su aseguradora en la misma transacción del
  // alta (`TenantTypeProfileService.materializeProfile`); faltaba acá y
  // cualquier suite que registrara una aseguradora por
  // `POST /iam/auth/register-organization` no podía limpiarse (subtarea 1.1).
  { table: 'insurance.insurance_carriers', column: 'tenant_id' },
  // Documentos legales de afiliación (subtarea 1.2): el alta los vincula al
  // tenant recién creado en la misma transacción. Y el `fileId` que cada uno
  // envuelve pasa a ser propiedad de ESE tenant al reclamarse
  // (`AttachableFileService.claimAnonymousUpload` reasigna `common.files.tenant_id`
  // desde el tenant DEFAULT), así que sin esta segunda fila el archivo
  // reclamado sobrevive al borrado del tenant que lo reclamó.
  { table: 'directory.tenant_affiliation_documents', column: 'tenant_id' },
  { table: 'common.files', column: 'tenant_id' },
  // Casa matriz georreferenciada (subtarea 1.3): `materializeProfile` crea una
  // fila de `common.addresses` con `owner_id = tenant_id` (owner_type TENANT).
  // No hay FK hacia `directory.tenants`, así que sin esta entrada el borrado
  // del tenant NO falla: la fila queda huérfana en silencio. `OWNER_SIN_FK`
  // no la alcanza (sólo cubre `owner_id in (userIds, personIds)`).
  { table: 'common.addresses', column: 'owner_id' },
  // Representante legal y gerencias de contacto (subtarea 1.4): los 3
  // gerentes llevan `power_of_attorney_document_id NULL` y no son
  // alcanzables desde `tenant_affiliation_documents` — sin esta entrada,
  // `delete from directory.tenants` revienta con 23503 nombrando esta tabla.
  // El orden relativo a `tenant_affiliation_documents` es indiferente: la
  // recursión por FK borra al representante antes del corte de ciclos.
  { table: 'directory.tenant_legal_representatives', column: 'tenant_id' },
  // Establecimiento médico declarado en el alta (HOSPITAL, CLINIC,
  // MEDICAL_OFFICE, NURSING, HEALTH_OTHER): la fila del establecimiento y sus
  // sedes declaradas cuelgan del tenant por FK. Las sedes primero, porque
  // también apuntan al establecimiento.
  { table: 'directory.tenant_medical_facility_sites', column: 'tenant_id' },
  { table: 'directory.tenant_medical_facilities', column: 'tenant_id' },
  // Sucursales del alta (P51: las del laboratorio; P50: las de la farmacia):
  // `materializeProfile` y el alta de farmacia las crean en
  // `directory.branches` con FK al tenant; sin esta entrada el borrado del
  // tenant revienta con 23503 nombrando `branches`.
  { table: 'directory.branches', column: 'tenant_id' },
];

/**
 * Borra la organización, su unidad diagnóstica (si la hubo), a quienes la
 * representan (subtarea 1.4) y la cuenta de su owner, dejando la base
 * compartida tal como estaba.
 *
 * Mismo criterio que {@link deleteRegisteredPractitioners}: recorre
 * {@link TENANT_ESCRIBE_EN} para alcanzar lo que cuelga del tenant, borra el
 * tenant en sí (nombrando, si algo lo sigue referenciando, qué tabla falta
 * en la lista), y delega en {@link deleteAccounts} la cuenta del owner. Desde
 * la subtarea 1.4 esto **ya no** es cierto para toda organización: un alta
 * que declaró representante legal o gerencias crea hasta cuatro
 * `profiles.persons`, así que sus ids se capturan ANTES del bucle —el bucle
 * borra las filas de `tenant_legal_representatives` que los nombran— y se
 * borran después de los tenants, igual que hace
 * {@link deleteRegisteredPractitioners}. `OWNER_SIN_FK` limpia sus
 * `identifiers`/`contact_points` por `owner_id` una vez que `deleteAccounts`
 * recibe esos ids.
 *
 * @param fixtures - Las cuentas y tenants creados por la suite.
 * @throws Si algo sobrevive al borrado.
 */
export async function deleteRegisteredOrganizations(
  fixtures: readonly { userId: string; tenantId: string }[],
): Promise<void> {
  if (fixtures.length === 0) return;
  const userIds = fixtures.map((f) => f.userId);
  const tenantIds = fixtures.map((f) => f.tenantId);
  const client = testDbClient();
  await client.connect();
  try {
    const graph = await readSchemaGraph(client);
    const visited = new Set<string>();
    const residuo: Residuo = new Map();

    // Antes de que el bucle de abajo borre las filas de
    // `tenant_legal_representatives`: son las únicas que nombran a estas
    // personas, así que sus ids hay que capturarlos ahora o se pierden.
    const { rows: filasDeRepresentacion } = await client.query<{
      person_id: string;
    }>(
      `select person_id from directory.tenant_legal_representatives where tenant_id::text = any($1::text[])`,
      [tenantIds],
    );
    const personIds = filasDeRepresentacion.map((f) => f.person_id);

    for (const { table, column } of TENANT_ESCRIBE_EN) {
      const pk = graph.primaryKey.get(table);
      if (pk === undefined) continue;
      const { rows } = await client.query<{ id: string }>(
        `select "${pk}"::text as id from ${table} where "${column}"::text = any($1::text[])`,
        [tenantIds],
      );
      await deleteWithDependents(
        client,
        graph,
        table,
        rows.map((r) => r.id),
        visited,
        residuo,
      );
    }

    // Un tenant que la bitácora inmutable nombra (`audit.audit_log.tenant_id`,
    // desde `@Audited` obligatorio, #621) no se puede borrar: el trigger WORM lo
    // prohíbe y la FK lo impide, y ninguna de las dos se desactiva acá. Queda como
    // residuo permanente, igual que la cuenta anonimizada de UC-01-12, y por eso
    // sólo se admite en una base que se declare descartable (la misma guarda que
    // usan las suites que dejan historial en `audit.*`). Sobre una base
    // compartida la limpieza falla con el motivo, sin tocar el tenant.
    const fijados = await wormPinnedIds(
      client,
      graph,
      'directory.tenants',
      tenantIds,
    );
    if (fijados.size > 0) {
      try {
        assertPermanentResidueTarget(
          resolveResetTarget(process.env),
          process.env,
        );
      } catch (err) {
        throw new Error(
          `No se pudo limpiar directory.tenants: ${fijados.size} organización(es) ` +
            `siguen nombradas por una tabla WORM (trigger forbid, p. ej. ` +
            `audit.audit_log) y no se pueden borrar. ${(err as Error).message}`,
        );
      }
    }
    const borrables = tenantIds.filter((id) => !fijados.has(id));

    try {
      await client.query(
        `delete from directory.tenants where id::text = any($1::text[])`,
        [borrables],
      );
    } catch (err) {
      const pgErr = err as {
        code?: string;
        schema?: string;
        table?: string;
        constraint?: string;
        detail?: string;
        message: string;
      };
      if (pgErr.code === '23503') {
        const tablaHija = qualifiedViolationTable(pgErr);
        if (graph.noBorrables.has(tablaHija)) {
          throw new Error(
            `No se pudo limpiar directory.tenants: "${tablaHija}" es WORM ` +
              `(trigger forbid) y la suite no debería ejercitar un flujo que ` +
              `escriba ahí contra la base compartida. Detalle: ${pgErr.detail ?? pgErr.message}`,
          );
        }
        throw new Error(
          `No se pudo limpiar directory.tenants: sigue referenciado desde ` +
            `"${tablaHija}" (constraint "${pgErr.constraint ?? '?'}"). Agréguela ` +
            `a TENANT_ESCRIBE_EN en harness.ts. Detalle: ${pgErr.detail ?? pgErr.message}`,
        );
      }
      throw err;
    }

    const { rows: resto } = await client.query<{ total: string }>(
      `select count(*)::text as total from directory.tenants where id::text = any($1::text[])`,
      [borrables],
    );
    const pendientes = Number(resto[0]?.total ?? 0);
    if (pendientes > 0) {
      throw new Error(
        `La limpieza dejó ${pendientes} organización(es) en la base compartida.`,
      );
    }

    // Los tenants que quedan siguen nombrando a quien los creó
    // (`created_by_user_id`/`updated_by_user_id`): esas cuentas se anonimizan en
    // vez de borrarse, o el `delete from iam.users` chocaría con esa FK.
    const { rows: autores } =
      fijados.size === 0
        ? { rows: [] as { id: string }[] }
        : await client.query<{ id: string }>(
            `select distinct u::text as id
               from directory.tenants t,
                    unnest(array[t.created_by_user_id, t.updated_by_user_id]) as u
              where t.id::text = any($1::text[]) and u is not null`,
            [[...fijados]],
          );
    const conservadas = new Set(
      autores.map((r) => r.id).filter((id) => userIds.includes(id)),
    );

    // El representante legal y las gerencias (subtarea 1.4): sus vínculos ya
    // se borraron en el bucle de arriba; sus personas, todavía no.
    await deleteWithDependents(
      client,
      graph,
      'profiles.persons',
      personIds,
      visited,
      residuo,
    );

    await deleteAccounts(
      client,
      graph,
      visited,
      userIds,
      personIds,
      'de organización',
      conservadas,
      residuo,
    );
  } finally {
    await client.end();
  }
}
