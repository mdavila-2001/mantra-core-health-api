import 'dotenv/config';
import pg from 'pg';
import { MikroORM, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { FourEyesRequests } from '../../src/modules/delegated_access/entities';
import { FourEyesRepository } from '../../src/modules/delegated_access/repositories';
import { afterCommit } from '../../src/modules/delegated_access/services/governance-after-commit';
import {
  applyTenantContext,
  withTenantContext,
} from '../../src/modules/delegated_access/services/tenant-context';
import { inTenantTransaction } from '../../src/modules/delegated_access/services/governance-tx';

/**
 * Revisión de seguridad del gobierno de accesos, ronda 2, contra PostgreSQL REAL como
 * `mantra_app` (sin BYPASSRLS): lo que un doble no puede probar.
 *
 *   V-4  `afterCommit` corre DESPUÉS del commit de la transacción RAÍZ aunque el servicio haya
 *        confirmado un savepoint antes (el aviso a otras réplicas ve la fila ya confirmada);
 *   N-5  `set_config(..., true)` NO se revierte al liberar un savepoint (el defecto) y
 *        `withTenantContext` / `inTenantTransaction` devuelven el contexto previo (el arreglo);
 *   N-3  `lockRequesterQueue` serializa «contar y crear»: 30 peticiones a la vez no pasan de 10.
 *
 * Es opt-in (`SEG2_TEST=1`) y necesita la base de la receta de `governance-seg-ronda1.int-spec.ts`
 * (modelo, parches y `mantra_app` con LOGIN). Se apunta con `SEG2_DB_HOST/PORT/NAME`,
 * `SEG2_ADMIN_USER/PASSWORD` (superusuario que crea las tablas de prueba) y `SEG2_APP_USER/PASSWORD`.
 * Crea y borra `public.seg2_probe` y `public.seg2_queue`.
 */
const describeSeg = process.env.SEG2_TEST === '1' ? describe : describe.skip;

const HOST = process.env.SEG2_DB_HOST ?? '127.0.0.1';
const PORT = Number(process.env.SEG2_DB_PORT ?? 5541);
const DB = process.env.SEG2_DB_NAME ?? 'seg1';
const ADMIN_USER = process.env.SEG2_ADMIN_USER ?? 'mantra';
const ADMIN_PASSWORD = process.env.SEG2_ADMIN_PASSWORD ?? 'mantra';
const APP_USER = process.env.SEG2_APP_USER ?? 'mantra_app';
const APP_PASSWORD = process.env.SEG2_APP_PASSWORD ?? 'mantra';

const A = '00000000-0000-4000-8000-0000000000aa';
const B = '00000000-0000-4000-8000-0000000000bb';

describeSeg(
  'Revisión de seguridad del gobierno, ronda 2 (base real, como mantra_app)',
  () => {
    let admin: pg.Client;
    let orm: MikroORM;
    const before = process.env.RLS_ENFORCE;

    const tenantOf = async (): Promise<string> => {
      const rows = await orm.em.execute<{ t: string | null }[]>(
        "select current_setting('app.current_tenant_id', true) as t",
      );
      return rows[0]?.t ?? '';
    };

    beforeAll(async () => {
      admin = new pg.Client({
        host: HOST,
        port: PORT,
        user: ADMIN_USER,
        password: ADMIN_PASSWORD,
        database: DB,
      });
      await admin.connect();
      await admin.query('drop table if exists public.seg2_probe');
      await admin.query('drop table if exists public.seg2_queue');
      await admin.query('create table public.seg2_probe (id text primary key)');
      await admin.query(
        'create table public.seg2_queue (requester text, n int)',
      );
      await admin.query(
        'grant all on public.seg2_probe, public.seg2_queue to ' + APP_USER,
      );
      orm = await MikroORM.init({
        driver: PostgreSqlDriver,
        host: HOST,
        port: PORT,
        user: APP_USER,
        password: APP_PASSWORD,
        dbName: DB,
        entities: [FourEyesRequests],
        metadataProvider: ReflectMetadataProvider,
        allowGlobalContext: true,
        discovery: { warnWhenNoEntities: false },
        forceUtcTimezone: true,
        pool: { min: 1, max: 40 },
      });
      process.env.RLS_ENFORCE = 'true';
    });

    afterAll(async () => {
      if (before === undefined) delete process.env.RLS_ENFORCE;
      else process.env.RLS_ENFORCE = before;
      await orm?.close(true);
      await admin?.query('drop table if exists public.seg2_probe');
      await admin?.query('drop table if exists public.seg2_queue');
      await admin?.end();
    });

    describe('V-4: afterCommit espera el commit de la transacción raíz', () => {
      it('con un savepoint dentro de la petición, el aviso ve la fila YA confirmada (otra conexión); con el aviso «de inmediato» no la vería', async () => {
        const seenWhenAnnounced: number[] = [];
        const seenIfImmediate: number[] = [];
        const visibleElsewhere = async (id: string): Promise<number> =>
          (
            await admin.query(
              'select count(*)::int as n from public.seg2_probe where id = $1',
              [id],
            )
          ).rows[0].n;

        // Como TenantContextInterceptor: una transacción por petición, y el servicio abre un savepoint.
        await orm.em.transactional(async () => {
          await orm.em.transactional(async () => {
            await orm.em.execute(
              "insert into public.seg2_probe (id) values ('regla-1')",
            );
          });
          // Aquí «el servicio confirmó»: lo que se escribió aún NO está confirmado de verdad.
          seenIfImmediate.push(await visibleElsewhere('regla-1'));
          afterCommit(orm.em, () => {
            void visibleElsewhere('regla-1').then((n) =>
              seenWhenAnnounced.push(n),
            );
          });
          expect(seenWhenAnnounced).toHaveLength(0);
        });
        // El aviso corre en el commit raíz; se espera a que su consulta termine.
        await new Promise((r) => setTimeout(r, 300));
        expect(seenIfImmediate).toEqual([0]);
        expect(seenWhenAnnounced).toEqual([1]);
      });

      it('si la raíz se revierte, el aviso también corre (la caché pudo guardar lo no confirmado) y la fila no existe', async () => {
        let ran = 0;
        await expect(
          orm.em.transactional(async () => {
            await orm.em.transactional(async () => {
              await orm.em.execute(
                "insert into public.seg2_probe (id) values ('regla-2')",
              );
            });
            afterCommit(orm.em, () => {
              ran += 1;
            });
            throw new Error('falla la petición');
          }),
        ).rejects.toThrow('falla la petición');
        expect(ran).toBe(1);
        const n = (
          await admin.query(
            "select count(*)::int as n from public.seg2_probe where id = 'regla-2'",
          )
        ).rows[0].n;
        expect(n).toBe(0);
      });

      it('sin transacción alrededor corre al instante', () => {
        let ran = 0;
        afterCommit(orm.em, () => {
          ran += 1;
        });
        expect(ran).toBe(1);
      });
    });

    describe('N-5: el contexto de tenant no sobrevive al savepoint', () => {
      it('DEFECTO (documenta PostgreSQL): applyTenantContext dentro de un savepoint deja a la petición bajo OTRA organización', async () => {
        await orm.em.transactional(async (outer) => {
          await applyTenantContext(outer, A);
          await orm.em.transactional(async (tx) => {
            await applyTenantContext(tx, B);
          });
          expect(await tenantOf()).toBe(B);
        });
      });

      it('withTenantContext devuelve el contexto de la petición al liberar el savepoint', async () => {
        await orm.em.transactional(async (outer) => {
          await applyTenantContext(outer, A);
          await orm.em.transactional(async (tx) => {
            await withTenantContext(tx, B, async () => {
              expect(await tenantOf()).toBe(B);
            });
          });
          expect(await tenantOf()).toBe(A);
        });
      });

      it('inTenantTransaction (rutas que abren su transacción dentro de una petición) también lo restaura', async () => {
        await orm.em.transactional(async (outer) => {
          await applyTenantContext(outer, A);
          await inTenantTransaction(orm.em, B, async () => {
            expect(await tenantOf()).toBe(B);
          });
          expect(await tenantOf()).toBe(A);
        });
      });

      it('también si el trabajo falla dentro del savepoint', async () => {
        await orm.em.transactional(async (outer) => {
          await applyTenantContext(outer, A);
          await expect(
            orm.em.transactional(async (tx) => {
              await withTenantContext(tx, B, async () => {
                throw new Error('falla');
              });
            }),
          ).rejects.toThrow('falla');
          expect(await tenantOf()).toBe(A);
        });
      });
    });

    describe('N-3: contar y crear es atómico por solicitante', () => {
      const repo = new FourEyesRepository();
      const attempt = (who: string, locked: boolean): Promise<void> =>
        orm.em.fork().transactional(async (tx) => {
          if (locked) await repo.lockRequesterQueue(tx, A, who);
          const rows = await tx.execute<{ n: number }[]>(
            'select count(*)::int as n from public.seg2_queue where requester = ?',
            [who],
          );
          if (rows[0].n >= 10) return;
          // Un respiro entre contar y crear: sin cerrojo todas las peticiones cuentan antes de que otra cree.
          await new Promise((r) => setTimeout(r, 15));
          await tx.execute(
            'insert into public.seg2_queue (requester, n) values (?, 1)',
            [who],
          );
        });
      const total = async (who: string): Promise<number> =>
        (
          await admin.query(
            'select count(*)::int as n from public.seg2_queue where requester = $1',
            [who],
          )
        ).rows[0].n;

      it('SIN el cerrojo 30 peticiones a la vez pasan del tope (el defecto)', async () => {
        await Promise.all(
          Array.from({ length: 30 }, () => attempt('sin-cerrojo', false)),
        );
        expect(await total('sin-cerrojo')).toBeGreaterThan(10);
      });

      it('CON lockRequesterQueue nunca pasan de 10, y otra persona no queda bloqueada por la primera', async () => {
        await Promise.all([
          ...Array.from({ length: 30 }, () => attempt('con-cerrojo', true)),
          ...Array.from({ length: 5 }, () => attempt('otra-persona', true)),
        ]);
        expect(await total('con-cerrojo')).toBe(10);
        expect(await total('otra-persona')).toBe(5);
      });
    });
  },
);
