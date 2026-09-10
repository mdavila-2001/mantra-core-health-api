import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/postgresql';
import type { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import pg from 'pg';
import { AppModule } from '../../src/app.module';
import { CONCEPTS, SEED, TokenService, createdBy } from '../../src/common';
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

/**
 * Vacía todos los datos de negocio antes de un arranque, dejando la base limpia
 * para que la corrida sea reproducible: sin esto, los recursos con constraints
 * de unicidad (p. ej. una farmacia por tenant, una política por recurso) chocan
 * en la segunda ejecución del smoke. El seed de conceptos/tenant/propósito y el
 * admin se rematerializan en el arranque, así que truncar es seguro.
 *
 * Trunca toda tabla de los esquemas de negocio (no del sistema) con CASCADE para
 * respetar las FK. Solo debe usarse contra la base de pruebas del `.env`.
 */
export async function resetBusinessData(): Promise<void> {
  const client = new pg.Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5434),
    user: process.env.DB_USER ?? 'mantra',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'mantra_redesa_health',
  });
  await client.connect();
  try {
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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
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
 * Borra filas y todo lo que dependa de ellas, hijas antes que madre.
 *
 * El recorrido corta por ciclos con un registro de lo ya visitado:
 * `profiles.persons` se referencia a sí misma (`related_persons`) y sin ese corte
 * la recursión no terminaría. Los ids viajan como texto para no depender del tipo
 * de cada clave.
 */
async function deleteWithDependents(
  client: pg.Client,
  graph: SchemaGraph,
  table: string,
  ids: readonly string[],
  visited: Set<string>,
): Promise<number> {
  const pk = graph.primaryKey.get(table);
  if (pk === undefined || ids.length === 0 || graph.noBorrables.has(table))
    return 0;

  const pending = ids.filter((id) => !visited.has(`${table}:${id}`));
  if (pending.length === 0) return 0;
  for (const id of pending) visited.add(`${table}:${id}`);

  let borradas = 0;
  for (const edge of graph.edges.filter((e) => e.parentTable === table)) {
    if (!graph.primaryKey.has(edge.childTable)) continue;
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
      `select "${graph.primaryKey.get(edge.childTable) as string}"::text as id
         from ${edge.childTable} where "${edge.childColumn}"::text = any($1::text[])`,
      [claves],
    );
    borradas += await deleteWithDependents(
      client,
      graph,
      edge.childTable,
      hijas.rows.map((r) => r.id),
      visited,
    );
  }

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
      [pending],
    );
  }

  const res = await client.query(
    `delete from ${table} where "${pk}"::text = any($1::text[])`,
    [pending],
  );
  return borradas + (res.rowCount ?? 0);
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
    await deleteWithDependents(
      client,
      graph,
      'profiles.persons',
      rows.map((r) => r.id),
      new Set<string>(),
    );

    const { rows: resto } = await client.query<{
      /**
       * Valor de total mantenido por la instancia.
       */
      total: string;
    }>(
      `select (select count(*) from profiles.health_practitioner_profiles
                where practitioner_code like $1)
            + (select count(*) from profiles.patient_profiles
                where patient_code like $2) as total`,
      [medicos, pacientes],
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
  { table: 'directory.tenant_memberships', column: 'user_id' },
  { table: 'authz.user_role_assignments', column: 'user_id' },
  { table: 'messaging.notification_requests', column: 'recipient_user_id' },
  { table: 'messaging.in_app_notifications', column: 'recipient_user_id' },
  // `iam.refresh_tokens` NO tiene `user_id`: se llega a través de
  // `session_id → iam.sessions.id`, y como esa FK sí está en el grafo,
  // borrar `iam.sessions` de la fila de arriba ya arrastra sus tokens.
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
 * Ruidoso por diseño: si borrar `iam.users` choca con una FK que
 * {@link CUENTA_ESCRIBE_EN} no conoce, o con una tabla WORM, lanza
 * explicando cuál - nunca deshabilita un trigger para forzar el borrado.
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
    );
  }

  // Después de CUENTA_ESCRIBE_EN: `practice_sites.address_id` apunta acá.
  for (const tabla of OWNER_SIN_FK) {
    await client.query(
      `delete from ${tabla} where owner_id::text = any($1::text[])`,
      [[...userIds, ...personIds]],
    );
  }

  try {
    await client.query(
      `delete from iam.users where id::text = any($1::text[])`,
      [userIds],
    );
  } catch (err) {
    const pgErr = err as {
      code?: string;
      table?: string;
      constraint?: string;
      detail?: string;
      message: string;
    };
    if (pgErr.code === '23503') {
      const tablaHija = pgErr.table ?? '(desconocida)';
      if (graph.noBorrables.has(tablaHija)) {
        throw new Error(
          `No se pudo limpiar iam.users: "${tablaHija}" es WORM (trigger forbid) ` +
            `y la suite no debería ejercitar un flujo que escriba ahí contra la ` +
            `base compartida. Detalle: ${pgErr.detail ?? pgErr.message}`,
        );
      }
      throw new Error(
        `No se pudo limpiar iam.users: sigue referenciado desde "${tablaHija}" ` +
          `(constraint "${pgErr.constraint ?? '?'}"). Agregala a CUENTA_ESCRIBE_EN ` +
          `en harness.ts. Detalle: ${pgErr.detail ?? pgErr.message}`,
      );
    }
    throw err;
  }

  const { rows: resto } = await client.query<{ total: string }>(
    `select count(*)::text as total from iam.users where id::text = any($1::text[])`,
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

    await deleteWithDependents(
      client,
      graph,
      'profiles.persons',
      personIds,
      visited,
    );

    await deleteAccounts(
      client,
      graph,
      visited,
      userIds,
      personIds,
      'de profesional',
    );
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
  { table: 'practice.practices', column: 'tenant_id' },
  { table: 'diagnostic_units.diagnostic_units', column: 'tenant_id' },
  { table: 'messaging.notification_requests', column: 'tenant_id' },
  { table: 'messaging.in_app_notifications', column: 'tenant_id' },
];

