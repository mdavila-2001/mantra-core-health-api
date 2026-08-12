import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  AudioActorGenerationDaily,
  AudioBudgetMonth,
  AudioGenerationUsage,
} from '../entities';

export interface BudgetWindow {
  provider: string;
  monthKey: string;
}

export interface BudgetSnapshot {
  reservedUnits: number;
  settledUnits: number;
}

/**
 * Contabilidad del gasto en síntesis.
 *
 * Todas las decisiones de "¿cabe?" ocurren dentro de una sola sentencia SQL. Ese
 * es el punto entero de este repositorio: la versión ingenua —leer el total
 * consumido, compararlo con el presupuesto y luego insertar— deja una ventana en
 * la que N peticiones concurrentes leen el mismo total y todas se autorizan. Con
 * el límite en el `WHERE` del `ON CONFLICT DO UPDATE`, la que no cabe no
 * actualiza y no devuelve filas: cero filas **es** la denegación.
 */
@Injectable()
export class AudioQuotaRepository {
  /**
   * Aparta unidades del presupuesto del mes.
   *
   * @param usableUnits presupuesto mensual menos el colchón de seguridad.
   * @returns `false` si no cabe. No lanza: quedarse sin presupuesto es una
   *          decisión de negocio esperada, no un error.
   */
  async reserveBudget(
    em: EntityManager,
    window: BudgetWindow,
    units: number,
    usableUnits: number,
  ): Promise<boolean> {
    // Un texto vacío no consume nada; y una petición que por sí sola no cabe en
    // el presupuesto entero no tiene por qué tocar la base para saberlo.
    if (units <= 0) return true;
    if (units > usableUnits) return false;

    const rows = await em.getConnection().execute<{ reserved_units: number }[]>(
      `INSERT INTO audio_tts.audio_budget_month
         (key, provider, month_key, reserved_units, settled_units)
       VALUES (?, ?, ?, ?, 0)
       ON CONFLICT (key) DO UPDATE
          SET reserved_units = audio_budget_month.reserved_units + ?
        WHERE audio_budget_month.reserved_units
            + audio_budget_month.settled_units
            + ? <= ?
       RETURNING reserved_units`,
      [
        budgetKey(window),
        window.provider,
        window.monthKey,
        units,
        units,
        units,
        usableUnits,
      ],
      'all',
      em.getTransactionContext(),
    );
    return (rows?.length ?? 0) > 0;
  }

  /**
   * Convierte una reserva en consumo real.
   *
   * `GREATEST(0, …)` protege la invariante `reserved_units >= 0` frente a una
   * doble liquidación: sin él, el CHECK de la columna abortaría la transacción
   * que acaba de terminar una generación correcta.
   */
  async settleBudget(
    em: EntityManager,
    window: BudgetWindow,
    reservedUnits: number,
    actualUnits: number,
  ): Promise<void> {
    await em.getConnection().execute(
      `UPDATE audio_tts.audio_budget_month
          SET reserved_units = GREATEST(0, reserved_units - ?),
              settled_units = settled_units + ?
        WHERE key = ?`,
      [reservedUnits, actualUnits, budgetKey(window)],
      'run',
      em.getTransactionContext(),
    );
  }

  /** Devuelve unidades reservadas que nunca llegaron a gastarse. */
  async releaseBudget(
    em: EntityManager,
    window: BudgetWindow,
    units: number,
  ): Promise<void> {
    if (units <= 0) return;
    await em.getConnection().execute(
      `UPDATE audio_tts.audio_budget_month
          SET reserved_units = GREATEST(0, reserved_units - ?)
        WHERE key = ?`,
      [units, budgetKey(window)],
      'run',
      em.getTransactionContext(),
    );
  }

  async readBudget(
    em: EntityManager,
    window: BudgetWindow,
  ): Promise<BudgetSnapshot> {
    const row = await em.findOne(AudioBudgetMonth, { key: budgetKey(window) });
    return {
      reservedUnits: row?.reservedUnits ?? 0,
      settledUnits: row?.settledUnits ?? 0,
    };
  }

