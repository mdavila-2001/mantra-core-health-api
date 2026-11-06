import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `care_space_status_events`.
 */
@Entity({ schema: 'practice', tableName: 'care_space_status_events' })
export class CareSpaceStatusEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a practice site.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites (inferida)
  practiceSiteId!: string;

  /**
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid' }) // FK → practice.care_spaces (inferida)
  careSpaceId!: string;

  /**
   * Identificador asociado a axis concept.
   */
  @Property({ fieldName: 'axis_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  axisConceptId!: string;

  /**
   * Identificador asociado a from concept.
   */
  @Property({ fieldName: 'from_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  fromConceptId?: string;

  /**
   * Identificador asociado a to concept.
   */
  @Property({ fieldName: 'to_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  toConceptId!: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  reasonConceptId?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'varchar', nullable: true })
  reasonText?: string;

  /**
   * Valor de expected until mantenido por la instancia.
   */
  @Property({
    fieldName: 'expected_until',
    columnType: 'timestamptz',
    nullable: true,
  })
  expectedUntil?: Date;

  /**
   * Valor de v20116 code mantenido por la instancia.
   */
  @Property({ fieldName: 'v2_0116_code', columnType: 'char(1)' })
  v20116Code!: string;

  /**
   * Identificador asociado a source concept.
   */
  @Property({ fieldName: 'source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  sourceConceptId!: string;

  /**
   * Identificador asociado a source ref.
   */
  @Property({ fieldName: 'source_ref_id', type: 'uuid', nullable: true })
  sourceRefId?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  recordedByUserId?: string;

  /**
   * Identificador asociado a request.
   */
  @Property({ fieldName: 'request_id', columnType: 'varchar', nullable: true })
  requestId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
