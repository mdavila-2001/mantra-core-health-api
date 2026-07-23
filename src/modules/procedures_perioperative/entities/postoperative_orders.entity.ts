import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'postoperative_orders',
})
export class PostoperativeOrders {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'service_request_id', type: 'uuid' }) // FK → clinical.service_requests
  serviceRequestId!: string;

  @Property({ fieldName: 'order_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  orderRoleConceptId!: string;

  @Property({
    fieldName: 'start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startAt?: Date;

  @Property({ fieldName: 'stop_at', columnType: 'timestamptz', nullable: true })
  stopAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'verified_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  verifiedByProfileId?: string;

  @Property({
    fieldName: 'verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
