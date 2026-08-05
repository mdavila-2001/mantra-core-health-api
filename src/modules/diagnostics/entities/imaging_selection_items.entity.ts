import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `imaging_selection_items`.
 */
@Entity({ schema: 'diagnostics', tableName: 'imaging_selection_items' })
export class ImagingSelectionItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a imaging selection.
   */
  @Property({ fieldName: 'imaging_selection_id', type: 'uuid' }) // FK → diagnostics.imaging_selections
  imagingSelectionId!: string;

  /**
   * Identificador asociado a imaging series.
   */
  @Property({ fieldName: 'imaging_series_id', type: 'uuid', nullable: true }) // FK → diagnostics.imaging_series
  imagingSeriesId?: string;

  /**
   * Identificador asociado a imaging instance.
   */
  @Property({ fieldName: 'imaging_instance_id', type: 'uuid', nullable: true }) // FK → diagnostics.imaging_instances
  imagingInstanceId?: string;

  /**
   * Valor de frames json mantenido por la instancia.
   */
  @Property({
    fieldName: 'frames_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  framesJson?: unknown;

  /**
   * Valor de region of interest json mantenido por la instancia.
   */
  @Property({
    fieldName: 'region_of_interest_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  regionOfInterestJson?: unknown;

  /**
   * Valor de order index mantenido por la instancia.
   */
  @Property({ fieldName: 'order_index', columnType: 'int', nullable: true })
  orderIndex?: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
