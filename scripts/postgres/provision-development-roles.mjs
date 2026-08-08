#!/usr/bin/env node
/**
 * Aprovisionamiento idempotente de los roles lector y escritor de PostgreSQL.
 *
 * Qué hace, en orden (§22):
 *   1. Valida que el entorno NO sea de producción.
 *   2. Carga la configuración y descubre los esquemas gestionados.
 *   3. Se conecta con el rol administrativo.
 *   4. Crea los roles si no existen.
 *   5. Corrige atributos inseguros (SUPERUSER, BYPASSRLS...) aunque ya existieran.
 *   6. Fija las contraseñas desde el entorno, sin que aparezcan en el log del servidor.
 *   7. Otorga privilegios sobre los objetos actuales.
 *   8. Configura los privilegios por defecto para los objetos futuros.
 *   9. VERIFICA ejecutando operaciones reales con cada rol.
 *  10. Imprime un resumen sanitizado.
 *  11. Sale con código distinto de cero ante cualquier fallo real.
 *
 * El paso 9 es el que justifica que esto sea un programa y no un archivo .sql:
 * inspeccionar los GRANT del catálogo describe la intención, no el efecto. Que
 * el lector no pueda escribir solo se demuestra intentando escribir con él.
 *
 * Uso: `yarn db:provision:dev`
 */
import 'dotenv/config';
import pg from 'pg';

/** Entornos en los que este script se niega a ejecutarse (§26). */
const FORBIDDEN_ENVIRONMENTS = new Set(['production', 'prod']);

/**
 * Esquemas que nunca se tocan: los del propio motor y los de TimescaleDB, cuyos
 * privilegios gestiona la extensión. Otorgar sobre ellos no solo es innecesario,
 * es una intromisión en objetos ajenos que el §24 prohíbe.
 */
const SYSTEM_SCHEMA_PATTERN =
  /^(pg_|information_schema$|_timescaledb|timescaledb_|toolkit_)/;

/** Identificador SQL válido y seguro para interpolar. */
const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]{0,62}$/;

