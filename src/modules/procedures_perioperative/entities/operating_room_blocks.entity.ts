import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'operating_room_blocks',
})
export class OperatingRoomBlocks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'series_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  seriesId?: string;

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

  @Property({ fieldName: 'starts_at', columnType: 'timestamptz' })
  startsAt!: Date;

  @Property({ fieldName: 'ends_at', columnType: 'timestamptz' })
  endsAt!: Date;

  @Property({ fieldName: 'release_at', columnType: 'timestamptz' })
  releaseAt!: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  @Property({
    fieldName: 'released_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  releasedAt?: Date;

  @Property({ fieldName: 'released_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  releasedByUserId?: string;

  @Property({ fieldName: 'release_reason', columnType: 'text', nullable: true })
  releaseReason?: string;

  @Property({
    fieldName: 'released_minutes',
    columnType: 'int',
    nullable: true,
  })
  releasedMinutes?: number;

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
