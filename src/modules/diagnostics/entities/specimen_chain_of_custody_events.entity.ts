import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'diagnostics',
  tableName: 'specimen_chain_of_custody_events',
})
export class SpecimenChainOfCustodyEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  specimenId!: string;

  @Property({
    fieldName: 'specimen_container_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostics.specimen_containers
  specimenContainerId?: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'custody_event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  custodyEventTypeConceptId!: string;

  @Property({
    fieldName: 'from_party_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  fromPartyTypeConceptId?: string;

  @Property({ fieldName: 'from_party_id', type: 'uuid', nullable: true })
  fromPartyId?: string;

  @Property({
    fieldName: 'to_party_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  toPartyTypeConceptId?: string;

  @Property({ fieldName: 'to_party_id', type: 'uuid', nullable: true })
  toPartyId?: string;

  @Property({ fieldName: 'location_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  locationId?: string;

  @Property({
    fieldName: 'seal_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  sealIdentifier?: string;

  @Property({
    fieldName: 'evidence_hash',
    columnType: 'varchar',
    nullable: true,
  })
  evidenceHash?: string;

  @Property({ fieldName: 'signed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  signedByUserId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
