import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `operating_room_block_series`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'operating_room_block_series',
})
export class OperatingRoomBlockSeries {
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
   * Identificador asociado a practice site.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites (inferida)
  practiceSiteId!: string;

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
   * Valor de weekdays mantenido por la instancia.
   */
  @Property({ type: 'array' })
  weekdays!: string[];

  /**
   * Valor de start time mantenido por la instancia.
   */
  @Property({ fieldName: 'start_time', columnType: 'time' })
  startTime!: string;

  /**
   * Valor de end time mantenido por la instancia.
   */
  @Property({ fieldName: 'end_time', columnType: 'time' })
  endTime!: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date' })
  validFrom!: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

  /**
   * Valor de release hours mantenido por la instancia.
   */
  @Property({ fieldName: 'release_hours', columnType: 'int' })
  releaseHours!: number;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
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
