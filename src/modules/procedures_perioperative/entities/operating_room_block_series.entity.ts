import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'operating_room_block_series',
})
export class OperatingRoomBlockSeries {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites (inferida)
  practiceSiteId!: string;

  @Property({ fieldName: 'operating_room_id', type: 'uuid' }) // FK (destino no resuelto)
  operatingRoomId!: string;

  @Property({ fieldName: 'owner_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  ownerKindConceptId!: string;

  @Property({ fieldName: 'clinical_unit_id', type: 'uuid', nullable: true }) // FK → practice.clinical_units (inferida)
  clinicalUnitId?: string;

  @Property({
    fieldName: 'surgical_specialty_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  surgicalSpecialtyConceptId?: string;

  @Property({ fieldName: 'surgeon_profile_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  surgeonProfileId?: string;

  @Property({ type: 'array' })
  weekdays!: string[];

  @Property({ fieldName: 'start_time', columnType: 'time' })
  startTime!: string;

  @Property({ fieldName: 'end_time', columnType: 'time' })
  endTime!: string;

  @Property({ fieldName: 'valid_from', columnType: 'date' })
  validFrom!: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

  @Property({ fieldName: 'release_hours', columnType: 'int' })
  releaseHours!: number;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
