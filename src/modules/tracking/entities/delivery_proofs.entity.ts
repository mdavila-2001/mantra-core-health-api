import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `delivery_proofs`.
 */
@Entity({ schema: 'tracking', tableName: 'delivery_proofs' })
export class DeliveryProofs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a shipment.
   */
  @Property({ fieldName: 'shipment_id', type: 'uuid' }) // FK → tracking.shipments
  shipmentId!: string;

  /**
   * Identificador asociado a proof type concept.
   */
  @Property({ fieldName: 'proof_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  proofTypeConceptId!: string;

  /**
   * Valor de recipient name mantenido por la instancia.
   */
  @Property({
    fieldName: 'recipient_name',
    columnType: 'varchar',
    nullable: true,
  })
  recipientName?: string;

  /**
   * Identificador asociado a signature file.
   */
  @Property({ fieldName: 'signature_file_id', type: 'uuid', nullable: true }) // FK → common.files
  signatureFileId?: string;

  /**
   * Identificador asociado a photo file.
   */
  @Property({ fieldName: 'photo_file_id', type: 'uuid', nullable: true }) // FK → common.files
  photoFileId?: string;

  /**
   * Valor de latitude mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  latitude?: string;

  /**
   * Valor de longitude mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  longitude?: string;

  /**
   * Valor de captured at mantenido por la instancia.
   */
  @Property({
    fieldName: 'captured_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  capturedAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
