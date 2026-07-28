import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `consistency_policies`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'consistency_policies' })
export class ConsistencyPolicies {
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
   * Valor de read consistency mantenido por la instancia.
   */
  @Property({ fieldName: 'read_consistency', columnType: 'varchar' })
  readConsistency!: string;

  /**
   * Valor de write consistency mantenido por la instancia.
   */
  @Property({ fieldName: 'write_consistency', columnType: 'varchar' })
  writeConsistency!: string;

  /**
   * Valor de conflict resolution mantenido por la instancia.
   */
  @Property({ fieldName: 'conflict_resolution', columnType: 'varchar' })
  conflictResolution!: string;

  /**
   * Valor de stale read tolerance seconds mantenido por la instancia.
   */
  @Property({ fieldName: 'stale_read_tolerance_seconds', columnType: 'int' })
  staleReadToleranceSeconds!: number;

  /**
   * Valor de requires read your writes mantenido por la instancia.
   */
  @Property({ fieldName: 'requires_read_your_writes', type: 'boolean' })
  requiresReadYourWrites!: boolean;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
