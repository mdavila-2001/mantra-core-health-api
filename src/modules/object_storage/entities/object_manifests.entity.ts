import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `object_manifests`.
 */
@Entity({ schema: 'object_storage', tableName: 'object_manifests' })
export class ObjectManifests {
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
   * Identificador asociado a namespace.
   */
  @Property({ fieldName: 'namespace_id', type: 'uuid' })
  namespaceId!: string;

  /**
   * Identificador asociado a logical object.
   */
  @Property({ fieldName: 'logical_object_id', type: 'uuid' })
  logicalObjectId!: string;

  /**
   * Valor de object type mantenido por la instancia.
   */
  @Property({ fieldName: 'object_type', columnType: 'varchar' })
  objectType!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true })
  patientProfileId?: string;

  /**
   * Identificador asociado a current version.
   */
  @Property({ fieldName: 'current_version_id', type: 'uuid', nullable: true })
  currentVersionId?: string;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;

  /**
   * Valor de retention policy code mantenido por la instancia.
   */
  @Property({
    fieldName: 'retention_policy_code',
    columnType: 'varchar',
    nullable: true,
  })
  retentionPolicyCode?: string;

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
}
