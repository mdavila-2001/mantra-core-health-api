import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `object_retention_locks`.
 */
@Entity({ schema: 'object_storage', tableName: 'object_retention_locks' })
export class ObjectRetentionLocks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a object version.
   */
  @Property({ fieldName: 'object_version_id', type: 'uuid' })
  objectVersionId!: string;

  /**
   * Valor de lock mode mantenido por la instancia.
   */
  @Property({ fieldName: 'lock_mode', columnType: 'varchar' })
  lockMode!: string;

  /**
   * Valor de retain until mantenido por la instancia.
   */
  @Property({ fieldName: 'retain_until', columnType: 'timestamptz' })
  retainUntil!: Date;

  /**
   * Valor de policy code mantenido por la instancia.
   */
  @Property({ fieldName: 'policy_code', columnType: 'varchar' })
  policyCode!: string;

  /**
   * Valor de applied at mantenido por la instancia.
   */
  @Property({ fieldName: 'applied_at', columnType: 'timestamptz' })
  appliedAt!: Date;

  /**
   * Valor de released at mantenido por la instancia.
   */
  @Property({
    fieldName: 'released_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  releasedAt?: Date;
}
