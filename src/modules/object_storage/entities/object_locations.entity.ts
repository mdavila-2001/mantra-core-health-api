import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `object_locations`.
 */
@Entity({ schema: 'object_storage', tableName: 'object_locations' })
export class ObjectLocations {
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
   * Identificador asociado a namespace.
   */
  @Property({ fieldName: 'namespace_id', type: 'uuid' })
  namespaceId!: string;

  /**
   * Valor de placement role mantenido por la instancia.
   */
  @Property({ fieldName: 'placement_role', columnType: 'varchar' })
  placementRole!: string;

  /**
   * Valor de provider uri mantenido por la instancia.
   */
  @Property({ fieldName: 'provider_uri', columnType: 'varchar' })
  providerUri!: string;

  /**
   * Valor de storage class mantenido por la instancia.
   */
  @Property({ fieldName: 'storage_class', columnType: 'varchar' })
  storageClass!: string;

  /**
   * Valor de replication state mantenido por la instancia.
   */
  @Property({ fieldName: 'replication_state', columnType: 'varchar' })
  replicationState!: string;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @Property({
    fieldName: 'verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;
}
