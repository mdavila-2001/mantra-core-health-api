import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `shared_access_link_uses`.
 */
@Entity({ schema: 'delegated_access', tableName: 'shared_access_link_uses' })
export class SharedAccessLinkUses {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a shared access link.
   */
  @Property({ fieldName: 'shared_access_link_id', type: 'uuid' }) // FK → delegated_access.shared_access_links (inferida)
  sharedAccessLinkId!: string;

  /**
   * Identificador asociado a action concept.
   */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  actionConceptId!: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  outcomeConceptId!: string;

  /**
   * Valor de source ip mantenido por la instancia.
   */
  @Property({ fieldName: 'source_ip', columnType: 'inet', nullable: true })
  sourceIp?: string;

  /**
   * Valor de user agent mantenido por la instancia.
   */
  @Property({ fieldName: 'user_agent', columnType: 'varchar', nullable: true })
  userAgent?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
