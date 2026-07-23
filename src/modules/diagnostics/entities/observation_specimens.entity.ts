import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'observation_specimens' })
export class ObservationSpecimens {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'observation_id', type: 'uuid' }) // FK → clinical.observations
  observationId!: string;

  @Property({ fieldName: 'specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  specimenId!: string;

  @Property({ fieldName: 'relationship_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationshipConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
