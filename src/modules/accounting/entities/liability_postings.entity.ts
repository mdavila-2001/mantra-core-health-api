import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `liability_postings`.
 */
@Entity({ schema: 'accounting', tableName: 'liability_postings' })
export class LiabilityPostings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a liability.
   */
  @Property({ fieldName: 'liability_id', type: 'uuid' }) // FK → accounting.liabilities
  liabilityId!: string;

  /**
   * Identificador asociado a liability schedule.
   */
  @Property({
    fieldName: 'liability_schedule_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.liability_schedules
  liabilityScheduleId?: string;

  /**
   * Identificador asociado a ledger entry.
   */
  @Property({ fieldName: 'ledger_entry_id', type: 'uuid' }) // FK → accounting.ledger_entries
  ledgerEntryId!: string;

  /**
   * Identificador asociado a component concept.
   */
  @Property({ fieldName: 'component_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  componentConceptId!: string;

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
   * Valor de effective date mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_date', columnType: 'date', nullable: true })
  effectiveDate?: Date;

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
