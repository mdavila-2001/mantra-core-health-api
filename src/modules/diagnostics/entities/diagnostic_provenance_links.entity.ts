import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `diagnostic_provenance_links`.
 */
@Entity({ schema: 'diagnostics', tableName: 'diagnostic_provenance_links' })
export class DiagnosticProvenanceLinks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a custodian tenant.
   */
  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  /**
   * Identificador asociado a target type concept.
   */
  @Property({ fieldName: 'target_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetTypeConceptId!: string;

  /**
   * Identificador asociado a target.
   */
  @Property({ fieldName: 'target_id', type: 'uuid' })
  targetId!: string;

  /**
   * Identificador asociado a source type concept.
   */
  @Property({ fieldName: 'source_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceTypeConceptId!: string;

  /**
   * Identificador asociado a source.
   */
  @Property({ fieldName: 'source_id', type: 'uuid' })
  sourceId!: string;

  /**
   * Identificador asociado a activity concept.
   */
  @Property({ fieldName: 'activity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  activityConceptId!: string;

  /**
   * Identificador asociado a agent profile.
   */
  @Property({ fieldName: 'agent_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  agentProfileId?: string;

  /**
   * Identificador asociado a source system.
   */
  @Property({ fieldName: 'source_system_id', type: 'uuid', nullable: true }) // FK → health_data.health_source_systems
  sourceSystemId?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