  /**
   * Consume una unidad del cupo diario del actor.
   *
   * @param limit techo diario. **`0` deniega**: el llamador que quiera cupo
   *        ilimitado no debe llamar a este método.
   * @returns `false` si el actor alcanzó su límite.
   */
  async claimActorGeneration(
    em: EntityManager,
    actorId: string,
    dayKey: string,
    limit: number,
  ): Promise<boolean> {
    if (limit <= 0) return false;
    const rows = await em
      .getConnection()
      .execute<{ generation_count: number }[]>(
        `INSERT INTO audio_tts.audio_actor_generation_daily
         (key, actor_id, day_key, generation_count)
       VALUES (?, ?, ?, 1)
       ON CONFLICT (key) DO UPDATE
          SET generation_count = audio_actor_generation_daily.generation_count + 1
        WHERE audio_actor_generation_daily.generation_count < ?
       RETURNING generation_count`,
        [actorKey(actorId, dayKey), actorId, dayKey, limit],
        'all',
        em.getTransactionContext(),
      );
    return (rows?.length ?? 0) > 0;
  }

  /**
   * Devuelve al actor el cupo de una generación que no llegó a ocurrir.
   *
   * El `> 0` del `WHERE` no es defensivo por costumbre: sin él, una compensación
   * repetida dejaría el contador en negativo y el CHECK de la columna abortaría
   * la operación que la provocó.
   */
  async releaseActorGeneration(
    em: EntityManager,
    actorId: string,
    dayKey: string,
  ): Promise<void> {
    await em.getConnection().execute(
      `UPDATE audio_tts.audio_actor_generation_daily
          SET generation_count = generation_count - 1
        WHERE key = ? AND generation_count > 0`,
      [actorKey(actorId, dayKey)],
      'run',
      em.getTransactionContext(),
    );
  }

  async actorGenerationCount(
    em: EntityManager,
    actorId: string,
    dayKey: string,
  ): Promise<number> {
    const row = await em.findOne(AudioActorGenerationDaily, {
      key: actorKey(actorId, dayKey),
    });
    return row?.generationCount ?? 0;
  }

  /**
   * Consumo realmente imputado en la ventana, leído de `audio_generation_usage`.
   *
   * No es lo mismo que `settled_units` del presupuesto, y por eso existen los dos:
   * el presupuesto es un **contador agregado** que se mueve con cada liquidación,
   * y esta suma es el **detalle por asset**, con un único por `asset_id`. Cuando
   * dejan de coincidir, la diferencia es la señal de que una liquidación se aplicó
   * sin su registro de consumo (o al revés), que es justo lo que hay que detectar
   * antes de conciliar contra la factura del proveedor.
   */
  async monthlyUsage(
    em: EntityManager,
    window: BudgetWindow,
  ): Promise<{ records: number; units: number }> {
    const rows = await em.find(AudioGenerationUsage, {
      provider: window.provider,
      monthKey: window.monthKey,
    });
    return {
      records: rows.length,
      units: rows.reduce((total, row) => total + row.usageUnits, 0),
    };
  }

  /**
   * Retención del contador por actor.
   *
   * La tabla contiene identificadores de personas, así que no puede crecer sin
   * fin: el cupo de ayer no tiene ningún valor operativo pasada la ventana.
   *
   * @returns filas borradas.
   */
  async purgeActorDailyBefore(
    em: EntityManager,
    dayKey: string,
  ): Promise<number> {
    const rows = await em.getConnection().execute<{ key: string }[]>(
      `DELETE FROM audio_tts.audio_actor_generation_daily
        WHERE day_key < ?
       RETURNING key`,
      [dayKey],
      'all',
      em.getTransactionContext(),
    );
    return rows?.length ?? 0;
  }
}

/** Clave de la ventana de presupuesto: `proveedor:YYYY-MM`. */
export function budgetKey(window: BudgetWindow): string {
  return `${window.provider}:${window.monthKey}`;
}

/** Clave del contador diario: `actor:YYYY-MM-DD`. */
export function actorKey(actorId: string, dayKey: string): string {
  return `${actorId}:${dayKey}`;
}
