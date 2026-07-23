import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'imaging_selection_items' })
export class ImagingSelectionItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'imaging_selection_id', type: 'uuid' }) // FK → diagnostics.imaging_selections
  imagingSelectionId!: string;

  @Property({ fieldName: 'imaging_series_id', type: 'uuid', nullable: true }) // FK → diagnostics.imaging_series
  imagingSeriesId?: string;

  @Property({ fieldName: 'imaging_instance_id', type: 'uuid', nullable: true }) // FK → diagnostics.imaging_instances
  imagingInstanceId?: string;

  @Property({
    fieldName: 'frames_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  framesJson?: unknown;

  @Property({
    fieldName: 'region_of_interest_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  regionOfInterestJson?: unknown;

  @Property({ fieldName: 'order_index', columnType: 'int', nullable: true })
  orderIndex?: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
