import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'specimen_parent_links' })
export class SpecimenParentLinks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'child_specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  childSpecimenId!: string;

  @Property({ fieldName: 'parent_specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  parentSpecimenId!: string;

  @Property({ fieldName: 'relationship_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationshipTypeConceptId!: string;

  @Property({
    fieldName: 'quantity_decimal',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  quantityDecimal?: string;

  @Property({
    fieldName: 'quantity_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  quantityUnitConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
