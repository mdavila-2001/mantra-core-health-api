import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'enterprise_document_flow' })
export class EnterpriseDocumentFlow {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'predecessor_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  predecessorTypeConceptId!: string;

  @Property({ fieldName: 'predecessor_id', type: 'uuid' })
  predecessorId!: string;

  @Property({ fieldName: 'successor_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  successorTypeConceptId!: string;

  @Property({ fieldName: 'successor_id', type: 'uuid' })
  successorId!: string;

  @Property({ fieldName: 'relation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationTypeConceptId!: string;

  @Property({ columnType: 'numeric', nullable: true })
  quantity?: string;

  @Property({ columnType: 'numeric', nullable: true })
  amount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
