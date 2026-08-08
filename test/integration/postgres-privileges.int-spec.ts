import 'dotenv/config';
import pg from 'pg';

/**
 * Verificación REAL del mínimo privilegio de los roles de aplicación (§54).
 *
 * No inspecciona `information_schema.role_table_grants`. Los GRANT del catálogo
 * describen la intención; lo que demuestra que el lector no puede escribir es
 * intentar escribir con él y recibir un `42501`. Un privilegio puede además
 * llegar por herencia de rol o por `PUBLIC`, caminos que una consulta de grants
 * directos no ve y que una operación real sí acusa.
 *
 * Requiere que los roles existan: `yarn db:provision:dev`. Si no están, la suite
 * se salta entera en vez de fallar, porque un entorno sin roles aprovisionados
 * es un entorno que todavía no ha optado por la separación, no un fallo.
 */
const ADMIN = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

const WRITER_ROLE = process.env.POSTGRES_WRITER_ROLE ?? 'mantra_writer';
const READER_ROLE = process.env.POSTGRES_READER_ROLE ?? 'mantra_reader';
const WRITER_PASSWORD = process.env.POSTGRES_WRITER_PASSWORD;
const READER_PASSWORD = process.env.POSTGRES_READER_PASSWORD;

/**
 * Si la suite debe ejecutarse.
 *
 * La decisión es SÍNCRONA a propósito. Jest evalúa los `describe` durante la
 * recolección, antes de cualquier `beforeAll`, así que una condición que
 * dependiera de consultar la base llegaría siempre en `false` y la suite se
 * saltaría entera sin que nadie lo notara — una prueba de seguridad que no
 * corre es peor que ninguna, porque aparenta cobertura.
 *
 * Declarar las contraseñas es la señal de que el entorno optó por la separación
 * de roles. Si están y los roles no existen, `beforeAll` falla en vez de
 * saltarse: a partir de ahí, no ejecutar es un error.
 */
const OPTED_IN = Boolean(WRITER_PASSWORD && READER_PASSWORD);

/** Tabla sobre la que se ejercen las operaciones. */
let probeTable: string | null = null;
/** Esquema en el que se intenta el DDL. */
let probeSchema: string | null = null;
/** Nombre de la tabla sintética que se usa cuando la base aún está vacía. */
const SYNTHETIC_PROBE = '__privilege_probe_fixture';
/** Cualificada, si esta ejecución tuvo que fabricarla; se borra en `afterAll`. */
let syntheticProbe: string | null = null;

