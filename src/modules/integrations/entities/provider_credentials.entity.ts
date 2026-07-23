import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'integrations', tableName: 'provider_credentials' })
export class ProviderCredentials {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'connection_id', type: 'uuid' }) // FK (destino no resuelto)
  connectionId!: string;

  @Property({ fieldName: 'secret_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  secretTypeConceptId!: string;

  @Property({ fieldName: 'secret_ref', columnType: 'varchar', nullable: true })
  secretRef?: string;

  @Property({ type: 'boolean', nullable: true })
  encrypted?: boolean;

  @Property({
    fieldName: 'rotated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  rotatedAt?: Date;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
