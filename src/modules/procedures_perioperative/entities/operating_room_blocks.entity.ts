import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `operating_room_blocks`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'operating_room_blocks',
})
export class OperatingRoomBlocks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a series.
   */
  @Property({ fieldName: 'series_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  seriesId?: string;

  /**
   * Identificador asociado a operating room.
   */
  @Property({ fieldName: 'operating_room_id', type: 'uuid' }) // FK (destino no resuelto)
  operatingRoomId!: string;

  /**
   * Identificador asociado a owner kind concept.
   */
  @Property({ fieldName: 'owner_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  ownerKindConceptId!: string;

  /**
   * Identificador asociado a clinical unit.
   */
  @Property({ fieldName: 'clinical_unit_id', type: 'uuid', nullable: true }) // FK → practice.clinical_units (inferida)
  clinicalUnitId?: string;

  /**
   * Identificador asociado a surgical specialty concept.
   */
  @Property({
    fieldName: 'surgical_specialty_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  surgicalSpecialtyConceptId?: string;

  /**
   * Identificador asociado a surgeon profile.
   */
  @Property({ fieldName: 'surgeon_profile_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  surgeonProfileId?: string;

  /**
   * Valor de starts at mantenido por la instancia.
   */
  @Property({ fieldName: 'starts_at', columnType: 'timestamptz' })
  startsAt!: Date;

  /**
   * Valor de ends at mantenido por la instancia.
   */
  @Property({ fieldName: 'ends_at', columnType: 'timestamptz' })
  endsAt!: Date;

  /**
   * Valor de release at mantenido por la instancia.
   */
  @Property({ fieldName: 'release_at', columnType: 'timestamptz' })
  releaseAt!: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Valor de released at mantenido por la instancia.
   */
  @Property({
    fieldName: 'released_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  releasedAt?: Date;

  /**
   * Identificador asociado a released by user.
   */
  @Property({ fieldName: 'released_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  releasedByUserId?: string;

  /**
   * Valor de release reason mantenido por la instancia.
   */
  @Property({ fieldName: 'release_reason', columnType: 'text', nullable: true })
  releaseReason?: string;

  /**
   * Valor de released minutes mantenido por la instancia.
   */
  @Property({
    fieldName: 'released_minutes',
    columnType: 'int',
    nullable: true,
  })
  releasedMinutes?: number;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