/** Lee una variable obligatoria o aborta. */
function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno obligatoria ${name}.`);
  }
  return value;
}

/**
 * Valida un identificador antes de interpolarlo.
 *
 * Los nombres de rol y de esquema viajan a sentencias DDL, donde no existen los
 * parámetros vinculados. La lista blanca es la defensa: sin ella, un valor con
 * comillas en `POSTGRES_WRITER_ROLE` sería inyección de SQL con privilegios de
 * administrador (§23).
 */
function assertIdentifier(value, variable) {
  if (!SAFE_IDENTIFIER.test(value)) {
    throw new Error(
      `${variable} = «${value}» no es un identificador válido. ` +
        `Debe empezar por letra minúscula o guion bajo y contener solo [a-z0-9_].`,
    );
  }
  return value;
}

/** Cita un identificador ya validado. */
function ident(value) {
  return `"${value}"`;
}

/** Configuración resuelta desde el entorno. */
function loadConfig() {
  const environment = process.env.NODE_ENV ?? 'development';
  if (FORBIDDEN_ENVIRONMENTS.has(environment)) {
    throw new Error(
      `Este script no se ejecuta con NODE_ENV=${environment}. En producción, ` +
        `los roles se aprovisionan por IaC o por un proceso controlado (§26).`,
    );
  }

  const writer = assertIdentifier(
    process.env.POSTGRES_WRITER_ROLE ?? 'mantra_writer',
    'POSTGRES_WRITER_ROLE',
  );
  const reader = assertIdentifier(
    process.env.POSTGRES_READER_ROLE ?? 'mantra_reader',
    'POSTGRES_READER_ROLE',
  );
  if (writer === reader) {
    throw new Error(
      'POSTGRES_WRITER_ROLE y POSTGRES_READER_ROLE no pueden ser el mismo rol: ' +
        'la separación de privilegios es justamente el objetivo.',
    );
  }

  return {
    environment,
    admin: {
      host: required('DB_HOST'),
      port: Number(required('DB_PORT')),
      user: required('DB_USER'),
      password: required('DB_PASSWORD'),
      database: required('DB_NAME'),
    },
    writer,
    reader,
    writerPassword: required('POSTGRES_WRITER_PASSWORD'),
    readerPassword: required('POSTGRES_READER_PASSWORD'),
    // El propietario de los objetos, que es quien determina a quién aplican los
    // privilegios por defecto. Por defecto, el mismo rol que ejecuta las
    // migraciones hoy.
    owner: assertIdentifier(
      process.env.POSTGRES_OWNER_ROLE ?? required('DB_USER'),
      'POSTGRES_OWNER_ROLE',
    ),
    managedSchemas: process.env.POSTGRES_MANAGED_SCHEMAS
      ? process.env.POSTGRES_MANAGED_SCHEMAS.split(',').map((s) => s.trim()).filter(Boolean)
      : null,
  };
}

/** Descubre los esquemas de negocio, o valida los que el operador declaró. */
async function resolveSchemas(client, config) {
  if (config.managedSchemas) {
    for (const schema of config.managedSchemas) {
      assertIdentifier(schema, 'POSTGRES_MANAGED_SCHEMAS');
    }
    const { rows } = await client.query(
      `select nspname from pg_namespace where nspname = any($1::text[])`,
      [config.managedSchemas],
    );
    const found = new Set(rows.map((r) => r.nspname));
    const missing = config.managedSchemas.filter((s) => !found.has(s));
    if (missing.length > 0) {
      throw new Error(
        `POSTGRES_MANAGED_SCHEMAS nombra esquemas que no existen: ${missing.join(', ')}.`,
      );
    }
    return config.managedSchemas;
  }

  const { rows } = await client.query(
    `select nspname from pg_namespace order by nspname`,
  );
  return rows
    .map((row) => row.nspname)
    .filter((name) => !SYSTEM_SCHEMA_PATTERN.test(name))
    .filter((name) => SAFE_IDENTIFIER.test(name));
}

/** Crea un rol si no existe y le impone los atributos seguros. */
async function ensureRole(client, role) {
  const { rows } = await client.query(
    `select 1 from pg_roles where rolname = $1`,
    [role],
  );
  const created = rows.length === 0;
  if (created) {
    await client.query(`CREATE ROLE ${ident(role)} LOGIN`);
  }
  // Se aplica siempre, no solo al crear: un rol elevado a mano vuelve a su
  // sitio en la siguiente ejecución. Es lo que hace idempotente el ESTADO, no
  // solo la creación.
  await client.query(
    `ALTER ROLE ${ident(role)} ` +
      `NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS INHERIT LOGIN`,
  );
  return created;
}

/**
 * Fija la contraseña de un rol sin que aparezca en el log del servidor.
 *
 * `ALTER ROLE ... PASSWORD 'x'` con la contraseña en el texto de la sentencia
 * queda registrado íntegro si el servidor tiene `log_statement = 'all'` o si la
 * sentencia falla y se registra el error. Pasándola como parámetro a
 * `set_config` y componiendo el DDL con `format` dentro de un `EXECUTE`, el
 * texto que el servidor registra es el del bloque `DO`, no el de la sentencia
 * generada.
 *
 * La transacción explícita es imprescindible, no decorativa: el tercer
 * argumento de `set_config` marca el ajuste como LOCAL a la transacción, y este
 * script corre en autocommit, donde cada sentencia es su propia transacción. Sin
 * el `begin`, el ajuste desaparece antes de que el bloque `DO` lo lea y `%I`
 * recibe la cadena vacía. Se usa LOCAL, y no un ajuste de sesión, precisamente
 * para que el secreto muera con la transacción y no quede legible vía
 * `current_setting` durante el resto de la conexión.
 */
async function setPassword(client, role, password) {
  await client.query('begin');
  try {
    await client.query(
      `select set_config('provision.role', $1, true), set_config('provision.secret', $2, true)`,
      [role, password],
    );
    await client.query(`
      DO $$
      BEGIN
        EXECUTE format(
          'ALTER ROLE %I PASSWORD %L',
          current_setting('provision.role'),
          current_setting('provision.secret')
        );
      END
      $$;
    `);
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
}

/** Aplica privilegios y privilegios por defecto sobre un esquema. */
async function grantOnSchema(client, config, schema) {
  const s = ident(schema);
  const writer = ident(config.writer);
  const reader = ident(config.reader);
  const owner = ident(config.owner);

  await client.query(`GRANT USAGE ON SCHEMA ${s} TO ${writer}, ${reader}`);
  await client.query(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${s} TO ${writer}`,
  );
  await client.query(
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${s} TO ${writer}`,
  );
  await client.query(`GRANT SELECT ON ALL TABLES IN SCHEMA ${s} TO ${reader}`);

  // Convergencia: retira lo que sobra de ejecuciones o intervenciones previas.
  await client.query(
    `REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ` +
      `ON ALL TABLES IN SCHEMA ${s} FROM ${reader}`,
  );
  await client.query(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA ${s} FROM ${reader}`);
  await client.query(
    `REVOKE TRUNCATE ON ALL TABLES IN SCHEMA ${s} FROM ${writer}`,
  );
  await client.query(`REVOKE CREATE ON SCHEMA ${s} FROM ${writer}, ${reader}`);

  // Privilegios por defecto: dependen del rol que crea los objetos.
  await client.query(
    `ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA ${s} ` +
      `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${writer}`,
  );
  await client.query(
    `ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA ${s} ` +
      `GRANT SELECT ON TABLES TO ${reader}`,
  );
  await client.query(
    `ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA ${s} ` +
      `GRANT USAGE, SELECT ON SEQUENCES TO ${writer}`,
  );
}

