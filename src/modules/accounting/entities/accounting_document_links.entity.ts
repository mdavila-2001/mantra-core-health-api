import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `accounting_document_links`.
 */
@Entity({ schema: 'accounting', tableName: 'accounting_document_links' })
export class AccountingDocumentLinks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a source transaction.
   */
  @Property({ fieldName: 'source_transaction_id', type: 'uuid' }) // FK → accounting.journal_transactions
  sourceTransactionId!: string;

  /**
   * Identificador asociado a target transaction.
   */
  @Property({ fieldName: 'target_transaction_id', type: 'uuid' }) // FK → accounting.journal_transactions
  targetTransactionId!: string;

  /**
   * Identificador asociado a relation type concept.
   */
  @Property({ fieldName: 'relation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationTypeConceptId!: string;

  /**
   * Identificador asociado a source line.
   */
  @Property({ fieldName: 'source_line_id', type: 'uuid', nullable: true }) // FK → accounting.accrual_schedule_lines
  sourceLineId?: string;

  /**
   * Identificador asociado a target line.
   */
  @Property({ fieldName: 'target_line_id', type: 'uuid', nullable: true }) // FK → accounting.accrual_schedule_lines
  targetLineId?: string;

  /**
   * Valor de effective at mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveAt?: Date;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'varchar', nullable: true })
  reasonText?: string;

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
