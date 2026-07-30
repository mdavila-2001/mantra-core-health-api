import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `implant_identifiers`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'implant_identifiers',
})
export class ImplantIdentifiers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a procedure implant.
   */
  @Property({ fieldName: 'procedure_implant_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_implants
  procedureImplantId!: string;

  /**
   * Identificador asociado a identifier type concept.
   */
  @Property({ fieldName: 'identifier_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  identifierTypeConceptId!: string;

  /**
   * Valor de identifier value mantenido por la instancia.
   */
  @Property({ fieldName: 'identifier_value', columnType: 'varchar' })
  identifierValue!: string;

  /**
   * Valor de issuing system mantenido por la instancia.
   */
  @Property({
    fieldName: 'issuing_system',
    columnType: 'varchar',
    nullable: true,
  })
  issuingSystem?: string;

  /**
   * Valor de lot number mantenido por la instancia.
   */
  @Property({ fieldName: 'lot_number', columnType: 'varchar', nullable: true })
  lotNumber?: string;

  /**
   * Valor de serial number mantenido por la instancia.
   */
  @Property({
    fieldName: 'serial_number',
    columnType: 'varchar',
    nullable: true,
  })
  serialNumber?: string;

  /**
   * Valor de expiration date mantenido por la instancia.
   */
  @Property({
    fieldName: 'expiration_date',
    columnType: 'date',
    nullable: true,
  })
  expirationDate?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
