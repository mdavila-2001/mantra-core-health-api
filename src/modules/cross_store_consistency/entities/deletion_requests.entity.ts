import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `deletion_requests`.
 */
@Entity({ schema: 'cross_store_consistency', tableName: 'deletion_requests' })
export class DeletionRequests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Valor de subject type mantenido por la instancia.
   */
  @Property({ fieldName: 'subject_type', columnType: 'varchar' })
  subjectType!: string;

  /**
   * Identificador asociado a subject.
   */
  @Property({ fieldName: 'subject_id', type: 'uuid' })
  subjectId!: string;

  /**
   * Valor de reason code mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_code', columnType: 'varchar' })
  reasonCode!: string;

  /**
   * Valor de legal basis code mantenido por la instancia.
   */
  @Property({ fieldName: 'legal_basis_code', columnType: 'varchar' })
  legalBasisCode!: string;

  /**
   * Identificador asociado a requested by user.
   */
  @Property({ fieldName: 'requested_by_user_id', type: 'uuid' })
  requestedByUserId!: string;

  /**
   * Valor de requested at mantenido por la instancia.
   */
  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz' })
  dueAt!: Date;
}
