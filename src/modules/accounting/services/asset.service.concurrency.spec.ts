import { jest } from '@jest/globals';
import { LockMode } from '@mikro-orm/core';

/** Ver `asset.service.spec.ts`: mismo envoltorio de `jest.fn` sin tipar. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AssetService } from './asset.service';
import { AssetRepository } from '../repositories/asset.repository';
import { ACCT } from '../accounting.concepts';
import { Assets, AssetDepreciations } from '../entities';
import { PreconditionFailedException } from '../../../common';

/**
 * T26 · AC-26-5 — dos corridas de depreciación **concurrentes** sobre el mismo
 * (activo, periodo) deben dejar UNA sola `asset_depreciations` y UN solo
 * posteo.
 *
 * ## Qué se simula y qué no
 *
 * No hay Postgres en la capa unitaria, así que la base se simula con lo mínimo
 * que decide el resultado de la carrera: (1) `SELECT … FOR UPDATE` como un
 * cerrojo por fila que se libera al confirmar la transacción, (2) lecturas que
 * sólo ven lo ya confirmado por otras transacciones (READ COMMITTED) y (3)
 * un punto de espera real entre la comprobación y la escritura (el posteo),
 * que es donde la carrera se cuela. El repositorio es el **real**
 * (`AssetRepository`): lo que se prueba es que el servicio pide el bloqueo y
 * que lo pide **antes** de comprobar la depreciación.
 *
 * El control negativo (sin `FOR UPDATE`) demuestra que el arnés detecta la
 * carrera: con el mismo arnés y sin bloqueo salen dos filas.
 */

interface Tx {
  readonly staged: Array<{ assetId: string; fiscalPeriodId: string }>;
  readonly releases: Array<() => void>;
}

/** Una base mínima con cerrojos por fila y confirmación al cerrar la transacción. */
class FakeDb {
  readonly committed: Array<{ assetId: string; fiscalPeriodId: string }> = [];
  private readonly tails = new Map<string, Promise<void>>();

  constructor(private readonly assets: Assets[]) {}

  /** Toma el cerrojo de una fila; quien lo tenga lo suelta al confirmar. */
  private async lock(rowId: string, tx: Tx): Promise<void> {
    const previo = this.tails.get(rowId) ?? Promise.resolve();
    let liberar!: () => void;
    const mio = new Promise<void>((resolve) => (liberar = resolve));
    this.tails.set(
      rowId,
      previo.then(() => mio),
    );
    await previo;
    tx.releases.push(liberar);
  }

  /** El `EntityManager` de una transacción. */
  tx(): Tx & Record<string, any> {
    const tx: Tx & Record<string, any> = {
      staged: [],
      releases: [],
      find: async (entity: unknown, where: any, opts: any = {}) => {
        if (entity !== Assets) throw new Error('find inesperado');
        const filas = this.assets.filter(
          (a) =>
            a.practiceId === where.practiceId &&
            a.statusConceptId === where.statusConceptId &&
            (!where.id || a.id === where.id),
        );
        if (opts.lockMode === LockMode.PESSIMISTIC_WRITE) {
          for (const fila of filas) await this.lock(fila.id, tx);
        }
        return filas;
      },
      findOne: async (entity: unknown, where: any) => {
        if (entity !== AssetDepreciations)
          throw new Error('findOne inesperado');
        const visibles = [...this.committed, ...tx.staged];
        return (
          visibles.find(
            (d) =>
              d.assetId === where.assetId &&
              d.fiscalPeriodId === where.fiscalPeriodId,
          ) ?? null
        );
      },
      create: (entity: unknown, data: any) => {
        if (entity === AssetDepreciations) {
          tx.staged.push({
            assetId: data.assetId,
            fiscalPeriodId: data.fiscalPeriodId,
          });
        }
        return data;
      },
      flush: async () => undefined,
    };
    return tx;
  }

