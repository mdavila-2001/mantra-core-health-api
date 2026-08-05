import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `canonical_resource_bindings`.
 */
@Entity({ schema: 'health_data', tableName: 'canonical_resource_bindings' })
export class CanonicalResourceBindings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a canonical health resource.
   */
  @Property({ fieldName: 'canonical_health_resource_id', type: 'uuid' }) // FK → health_data.canonical_health_resources
  canonicalHealthResourceId!: string;

  /**
   * Identificador asociado a domain entity type concept.
   */
  @Property({ fieldName: 'domain_entity_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  domainEntityTypeConceptId!: string;

  /**
   * Identificador asociado a domain entity.
   */
  @Property({ fieldName: 'domain_entity_id', type: 'uuid' })
  domainEntityId!: string;

  /**
   * Identificador asociado a binding role concept.
   */
  @Property({ fieldName: 'binding_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  bindingRoleConceptId!: string;

  /**
   * Identificador asociado a binding status concept.
   */
  @Property({ fieldName: 'binding_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  bindingStatusConceptId!: string;

  /**
   * Identificador asociado a mapping version.
   */
  @Property({ fieldName: 'mapping_version_id', type: 'uuid', nullable: true }) // FK → health_data.canonical_health_resource_versions
  mappingVersionId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Valor de ended at mantenido por la instancia.
   */
  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;
}
