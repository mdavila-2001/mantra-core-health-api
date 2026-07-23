import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'specimen_processing_steps' })
export class SpecimenProcessingSteps {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  specimenId!: string;

  @Property({ fieldName: 'procedure_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  procedureConceptId!: string;

  @Property({ fieldName: 'additive_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  additiveConceptId?: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({
    fieldName: 'performed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  performedAt?: Date;

  @Property({ fieldName: 'performer_profile_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  performerProfileId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