  /** `em.transactional`: confirma lo preparado y suelta los cerrojos al salir. */
  transactional = async (cb: (tx: any) => Promise<unknown>) => {
    const tx = this.tx();
    try {
      return await cb(tx);
    } finally {
      // Si el caso de uso lanzó, no hay nada confirmable: `staged` queda
      // vacío porque el servicio no llega a `create` sin depreciar.
      this.committed.push(...tx.staged);
      for (const liberar of tx.releases) liberar();
    }
  };
}

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

const runDto = {
  practiceId: 'p1',
  fiscalPeriodId: 'fp-2026-09',
  depreciationExpenseAccountId: 'exp',
  accumulatedDepreciationAccountId: 'acc',
  postingDate: '2026-09-30',
};

function activo(): Assets {
  return {
    id: 'as1',
    practiceId: 'p1',
    code: 'AST-1',
    statusConceptId: ACCT.ASSET_ACTIVE,
    usefulLifeMonths: 60,
    acquisitionCost: '12000.00',
    salvageValue: '0',
    bookValue: '12000.00',
    accumulatedDepreciation: '0',
    updatedAt: new Date(),
  } as unknown as Assets;
}

function build(repo: AssetRepository) {
  const db = new FakeDb([activo()]);
  const posting = {
    // El posteo cede el turno: es la ventana real entre "comprobé que no
    // existe" y "escribí", por donde entra la segunda corrida si nada la
    // frena.
    post: mockFn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      return { transactionId: `tx-${Math.random()}`, entryIds: ['e1', 'e2'] };
    }),
    generateNumber: mockFn(() => 'DEP-1'),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new AssetService(
    { transactional: db.transactional } as any,
    repo,
    posting as any,
    logger as any,
  );
  return { db, posting, service };
}

describe('AssetService.runDepreciation — dos corridas concurrentes (AC-26-5)', () => {
  it('con FOR UPDATE se serializan: la segunda espera, relee y omite → una sola depreciación y un solo posteo', async () => {
    const d = build(new AssetRepository());

    const resultados = await Promise.allSettled([
      d.service.runDepreciation(runDto, actor),
      d.service.runDepreciation(runDto, actor),
    ]);

    // Una corrida depreció; la otra, al releer tras el cerrojo, no encontró
    // nada elegible y respondió como responde hoy el disparo manual (422).
    const ok = resultados.filter((r) => r.status === 'fulfilled');
    const ko = resultados.filter((r) => r.status === 'rejected');
    expect(ok).toHaveLength(1);
    expect(ko).toHaveLength(1);
    expect((ko[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      PreconditionFailedException,
    );

    // Lo observable en la base: una fila por (activo, periodo) y un posteo.
    expect(d.db.committed).toEqual([
      { assetId: 'as1', fiscalPeriodId: 'fp-2026-09' },
    ]);
    expect(d.posting.post).toHaveBeenCalledTimes(1);
  });

  it('control negativo: sin FOR UPDATE, el mismo arnés deja dos filas y dos posteos', async () => {
    /** El repositorio real, pero pidiendo los activos sin bloqueo. */
    class RepoSinLock extends AssetRepository {
      override activeAssets(
        em: any,
        practiceId: string,
        statusConceptId: string,
        options: { assetId?: string; forUpdate?: boolean } = {},
      ) {
        return super.activeAssets(em, practiceId, statusConceptId, {
          ...options,
          forUpdate: false,
        });
      }
    }
    const d = build(new RepoSinLock());

    await Promise.all([
      d.service.runDepreciation(runDto, actor),
      d.service.runDepreciation(runDto, actor),
    ]);

    expect(d.db.committed).toHaveLength(2);
    expect(d.posting.post).toHaveBeenCalledTimes(2);
  });

  it('el bloqueo se acota al activo pedido cuando la corrida es de un solo activo', async () => {
    const repo = new AssetRepository();
    const find = mockFn(async () => []);
    await repo.activeAssets({ find } as any, 'p1', ACCT.ASSET_ACTIVE, {
      assetId: 'as1',
      forUpdate: true,
    });
    expect(find).toHaveBeenCalledWith(
      Assets,
      { practiceId: 'p1', statusConceptId: ACCT.ASSET_ACTIVE, id: 'as1' },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  });
});
