import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `journal_transactions`.
 */
@Entity({ schema: 'accounting', tableName: 'journal_transactions' })
export class JournalTransactions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  /**
   * Valor de transaction number mantenido por la instancia.
   */
  @Property({ fieldName: 'transaction_number', columnType: 'varchar' })
  transactionNumber!: string;

  /**
   * Identificador asociado a transaction type concept.
   */
  @Property({ fieldName: 'transaction_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  transactionTypeConceptId!: string;

  /**
   * Valor de transaction date mantenido por la instancia.
   */
  @Property({ fieldName: 'transaction_date', columnType: 'date' })
  transactionDate!: Date;

  /**
   * Identificador asociado a fiscal period.
   */
  @Property({ fieldName: 'fiscal_period_id', type: 'uuid', nullable: true }) // FK → accounting.fiscal_periods
  fiscalPeriodId?: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

  /**
   * Valor de reference mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  reference?: string;

  /**
   * Valor de source document type mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_document_type',
    columnType: 'varchar',
    nullable: true,
  })
  sourceDocumentType?: string;

  /**
   * Identificador asociado a source document.
   */
  @Property({ fieldName: 'source_document_id', type: 'uuid', nullable: true })
  sourceDocumentId?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de total amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'total_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalAmount?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de posted at mantenido por la instancia.
   */
  @Property({
    fieldName: 'posted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  postedAt?: Date;

  /**
   * Identificador asociado a posted by user.
   */
  @Property({ fieldName: 'posted_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  postedByUserId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

  /**
   * Valor de approved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

  /**
   * Identificador asociado a approved by user.
   */
  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  approvedByUserId?: string;
}
