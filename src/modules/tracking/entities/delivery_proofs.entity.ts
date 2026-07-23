import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'tracking', tableName: 'delivery_proofs' })
export class DeliveryProofs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'shipment_id', type: 'uuid' }) // FK → tracking.shipments
  shipmentId!: string;

  @Property({ fieldName: 'proof_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  proofTypeConceptId!: string;

  @Property({
    fieldName: 'recipient_name',
    columnType: 'varchar',
    nullable: true,
  })
  recipientName?: string;

  @Property({ fieldName: 'signature_file_id', type: 'uuid', nullable: true }) // FK → common.files
  signatureFileId?: string;

  @Property({ fieldName: 'photo_file_id', type: 'uuid', nullable: true }) // FK → common.files
  photoFileId?: string;

  @Property({ columnType: 'numeric', nullable: true })
  latitude?: string;

  @Property({ columnType: 'numeric', nullable: true })
  longitude?: string;

  @Property({
    fieldName: 'captured_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  capturedAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
