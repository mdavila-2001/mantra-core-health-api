import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'procedures_perioperative', tableName: 'procedure_implants' })
export class ProcedureImplants {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'procedure_id', type: 'uuid' }) // FK → clinical.procedures
  procedureId!: string;

  @Property({ fieldName: 'implant_device_id', type: 'uuid' }) // FK → iam.devices
  implantDeviceId!: string;

  @Property({ fieldName: 'implant_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  implantRoleConceptId!: string;

  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  @Property({
    fieldName: 'laterality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  lateralityConceptId?: string;

  @Property({ fieldName: 'implanted_at', columnType: 'timestamptz' })
  implantedAt!: Date;

  @Property({
    fieldName: 'explanted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  explantedAt?: Date;

  @Property({
    fieldName: 'explant_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  explantReasonConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  statusConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
