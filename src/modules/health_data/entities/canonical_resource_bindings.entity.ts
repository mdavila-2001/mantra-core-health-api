import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'canonical_resource_bindings' })
export class CanonicalResourceBindings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'canonical_health_resource_id', type: 'uuid' }) // FK → health_data.canonical_health_resources
  canonicalHealthResourceId!: string;

  @Property({ fieldName: 'domain_entity_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  domainEntityTypeConceptId!: string;

  @Property({ fieldName: 'domain_entity_id', type: 'uuid' })
  domainEntityId!: string;

  @Property({ fieldName: 'binding_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  bindingRoleConceptId!: string;

  @Property({ fieldName: 'binding_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  bindingStatusConceptId!: string;

  @Property({ fieldName: 'mapping_version_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  mappingVersionId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;
}
