import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'procedures_perioperative', tableName: 'instrument_sets' })
export class InstrumentSets {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ columnType: 'varchar', nullable: true })
  code?: string;

  @Property({ columnType: 'varchar', nullable: true })
  name?: string;

  @Property({ fieldName: 'set_type_concept_id', type: 'uuid', nullable: true })
  setTypeConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid', nullable: true })
  statusConceptId?: string;

  @Property({ fieldName: 'piece_count', columnType: 'int', nullable: true })
  pieceCount?: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
