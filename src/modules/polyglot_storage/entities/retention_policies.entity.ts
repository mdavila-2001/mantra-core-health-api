import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `polyglot_storage_retention_policies`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'retention_policies' })
export class PolyglotStorageRetentionPolicies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de retention days mantenido por la instancia.
   */
  @Property({ fieldName: 'retention_days', columnType: 'int' })
  retentionDays!: number;

  /**
   * Valor de archive after days mantenido por la instancia.
   */
  @Property({ fieldName: 'archive_after_days', columnType: 'int' })
  archiveAfterDays!: number;

  /**
   * Valor de deletion mode mantenido por la instancia.
   */
  @Property({ fieldName: 'deletion_mode', columnType: 'varchar' })
  deletionMode!: string;

  /**
   * Valor de legal hold overrides deletion mantenido por la instancia.
   */
  @Property({ fieldName: 'legal_hold_overrides_deletion', type: 'boolean' })
  legalHoldOverridesDeletion!: boolean;

  /**
   * Valor de jurisdiction code mantenido por la instancia.
   */
  @Property({ fieldName: 'jurisdiction_code', columnType: 'varchar' })
  jurisdictionCode!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
