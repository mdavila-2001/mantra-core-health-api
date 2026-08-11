import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'audio_assets', tableName: 'audio_templates' })
export class AudioTemplates {
  @PrimaryKey({ type: 'uuid' }) id: string = randomUUID();
  @Property({ fieldName: 'template_key', columnType: 'varchar' })
  templateKey!: string;
  @Property({ columnType: 'int' }) version!: number;
  @Property({ columnType: 'varchar' }) strategy!: string;
  @Property({ columnType: 'varchar' }) language!: string;
  @Property({ fieldName: 'text_template', columnType: 'text' })
  textTemplate!: string;
  @Property({ fieldName: 'fallback_text', columnType: 'text', nullable: true })
  fallbackText?: string;
  @Property({
    fieldName: 'dynamic_fields_json',
    type: 'json',
    columnType: 'jsonb',
  })
  dynamicFieldsJson!: unknown;
  @Property({ fieldName: 'voice_profile', columnType: 'varchar' })
  voiceProfile!: string;
  @Property({ columnType: 'boolean' }) enabled!: boolean;
  @Property({ type: 'json', columnType: 'jsonb' }) metadata!: unknown;
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;
}
