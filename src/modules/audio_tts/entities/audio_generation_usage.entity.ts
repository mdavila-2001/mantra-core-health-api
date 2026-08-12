import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Consumo facturable por asset (`audio_tts.audio_generation_usage`).
 *
 * Es el registro con el que se concilia la factura del proveedor, y por eso
 * lleva un UNIQUE sobre `asset_id`: cualquier mecanismo de reintento entrega al
 * menos una vez, y sin esa restricción un reproceso insertaría el mismo consumo
 * dos veces e inflaría el gasto declarado sin que nadie hubiese pagado más.
 */
@Entity({ schema: 'audio_tts', tableName: 'audio_generation_usage' })
export class AudioGenerationUsage {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a asset.
   */
  @Property({ fieldName: 'asset_id', type: 'uuid' }) // FK → audio_tts.audio_assets
  assetId!: string;

  /**
   * Valor de provider mantenido por la instancia.
   */
  @Property({ columnType: 'varchar(40)' })
  provider!: string;

  /**
   * Unidades consumidas: las reportadas por el proveedor si las publica, o una
   * estimación por caracteres si no.
   */
  @Property({ fieldName: 'usage_units', columnType: 'int' })
  usageUnits!: number;

  /**
   * Mes de imputación (`YYYY-MM`). Se guarda desnormalizado porque la ventana de
   * presupuesto es mensual y derivarla de `created_at` en cada consulta impediría
   * usar un índice.
   */
  @Property({ fieldName: 'month_key', columnType: 'varchar(7)' })
  monthKey!: string;

  /**
   * Valor de created at mantenido por la instancia.
   */
  @Property({
    fieldName: 'created_at',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  createdAt: Date = new Date();
}
