import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_provenance_records`.
 */
@Entity({ schema: 'health_data', tableName: 'health_provenance_records' })
export class HealthProvenanceRecords {
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
   * Identificador asociado a activity concept.
   */
  @Property({ fieldName: 'activity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  activityConceptId!: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Valor de occurred start at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredStartAt?: Date;

  /**
   * Valor de occurred end at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredEndAt?: Date;

  /**
   * Identificador asociado a source system.
   */
  @Property({ fieldName: 'source_system_id', type: 'uuid', nullable: true }) // FK → health_data.health_source_systems
  sourceSystemId?: string;

  /**
   * Identificador asociado a responsible agent type concept.
   */
  @Property({
    fieldName: 'responsible_agent_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  responsibleAgentTypeConceptId?: string;

  /**
   * Identificador asociado a responsible agent.
   */
  @Property({ fieldName: 'responsible_agent_id', type: 'uuid', nullable: true })
  responsibleAgentId?: string;

  /**
   * Identificador asociado a on behalf of organization.
   */
  @Property({
    fieldName: 'on_behalf_of_organization_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  onBehalfOfOrganizationId?: string;

  /**
   * Valor de policy uris json mantenido por la instancia.
   */
  @Property({
    fieldName: 'policy_uris_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  policyUrisJson?: unknown;

  /**
   * Identificador asociado a signature.
   */
  @Property({ fieldName: 'signature_id', type: 'uuid', nullable: true }) // FK → chart.clinical_note_signatures
  signatureId?: string;

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
