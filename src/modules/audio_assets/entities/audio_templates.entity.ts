import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `audio_templates`.
 */
@Entity({ schema: 'audio_assets', tableName: 'audio_templates' })
export class AudioTemplates {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de template key mantenido por la instancia.
   */
  @Property({ fieldName: 'template_key', columnType: 'varchar' })
  templateKey!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  version!: number;

  /**
   * Valor de strategy mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  strategy!: string;

  /**
   * Valor de language mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  language!: string;

  /**
   * Valor de text template mantenido por la instancia.
   */
  @Property({ fieldName: 'text_template', columnType: 'text' })
  textTemplate!: string;

  /**
   * Valor de fallback text mantenido por la instancia.
   */
  @Property({ fieldName: 'fallback_text', columnType: 'text', nullable: true })
  fallbackText?: string;

  /**
   * Valor de dynamic fields json mantenido por la instancia.
   */
  @Property({
    fieldName: 'dynamic_fields_json',
    type: 'json',
    columnType: 'jsonb',
  })
  dynamicFieldsJson!: unknown;

  /**
   * Valor de voice profile mantenido por la instancia.
   */
  @Property({ fieldName: 'voice_profile', columnType: 'varchar' })
  voiceProfile!: string;

  /**
   * Valor de enabled mantenido por la instancia.
   */
  @Property({ type: 'boolean' })
  enabled!: boolean;

  /**
   * Valor de metadata mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb' })
  metadata!: unknown;

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
}
