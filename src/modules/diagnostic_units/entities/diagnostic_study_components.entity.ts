import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'diagnostic_units',
  tableName: 'diagnostic_study_components',
})
export class DiagnosticStudyComponents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'parent_offering_id', type: 'uuid' }) // FK (destino no resuelto)
  parentOfferingId!: string;

  @Property({ fieldName: 'component_offering_id', type: 'uuid' }) // FK (destino no resuelto)
  componentOfferingId!: string;

  @Property({ fieldName: 'component_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  componentRoleConceptId!: string;

  @Property({ columnType: 'numeric', nullable: true })
  quantity?: string;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
