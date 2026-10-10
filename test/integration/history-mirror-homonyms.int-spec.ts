import 'dotenv/config';
import pg from 'pg';
import { ChangeSetType, type FlushEventArgs } from '@mikro-orm/core';
import { HistoryMirrorSubscriber } from '../../src/orm/subscribers/history-mirror.subscriber';

/**
 * P-01 (informe D, flujo-errores): el espejo de historial resolvía la tabla
 * fuente por nombre y versionaba `medical_groups.groups` en
 * `audit.groups_history`, cuya FK apunta a `community.groups` — 23503 y alta
 * abortada. Esta prueba lee el catálogo REAL (la consulta del registro tal cual)
 * y comprueba a qué tabla de historial iría cada escritura. No escribe nada: las
 * sentencias del espejo se capturan en vez de ejecutarse.
 */
const ADMIN = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};
const SOURCE_ID = '22222222-2222-4222-8222-222222222222';

function mirrorStatementsFor(
  client: pg.Client,
  schema: string,
  tableName: string,
): Promise<string[]> {
  const statements: string[] = [];
  const em = {
    getConnection: () => ({
      execute: async (sql: string) => (await client.query(sql)).rows,
    }),
    execute: async (sql: string) => {
      statements.push(sql);
      return [];
    },
  };
  const uow = {
    getChangeSets: () => [
      {
        type: ChangeSetType.CREATE,
        meta: { schema, tableName, primaryKeys: ['id'] },
        // El espejo serializa con `wrap(entity).toObject()`; un objeto plano
        // no lo tiene, así que la entidad de mentira lo trae puesto.
        entity: { id: SOURCE_ID, toObject: () => ({ id: SOURCE_ID }) },
      },
    ],
  };
  return new HistoryMirrorSubscriber()
    .afterFlush({ em, uow } as unknown as FlushEventArgs)
    .then(() => statements);
}

describe('HistoryMirrorSubscriber contra el catálogo real (P-01)', () => {
  let client: pg.Client;

  beforeAll(async () => {
    client = new pg.Client(ADMIN);
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it.each([
    ['medical_groups', 'groups'],
    ['marketing', 'segments'],
  ])(
    'no escribe historial para %s.%s (sin *_history en el modelo)',
    async (schema, table) => {
      await expect(mirrorStatementsFor(client, schema, table)).resolves.toEqual(
        [],
      );
    },
  );

  it.each([
    ['community', 'groups', 'audit."groups_history"'],
    ['accounting', 'segments', 'audit."segments_history"'],
  ])('versiona %s.%s en su historial', async (schema, table, history) => {
    const statements = await mirrorStatementsFor(client, schema, table);
    expect(statements).toHaveLength(2);
    expect(statements.every((sql) => sql.includes(history))).toBe(true);
  });
});
