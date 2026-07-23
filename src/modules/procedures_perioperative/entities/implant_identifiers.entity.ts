import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'implant_identifiers',
})
export class ImplantIdentifiers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_implant_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_implants
  procedureImplantId!: string;

  @Property({ fieldName: 'identifier_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  identifierTypeConceptId!: string;

  @Property({ fieldName: 'identifier_value', columnType: 'varchar' })
  identifierValue!: string;

  @Property({
    fieldName: 'issuing_system',
    columnType: 'varchar',
    nullable: true,
  })
  issuingSystem?: string;

  @Property({ fieldName: 'lot_number', columnType: 'varchar', nullable: true })
  lotNumber?: string;

  @Property({
    fieldName: 'serial_number',
    columnType: 'varchar',
    nullable: true,
  })
  serialNumber?: string;

  @Property({
    fieldName: 'expiration_date',
    columnType: 'date',
    nullable: true,
  })
  expirationDate?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
