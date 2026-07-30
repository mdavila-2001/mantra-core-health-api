import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `deletion_verifications`.
 */
@Entity({
  schema: 'cross_store_consistency',
  tableName: 'deletion_verifications',
})
export class DeletionVerifications {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a deletion target.
   */
  @Property({ fieldName: 'deletion_target_id', type: 'uuid' })
  deletionTargetId!: string;

  /**
   * Valor de verification method mantenido por la instancia.
   */
  @Property({ fieldName: 'verification_method', columnType: 'varchar' })
  verificationMethod!: string;

  /**
   * Valor de verified absent mantenido por la instancia.
   */
  @Property({ fieldName: 'verified_absent', type: 'boolean' })
  verifiedAbsent!: boolean;

  /**
   * Valor de residual reference count mantenido por la instancia.
   */
  @Property({ fieldName: 'residual_reference_count', columnType: 'int' })
  residualReferenceCount!: number;

  /**
   * Identificador asociado a evidence object.
   */
  @Property({ fieldName: 'evidence_object_id', type: 'uuid' })
  evidenceObjectId!: string;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @Property({ fieldName: 'verified_at', columnType: 'timestamptz' })
  verifiedAt!: Date;
}
