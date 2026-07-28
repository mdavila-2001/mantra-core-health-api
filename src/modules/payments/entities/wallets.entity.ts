import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `wallets`.
 */
@Entity({ schema: 'payments', tableName: 'wallets' })
export class Wallets {
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
   * Identificador asociado a owner type concept.
   */
  @Property({ fieldName: 'owner_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  ownerTypeConceptId!: string;

  /**
   * Identificador asociado a owner ref.
   */
  @Property({ fieldName: 'owner_ref_id', type: 'uuid' })
  ownerRefId!: string;

  /**
   * Identificador asociado a wallet type concept.
   */
  @Property({ fieldName: 'wallet_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  walletTypeConceptId!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  /**
   * Valor de available balance mantenido por la instancia.
   */
  @Property({
    fieldName: 'available_balance',
    columnType: 'numeric',
    nullable: true,
  })
  availableBalance?: string;

  /**
   * Valor de pending balance mantenido por la instancia.
   */
  @Property({
    fieldName: 'pending_balance',
    columnType: 'numeric',
    nullable: true,
  })
  pendingBalance?: string;

  /**
   * Valor de reserved balance mantenido por la instancia.
   */
  @Property({
    fieldName: 'reserved_balance',
    columnType: 'numeric',
    nullable: true,
  })
  reservedBalance?: string;

  /**
   * Identificador asociado a ledger account.
   */
  @Property({ fieldName: 'ledger_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  ledgerAccountId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
}
