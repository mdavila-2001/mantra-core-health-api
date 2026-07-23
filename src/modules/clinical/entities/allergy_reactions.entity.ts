import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical', tableName: 'allergy_reactions' })
export class AllergyReactions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'allergy_id', type: 'uuid' }) // FK (destino no resuelto)
  allergyId!: string;

  @Property({ fieldName: 'manifestation_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  manifestationConceptId!: string;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  severityConceptId?: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