/** Elige una tabla real sobre la que ejercer la verificación. */
async function pickProbeTable(client, schemas) {
  const { rows } = await client.query(
    `select format('%I.%I', table_schema, table_name) as qualified
       from information_schema.tables
      where table_type = 'BASE TABLE'
        and table_schema = any($1::text[])
      order by table_schema, table_name
      limit 1`,
    [schemas],
  );
  return rows[0]?.qualified ?? null;
}

/** Nombre de la tabla sintética que se usa cuando la base aún está vacía. */
const SYNTHETIC_PROBE = '__provision_probe_verify';

/**
 * Crea, como propietario, una tabla efímera sobre la que ejercer la
 * verificación cuando los esquemas gestionados todavía no tienen ninguna.
 *
 * Por qué existe: el esquema de este producto no vive en el repositorio
 * (ver ADR-0021), así que al aprovisionar en un entorno limpio —CI, una base
 * recién creada— no hay ni una tabla de negocio. Antes eso se reportaba como
 * comprobación fallida, de modo que el paso no podía pasar *nunca* en CI.
 *
 * No se rebaja a aviso a propósito: una tabla creada por el propietario tras
 * el `ALTER DEFAULT PRIVILEGES` recibe exactamente los grants por defecto que
 * interesa verificar, así que el sondeo sintético comprueba lo mismo que uno
 * real. Renunciar a verificar sería peor que verificar sobre esta.
 */
async function createSyntheticProbe(client, schema) {
  const qualified = `${schema}.${SYNTHETIC_PROBE}`;
  await client.query(`drop table if exists ${qualified}`);
  await client.query(`create table ${qualified} (id int)`);
  await client.query(`insert into ${qualified} (id) values (1)`);
  return qualified;
}

/**
 * Verifica el mínimo privilegio ejecutando operaciones reales (§54).
 *
 * @returns lista de comprobaciones con su resultado.
 */
async function verify(config, schemas) {
  const probe = [];
  const existing = await withClient(config.admin, (client) =>
    pickProbeTable(client, schemas),
  );

  // Sin tabla de negocio se fabrica una: ver `createSyntheticProbe`. Se anota
  // para poder borrarla al final pase lo que pase.
  const synthetic = existing
    ? null
    : await withClient(config.admin, (client) =>
        createSyntheticProbe(client, schemas[0]),
      );
  const table = existing ?? synthetic;

  probe.push({
    check: 'tabla de sondeo',
    ok: true,
    detail: existing
      ? `Se verifica sobre ${table}.`
      : `Esquemas sin tablas; se verifica sobre ${table}, creada y destruida por esta ejecución.`,
  });

  try {
    return await runChecks(config, schemas, table, probe);
  } finally {
    if (synthetic) {
      await withClient(config.admin, (client) =>
        client.query(`drop table if exists ${synthetic}`),
      );
    }
  }
}

/**
 * Ejerce las operaciones reales contra la tabla de sondeo.
 *
 * @returns la lista de comprobaciones, con las de este paso añadidas.
 */
async function runChecks(config, schemas, table, probe) {

  // Atributos de los roles: se leen del catálogo porque son atributos, no
  // privilegios, y no hay operación que los "ejerza".
  const attributes = await withClient(config.admin, (client) =>
    client.query(
      `select rolname, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls
         from pg_roles where rolname = any($1::text[])`,
      [[config.writer, config.reader]],
    ),
  );
  for (const row of attributes.rows) {
    const elevated =
      row.rolsuper || row.rolcreaterole || row.rolcreatedb || row.rolbypassrls;
    probe.push({
      check: `${row.rolname}: sin atributos administrativos`,
      ok: !elevated,
      detail: elevated
        ? 'El rol conserva SUPERUSER, CREATEROLE, CREATEDB o BYPASSRLS.'
        : 'NOSUPERUSER, NOCREATEROLE, NOCREATEDB, NOBYPASSRLS.',
    });
  }

  const readerConn = { ...config.admin, user: config.reader, password: config.readerPassword };
  const writerConn = { ...config.admin, user: config.writer, password: config.writerPassword };

  // El lector debe poder leer.
  probe.push(
    await expectSuccess(readerConn, `select 1 from ${table} limit 1`, `${config.reader}: SELECT permitido`),
  );
  // Y no debe poder escribir. Se envuelve en una transacción que se revierte
  // siempre: la verificación no debe dejar rastro en los datos, y si por un
  // fallo de privilegios la escritura SÍ funcionara, el ROLLBACK evita haber
  // insertado una fila basura en una tabla de negocio.
  probe.push(
    await expectDenied(readerConn, `insert into ${table} default values`, `${config.reader}: INSERT denegado`),
  );
  probe.push(
    await expectDenied(readerConn, `delete from ${table}`, `${config.reader}: DELETE denegado`),
  );
  probe.push(
    await expectDenied(readerConn, `truncate ${table}`, `${config.reader}: TRUNCATE denegado`),
  );
  probe.push(
    await expectDenied(
      readerConn,
      `create table ${schemas[0]}.__provision_probe (id int)`,
      `${config.reader}: CREATE denegado`,
    ),
  );

  // El escritor debe poder leer y no debe poder hacer DDL.
  probe.push(
    await expectSuccess(writerConn, `select 1 from ${table} limit 1`, `${config.writer}: SELECT permitido`),
  );
  probe.push(
    await expectDenied(
      writerConn,
      `create table ${schemas[0]}.__provision_probe (id int)`,
      `${config.writer}: CREATE denegado`,
    ),
  );
  probe.push(
    await expectDenied(writerConn, `truncate ${table}`, `${config.writer}: TRUNCATE denegado`),
  );

  return probe;
}