/** Abre una conexión, ejecuta y cierra. */
async function withClient<T>(
  connection: pg.ClientConfig,
  work: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const client = new pg.Client(connection);
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

/**
 * Ejecuta una sentencia dentro de una transacción que siempre se revierte.
 *
 * El rollback importa aunque se espere un rechazo: si por un fallo de
 * privilegios la escritura SÍ funcionara, la prueba habría insertado o borrado
 * filas en una tabla de negocio real. La prueba no debe dañar los datos ni
 * siquiera cuando descubre el problema que busca.
 */
async function attempt(
  connection: pg.ClientConfig,
  sql: string,
): Promise<{ ok: boolean; code?: string }> {
  try {
    await withClient(connection, async (client) => {
      await client.query('begin');
      try {
        await client.query(sql);
      } finally {
        await client.query('rollback');
      }
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, code: (error as { code?: string }).code };
  }
}

/**
 * Ejecuta varias sentencias en una transacción que siempre se revierte.
 *
 * Devuelve el índice de la que falló, para poder afirmar *cuál* fue rechazada y
 * no solo que alguna lo fue.
 */
async function attemptSequence(
  connection: pg.ClientConfig,
  statements: readonly string[],
): Promise<{ ok: boolean; code?: string; failedAt?: number }> {
  let index = 0;
  try {
    await withClient(connection, async (client) => {
      await client.query('begin');
      try {
        for (; index < statements.length; index += 1) {
          await client.query(statements[index]);
        }
      } finally {
        await client.query('rollback');
      }
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: (error as { code?: string }).code,
      failedAt: index,
    };
  }
}

beforeAll(async () => {
  if (!OPTED_IN) return;
  await withClient(ADMIN, async (client) => {
    const roles = await client.query<{ rolname: string }>(
      `select rolname from pg_roles where rolname = any($1::text[])`,
      [[WRITER_ROLE, READER_ROLE]],
    );
    if (roles.rows.length !== 2) {
      throw new Error(
        `Se declararon contraseñas para ${WRITER_ROLE} y ${READER_ROLE}, pero los ` +
          `roles no existen. Ejecuta «yarn db:provision:dev» antes de esta suite.`,
      );
    }

    const table = await client.query<{ qualified: string; schema: string }>(
      `select format('%I.%I', table_schema, table_name) as qualified,
              table_schema as schema
         from information_schema.tables
        where table_type = 'BASE TABLE'
          and table_schema not in ('pg_catalog', 'information_schema')
          and table_schema !~ '^(pg_|_timescaledb|timescaledb_|toolkit_)'
        order by table_schema, table_name
        limit 1`,
    );
    probeTable = table.rows[0]?.qualified ?? null;
    probeSchema = table.rows[0]?.schema ?? null;

    // El esquema de este producto no vive en el repositorio (ADR-0021), así que
    // en CI —y en cualquier base recién creada— no hay ni una tabla de negocio
    // cuando corre esta suite. Sin ella `probeTable` quedaba en `null`, cada
    // sentencia se convertía en `select 1 from null limit 1` y los doce casos
    // fallaban por error de sintaxis, no por un privilegio mal puesto.
    //
    // Se fabrica una como propietario. Una tabla creada tras el
    // `ALTER DEFAULT PRIVILEGES` recibe exactamente los grants por defecto que
    // esta suite verifica, así que el sondeo sintético comprueba lo mismo que
    // uno real. La columna `id` es obligatoria: los casos de UPDATE la usan.
    if (!probeTable) {
      probeSchema = 'public';
      syntheticProbe = `${probeSchema}.${SYNTHETIC_PROBE}`;
      await client.query(`drop table if exists ${syntheticProbe}`);
      await client.query(`create table ${syntheticProbe} (id int)`);
      await client.query(`insert into ${syntheticProbe} (id) values (1)`);
      probeTable = syntheticProbe;
    }
  });
});

afterAll(async () => {
  if (!OPTED_IN || !syntheticProbe) return;
  await withClient(ADMIN, (client) =>
    client.query(`drop table if exists ${syntheticProbe}`),
  );
});

const describeRoles = () => (OPTED_IN ? describe : describe.skip);

describeRoles()('Roles PostgreSQL: mínimo privilegio (base real)', () => {
  const reader = () => ({
    ...ADMIN,
    user: READER_ROLE,
    password: READER_PASSWORD,
  });
  const writer = () => ({
    ...ADMIN,
    user: WRITER_ROLE,
    password: WRITER_PASSWORD,
  });

  describe('atributos del rol', () => {
    it('ninguno de los dos es SUPERUSER ni tiene privilegios administrativos', async () => {
      const { rows } = await withClient(ADMIN, (client) =>
        client.query(
          `select rolname, rolsuper, rolcreaterole, rolcreatedb, rolreplication, rolbypassrls
             from pg_roles where rolname = any($1::text[])`,
          [[WRITER_ROLE, READER_ROLE]],
        ),
      );

      expect(rows).toHaveLength(2);
      for (const row of rows) {
        expect(row.rolsuper).toBe(false);
        expect(row.rolcreaterole).toBe(false);
        expect(row.rolcreatedb).toBe(false);
        expect(row.rolreplication).toBe(false);
        // El más importante de todos en este backend: con BYPASSRLS el rol
        // ignora las políticas de aislamiento por tenant de las 288 tablas que
        // las tienen, y el aislamiento multi-tenant deja de existir.
        expect(row.rolbypassrls).toBe(false);
      }
    });
  });

  describe('rol lector', () => {
    it('puede leer', async () => {
      const result = await attempt(
        reader(),
        `select 1 from ${probeTable} limit 1`,
      );
      expect(result).toEqual({ ok: true });
    });

    it.each([
      ['INSERT', () => `insert into ${probeTable} default values`],
      ['UPDATE', () => `update ${probeTable} set id = id`],
      ['DELETE', () => `delete from ${probeTable}`],
      ['TRUNCATE', () => `truncate ${probeTable}`],
    ])('no puede %s', async (_operation, sql) => {
      const result = await attempt(reader(), sql());
      expect(result.ok).toBe(false);
      expect(result.code).toBe('42501');
    });

    it('no puede crear objetos', async () => {
      const result = await attempt(
        reader(),
        `create table ${probeSchema}.__privilege_probe (id int)`,
      );
      expect(result.ok).toBe(false);
      expect(result.code).toBe('42501');
    });

    it('no consigue otorgarse privilegios a sí mismo', async () => {
      // PostgreSQL NO rechaza este GRANT: un rol sin la opción de concesión lo
      // ejecuta como no-op y solo emite un WARNING. Comprobar que la sentencia
      // «falla» daría un falso negativo. Lo que hay que comprobar es el efecto:
      // que después de intentarlo, el lector sigue sin poder escribir.
      const result = await attemptSequence(reader(), [
        `grant insert on ${probeTable} to ${READER_ROLE}`,
        `insert into ${probeTable} default values`,
      ]);
      expect(result.ok).toBe(false);
      expect(result.code).toBe('42501');
      expect(result.failedAt).toBe(1);
    });
  });

  describe('rol escritor', () => {
    it('puede leer', async () => {
      const result = await attempt(
        writer(),
        `select 1 from ${probeTable} limit 1`,
      );
      expect(result).toEqual({ ok: true });
    });

    it('no puede hacer DDL: no es el migrador', async () => {
      const result = await attempt(
        writer(),
        `create table ${probeSchema}.__privilege_probe (id int)`,
      );
      expect(result.ok).toBe(false);
      expect(result.code).toBe('42501');
    });

    it('no puede truncar: es destructivo y salta la auditoría', async () => {
      const result = await attempt(writer(), `truncate ${probeTable}`);
      expect(result.ok).toBe(false);
      expect(result.code).toBe('42501');
    });

    it('no puede eliminar objetos', async () => {
      const result = await attempt(writer(), `drop table ${probeTable}`);
      expect(result.ok).toBe(false);
    });
  });

  describe('privilegios por defecto', () => {
    it('una tabla creada después hereda los privilegios correctos', async () => {
      // Es el fallo que aparece semanas más tarde: la migración crea una tabla
      // nueva y la aplicación recibe un 42501 al escribir en ella porque los
      // privilegios por defecto no se configuraron para el rol que la creó.
      const table = `${probeSchema}.__default_privileges_probe`;
      try {
        await withClient(ADMIN, (client) =>
          client.query(`create table ${table} (id int)`),
        );

        const readerSelect = await attempt(reader(), `select 1 from ${table}`);
        const writerInsert = await attempt(
          writer(),
          `insert into ${table} (id) values (1)`,
        );
        const readerInsert = await attempt(
          reader(),
          `insert into ${table} (id) values (1)`,
        );

        expect(readerSelect.ok).toBe(true);
        expect(writerInsert.ok).toBe(true);
        expect(readerInsert.ok).toBe(false);
        expect(readerInsert.code).toBe('42501');
      } finally {
        await withClient(ADMIN, (client) =>
          client.query(`drop table if exists ${table}`),
        );
      }
    });
  });
});
