import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `specimen_chain_of_custody_events`.
 */
@Entity({
  schema: 'diagnostics',
  tableName: 'specimen_chain_of_custody_events',
})
export class SpecimenChainOfCustodyEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a specimen.
   */
  @Property({ fieldName: 'specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  specimenId!: string;

  /**
   * Identificador asociado a specimen container.
   */
  @Property({
    fieldName: 'specimen_container_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostics.specimen_containers
  specimenContainerId?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Identificador asociado a custody event type concept.
   */
  @Property({ fieldName: 'custody_event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  custodyEventTypeConceptId!: string;

  /**
   * Identificador asociado a from party type concept.
   */
  @Property({
    fieldName: 'from_party_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  fromPartyTypeConceptId?: string;

  /**
   * Identificador asociado a from party.
   */
  @Property({ fieldName: 'from_party_id', type: 'uuid', nullable: true })
  fromPartyId?: string;

  /**
   * Identificador asociado a to party type concept.
   */
  @Property({
    fieldName: 'to_party_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  toPartyTypeConceptId?: string;

  /**
   * Identificador asociado a to party.
   */
  @Property({ fieldName: 'to_party_id', type: 'uuid', nullable: true })
  toPartyId?: string;

  /**
   * Identificador asociado a location.
   */
  @Property({ fieldName: 'location_id', type: 'uuid', nullable: true }) // FK → diagnostics.dicom_object_locations
  locationId?: string;

  /**
   * Valor de seal identifier mantenido por la instancia.
   */
  @Property({
    fieldName: 'seal_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  sealIdentifier?: string;

  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'evidence_hash',
    columnType: 'varchar',
    nullable: true,
  })
  evidenceHash?: string;

  /**
   * Identificador asociado a signed by user.
   */
  @Property({ fieldName: 'signed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  signedByUserId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
