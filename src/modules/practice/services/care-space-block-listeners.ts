import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { BlockRow, SpaceOpsRow } from './ops-rows';

/**
 * Token del registro de oyentes del ciclo de vida de los bloqueos de un espacio.
 *
 * Una franja que tiene que reaccionar en la **misma transacción** a que un espacio se bloquee
 * o se libere (la agenda cierra los cupos, F5d) inyecta el registro con este token y se anota
 * en `onModuleInit`; no se edita `CareSpaceBlocksService`. Es el mismo patrón que
 * `RETIRE_BLOCKER_PROVIDERS`: `practice` no conoce a quien lo escucha.
 */
export const CARE_SPACE_BLOCK_LISTENERS = 'PRACTICE_CARE_SPACE_BLOCK_LISTENERS';

/** Cómo terminó un bloqueo. */
export type BlockOutcome = 'ENDED' | 'CANCELLED';

/** Quién y cuándo provocó el cambio. */
export interface BlockListenerContext {
  readonly tenantId: string;
  readonly actorUserId: string | null;
  readonly requestId?: string | null;
  readonly now: Date;
}

/** Oyente del ciclo de vida de los bloqueos. Corre dentro de la transacción del bloqueo. */
export interface CareSpaceBlockListener {
  /** El bloqueo se creó (ya rija o quede programado). */
  afterCreated(
    tx: EntityManager,
    block: BlockRow,
    space: SpaceOpsRow,
    context: BlockListenerContext,
  ): Promise<void>;

  /** El bloqueo terminó (`ENDED`, ya había empezado) o se canceló (`CANCELLED`). */
  afterClosed(
    tx: EntityManager,
    block: BlockRow,
    space: SpaceOpsRow,
    outcome: BlockOutcome,
    context: BlockListenerContext,
  ): Promise<void>;
}

/** Registro de oyentes (único por nombre: registrar de nuevo reemplaza). */
@Injectable()
export class CareSpaceBlockListenerRegistry {
  private readonly listeners = new Map<string, CareSpaceBlockListener>();

  /**
   * Agrega (o reemplaza) un oyente.
   *
   * @param name - Nombre estable de quien escucha.
   * @param listener - El oyente.
   */
  register(name: string, listener: CareSpaceBlockListener): void {
    this.listeners.set(name, listener);
  }

  /** Avisa que un bloqueo se creó; los oyentes corren en orden de alta. */
  async created(
    tx: EntityManager,
    block: BlockRow,
    space: SpaceOpsRow,
    context: BlockListenerContext,
  ): Promise<void> {
    for (const listener of this.listeners.values()) {
      await listener.afterCreated(tx, block, space, context);
    }
  }

  /** Avisa que un bloqueo terminó o se canceló. */
  async closed(
    tx: EntityManager,
    block: BlockRow,
    space: SpaceOpsRow,
    outcome: BlockOutcome,
    context: BlockListenerContext,
  ): Promise<void> {
    for (const listener of this.listeners.values()) {
      await listener.afterClosed(tx, block, space, outcome, context);
    }
  }
}