/** Ejecuta una sentencia que debe funcionar. */
async function expectSuccess(connection, sql, check) {
  try {
    await withClient(connection, (client) => client.query(sql));
    return { check, ok: true, detail: 'Ejecutada correctamente.' };
  } catch (error) {
    return { check, ok: false, detail: `Falló: ${error.code ?? error.message}` };
  }
}

/**
 * Ejecuta una sentencia que DEBE ser rechazada por falta de privilegios.
 *
 * Solo `42501 insufficient_privilege` cuenta como éxito. Un fallo por otra
 * causa -una tabla sin columnas con valor por defecto, por ejemplo- no
 * demuestra nada sobre los privilegios y se marca como no concluyente, porque
 * darlo por bueno sería exactamente la clase de verificación que tranquiliza
 * sin comprobar nada.
 */
async function expectDenied(connection, sql, check) {
  try {
    await withClient(connection, async (client) => {
      await client.query('begin');
      try {
        await client.query(sql);
      } finally {
        await client.query('rollback');
      }
    });
    return { check, ok: false, detail: 'La operación NO fue rechazada.' };
  } catch (error) {
    if (error.code === '42501') {
      return { check, ok: true, detail: 'Rechazada con 42501 insufficient_privilege.' };
    }
    return {
      check,
      ok: false,
      detail: `Rechazada por otra causa (${error.code ?? error.message}); no concluyente.`,
    };
  }
}

/** Abre una conexión, ejecuta y cierra. */
async function withClient(connection, work) {
  const client = new pg.Client(connection);
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

/** Punto de entrada. */
async function main() {
  const config = loadConfig();
  const summary = { rolesCreated: [], schemas: 0 };

  await withClient(config.admin, async (client) => {
    const schemas = await resolveSchemas(client, config);
    if (schemas.length === 0) {
      throw new Error('No se encontró ningún esquema de negocio que gestionar.');
    }
    summary.schemas = schemas.length;
    summary.schemaList = schemas;

    for (const role of [config.writer, config.reader]) {
      if (await ensureRole(client, role)) summary.rolesCreated.push(role);
    }
    await setPassword(client, config.writer, config.writerPassword);
    await setPassword(client, config.reader, config.readerPassword);

    await client.query(
      `GRANT CONNECT ON DATABASE ${ident(config.admin.database)} ` +
        `TO ${ident(config.writer)}, ${ident(config.reader)}`,
    );
    for (const schema of schemas) {
      await grantOnSchema(client, config, schema);
    }
  });

  const checks = await verify(config, summary.schemaList);

  // Resumen sanitizado: ni contraseñas, ni host, ni cadena de conexión.
  console.log('');
  console.log('Aprovisionamiento de roles PostgreSQL');
  console.log(`  entorno            : ${config.environment}`);
  console.log(`  base               : ${config.admin.database}`);
  console.log(`  rol escritor       : ${config.writer}`);
  console.log(`  rol lector         : ${config.reader}`);
  console.log(`  propietario/migrador: ${config.owner}`);
  console.log(`  esquemas           : ${summary.schemas}`);
  console.log(
    `  roles creados      : ${summary.rolesCreated.length > 0 ? summary.rolesCreated.join(', ') : 'ninguno (ya existían)'}`,
  );
  console.log('');
  console.log('Verificación de mínimo privilegio:');
  for (const check of checks) {
    console.log(`  ${check.ok ? '✓' : '✗'} ${check.check} — ${check.detail}`);
  }
  console.log('');

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    throw new Error(
      `${failed.length} comprobación(es) de privilegios no pasaron. ` +
        `Los roles NO están correctamente restringidos.`,
    );
  }
  console.log('Todos los privilegios verificados contra la base real.');
}

main().catch((error) => {
  console.error(`\nError: ${error.message}\n`);
  process.exit(1);
});
