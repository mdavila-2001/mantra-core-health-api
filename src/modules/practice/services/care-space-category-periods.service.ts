import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

/** Un período de categoría que el cambio cerró. */
export interface ClosedCategoryPeriod {
  /** Período cerrado. */
  readonly id: string;
  /** Desde cuándo valía. */
  readonly validFrom: Date;
}

/** Resultado de {@link CareSpaceCategoryPeriodsService.change}. */
export interface CategoryPeriodChange {
  /** Período que estaba abierto y se cerró; `null` si la cama no tenía ninguno. */
  readonly closed: ClosedCategoryPeriod | null;
  /** Período que se abrió; `null` si la cama dejó de tener categoría. */
  readonly openedId: string | null;
  /** Instante en que rige el cambio (cierra el anterior y abre el nuevo). */
  readonly at: Date;
}

/**
 * Períodos de categoría de cama (`practice.care_space_category_periods`, F5e).
 *
 * La facturación del día-cama cobra la categoría que la cama tenía **en cada
 * medianoche**, no la de hoy. Por eso cada cambio de `bedCategoryCode` cierra el
 * período vigente y abre otro **en la misma transacción** que el `PATCH` (o el
 * alta). La base sólo deja cerrar `valid_to` de un período, nunca reescribirlo ni
 * borrarlo, y un `EXCLUDE` impide que dos períodos de la misma cama se solapen.
 *
 * Se escribe con SQL y no con la entidad: el cierre sólo cambia `valid_to`
 * (guarda del trigger), y así no depende del estado del contexto de persistencia.
 */
@Injectable()
export class CareSpaceCategoryPeriodsService {
  /**
   * Abre el primer período de una cama que nace (o recibe) una categoría.
   *
   * @param tx - Transacción de la mutación que la crea.
   * @param input - Cama, categoría, tenant y desde cuándo.
   * @returns El id del período abierto.
   */
  async open(
    tx: EntityManager,
    input: {
      readonly careSpaceId: string;
      readonly tenantId: string;
      readonly categoryConceptId: string;
      readonly at: Date;
      readonly actorUserId: string;
    },
  ): Promise<string> {
    const rows = await tx.execute<{ id: string }[]>(
      `insert into practice.care_space_category_periods
         (id, tenant_id, care_space_id, bed_category_concept_id, valid_from, valid_to,
          created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
       values (gen_random_uuid(), ?, ?, ?, ?, null, now(), now(), ?, ?, 1)
       returning id`,
      [
        input.tenantId,
        input.careSpaceId,
        input.categoryConceptId,
        input.at,
        input.actorUserId,
        input.actorUserId,
      ],
    );
    return rows[0].id;
  }

  /**
   * Cambia la categoría de una cama: cierra el período abierto y abre otro.
   *
   * El cambio rige desde `at`. Si el período abierto empezó en ese mismo
   * instante (o después, por un reloj atrasado) el cierre se corre un
   * milisegundo, porque la base exige `valid_to > valid_from`.
   *
   * @param tx - Transacción del `PATCH`.
   * @param input - Cama, categoría nueva (`null` la quita), tenant y actor.
   * @returns Qué se cerró y qué se abrió.
   */
  async change(
    tx: EntityManager,
    input: {
      readonly careSpaceId: string;
      readonly tenantId: string;
      readonly categoryConceptId: string | null;
      readonly at: Date;
      readonly actorUserId: string;
    },
  ): Promise<CategoryPeriodChange> {
    const open = await tx.execute<{ id: string; valid_from: Date }[]>(
      `select id, valid_from from practice.care_space_category_periods
        where care_space_id = ? and tenant_id = ? and valid_to is null
        for update`,
      [input.careSpaceId, input.tenantId],
    );
    let at = input.at;
    let closed: ClosedCategoryPeriod | null = null;
    if (open.length > 0) {
      const from = new Date(open[0].valid_from);
      if (at.getTime() <= from.getTime()) at = new Date(from.getTime() + 1);
      await tx.execute(
        `update practice.care_space_category_periods
            set valid_to = ?, updated_at = now(), updated_by_user_id = ?, row_version = row_version + 1
          where id = ?`,
        [at, input.actorUserId, open[0].id],
      );
      closed = { id: open[0].id, validFrom: from };
    }
    const openedId =
      input.categoryConceptId === null
        ? null
        : await this.open(tx, {
            careSpaceId: input.careSpaceId,
            tenantId: input.tenantId,
            categoryConceptId: input.categoryConceptId,
            at,
            actorUserId: input.actorUserId,
          });
    return { closed, openedId, at };
  }
}
