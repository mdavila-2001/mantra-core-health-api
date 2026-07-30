import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `object_checksums`.
 */
@Entity({ schema: 'object_storage', tableName: 'object_checksums' })
export class ObjectChecksums {
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
   * Valor de algorithm mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  algorithm!: string;

  /**
   * Valor de checksum mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  checksum!: string;

  /**
   * Valor de source mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  source!: string;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @Property({ fieldName: 'verified_at', columnType: 'timestamptz' })
  verifiedAt!: Date;

  /**
   * Valor de verification status mantenido por la instancia.
   */
  @Property({ fieldName: 'verification_status', columnType: 'varchar' })
  verificationStatus!: string;
}
