import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `enterprise_document_flow`.
 */
@Entity({ schema: 'erp', tableName: 'enterprise_document_flow' })
export class EnterpriseDocumentFlow {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a predecessor type concept.
   */
  @Property({ fieldName: 'predecessor_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  predecessorTypeConceptId!: string;

  /**
   * Identificador asociado a predecessor.
   */
  @Property({ fieldName: 'predecessor_id', type: 'uuid' })
  predecessorId!: string;

  /**
   * Identificador asociado a successor type concept.
   */
  @Property({ fieldName: 'successor_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  successorTypeConceptId!: string;

  /**
   * Identificador asociado a successor.
   */
  @Property({ fieldName: 'successor_id', type: 'uuid' })
  successorId!: string;

  /**
   * Identificador asociado a relation type concept.
   */
  @Property({ fieldName: 'relation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationTypeConceptId!: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  quantity?: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  amount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
