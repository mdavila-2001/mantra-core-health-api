import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Presupuesto mensual por proveedor (`audio_tts.audio_budget_month`).
 *
 * La contabilidad tiene dos columnas y no una porque el control de gasto se hace
 * **al autorizar**, no al pagar: `reserved_units` aparta la cuota antes de llamar
 * al proveedor y `settled_units` registra lo que de verdad se consumió. Leer un
 * `SUM(usage)` y decidir en la aplicación deja una ventana en la que N
 * peticiones concurrentes leen el mismo total y todas se autorizan; con la
 * reserva, el `WHERE` del `ON CONFLICT DO UPDATE` rechaza la que no cabe.
 *
 * La clave primaria es `provider:monthKey` como texto en vez de una clave
 * compuesta: el `ON CONFLICT` necesita apuntar a una restricción única, y este
 * modelo mantiene una sola columna de PK por tabla en las 1159 entidades.
 */
@Entity({ schema: 'audio_tts', tableName: 'audio_budget_month' })
export class AudioBudgetMonth {
  /**
   * Clave compuesta `provider:monthKey`.
   */
  @PrimaryKey({ columnType: 'varchar(60)' })
  key!: string;

  /**
   * Valor de provider mantenido por la instancia.
   */
  @Property({ columnType: 'varchar(40)' })
  provider!: string;

  /**
   * Mes de la ventana (`YYYY-MM`).
   */
  @Property({ fieldName: 'month_key', columnType: 'varchar(7)' })
  monthKey!: string;

  /**
   * Unidades apartadas y aún no consumidas.
   */
  @Property({ fieldName: 'reserved_units', columnType: 'int', default: 0 })
  reservedUnits: number = 0;

  /**
   * Unidades ya consumidas y confirmadas.
   */
  @Property({ fieldName: 'settled_units', columnType: 'int', default: 0 })
  settledUnits: number = 0;
}
