import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'accounting_document_links' })
export class AccountingDocumentLinks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'source_transaction_id', type: 'uuid' }) // FK (destino no resuelto)
  sourceTransactionId!: string;

  @Property({ fieldName: 'target_transaction_id', type: 'uuid' }) // FK (destino no resuelto)
  targetTransactionId!: string;

  @Property({ fieldName: 'relation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationTypeConceptId!: string;

  @Property({ fieldName: 'source_line_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  sourceLineId?: string;

  @Property({ fieldName: 'target_line_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  targetLineId?: string;

  @Property({
    fieldName: 'effective_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveAt?: Date;

  @Property({ fieldName: 'reason_text', columnType: 'varchar', nullable: true })
  reasonText?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