/**
 * Borra la organización, su unidad diagnóstica (si la hubo) y la cuenta de
 * su owner, dejando la base compartida tal como estaba.
 *
 * Mismo criterio que {@link deleteRegisteredPractitioners}: recorre
 * {@link TENANT_ESCRIBE_EN} para alcanzar lo que cuelga del tenant, borra el
 * tenant en sí (nombrando, si algo lo sigue referenciando, qué tabla falta
 * en la lista), y delega en {@link deleteAccounts} la cuenta del owner — el
 * autorregistro de organización no crea ninguna `profiles.persons` (el
 * owner es una cuenta administrativa, no un paciente ni un profesional).
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
      );
    }

    try {
      await client.query(
        `delete from directory.tenants where id::text = any($1::text[])`,
        [tenantIds],
      );
    } catch (err) {
      const pgErr = err as {
        code?: string;
        table?: string;
        constraint?: string;
        detail?: string;
        message: string;
      };
      if (pgErr.code === '23503') {
        const tablaHija = pgErr.table ?? '(desconocida)';
        if (graph.noBorrables.has(tablaHija)) {
          throw new Error(
            `No se pudo limpiar directory.tenants: "${tablaHija}" es WORM ` +
              `(trigger forbid) y la suite no debería ejercitar un flujo que ` +
              `escriba ahí contra la base compartida. Detalle: ${pgErr.detail ?? pgErr.message}`,
          );
        }
        throw new Error(
          `No se pudo limpiar directory.tenants: sigue referenciado desde ` +
            `"${tablaHija}" (constraint "${pgErr.constraint ?? '?'}"). Agregala ` +
            `a TENANT_ESCRIBE_EN en harness.ts. Detalle: ${pgErr.detail ?? pgErr.message}`,
        );
      }
      throw err;
    }

    const { rows: resto } = await client.query<{ total: string }>(
      `select count(*)::text as total from directory.tenants where id::text = any($1::text[])`,
      [tenantIds],
    );
    const pendientes = Number(resto[0]?.total ?? 0);
    if (pendientes > 0) {
      throw new Error(
        `La limpieza dejó ${pendientes} organización(es) en la base compartida.`,
      );
    }

    await deleteAccounts(
      client,
      graph,
      visited,
      userIds,
      [],
      'de organización',
    );
  } finally {
    await client.end();
  }
}
