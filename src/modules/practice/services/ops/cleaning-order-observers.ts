import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { CleaningOrders } from '../../entities';
import type { CleaningTypeCode } from '../../domain/ops/ops-catalog';
import type { OpsEventType } from './ops-events';

/** Lo que recibe un observador de una transición de orden. */
export interface CleaningOrderTransitionNotice {
  readonly eventType: OpsEventType;
  readonly order: Readonly<CleaningOrders>;
  readonly cleaningType: CleaningTypeCode;
  readonly actorUserId?: string;
  readonly requestId?: string;
}

/** Observador: corre en la misma transacción que la transición. */
export type CleaningOrderObserver = (
  tx: EntityManager,
  notice: CleaningOrderTransitionNotice,
) => Promise<void>;

/**
 * Observadores de las transiciones de órdenes de limpieza (§F4.3 «Limpieza
 * de quirófano»: periop registra el suyo para escribir `OR_EVENT_CLEANUP_*` y
 * `OR_EVENT_ROOM_READY` con datos reales). Corren **dentro** de la transacción
 * de la orden: si el observador falla, la transición se revierte.
 * `practice` no importa a quien observa.
 */
@Injectable()
export class CleaningOrderObservers {
  private readonly observers: CleaningOrderObserver[] = [];

  /**
   * Registra un observador.
   *
   * @param observer - Función a llamar en cada transición.
   */
  register(observer: CleaningOrderObserver): void {
    this.observers.push(observer);
  }

  /**
   * Avisa a los observadores.
   *
   * @param tx - Transacción de la orden.
   * @param notice - Transición.
   */
  async notify(
    tx: EntityManager,
    notice: CleaningOrderTransitionNotice,
  ): Promise<void> {
    for (const observer of this.observers) await observer(tx, notice);
  }
}
