import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_body_sites',
})
export class ProcedureBodySites {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_id', type: 'uuid' }) // FK → clinical.procedures
  procedureId!: string;

  @Property({ fieldName: 'body_site_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  bodySiteConceptId!: string;

  @Property({
    fieldName: 'laterality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  lateralityConceptId?: string;

  @Property({ fieldName: 'role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  roleConceptId!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
