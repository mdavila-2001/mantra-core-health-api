import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical', tableName: 'observation_notes' })
export class ObservationNotes {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'observation_id', type: 'uuid' }) // FK → clinical.observations
  observationId!: string;

  @Property({ fieldName: 'author_user_id', type: 'uuid' }) // FK → iam.users
  authorUserId!: string;

  @Property({ fieldName: 'note_text', columnType: 'text' })
  noteText!: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
