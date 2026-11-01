import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `audio_generation_usage`.
 */
@Entity({ schema: 'audio_assets', tableName: 'audio_generation_usage' })
export class AudioGenerationUsage {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de period key mantenido por la instancia.
   */
  @Property({ fieldName: 'period_key', columnType: 'varchar' })
  periodKey!: string;

  /**
   * Valor de provider mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  provider!: string;

  /**
   * Valor de estimated credits mantenido por la instancia.
   */
  @Property({ fieldName: 'estimated_credits', columnType: 'int' })
  estimatedCredits!: number;

  /**
   * Valor de consumed credits mantenido por la instancia.
   */
  @Property({
    fieldName: 'consumed_credits',
    columnType: 'int',
    nullable: true,
  })
  consumedCredits?: number;

  /**
   * Valor de request count mantenido por la instancia.
   */
  @Property({ fieldName: 'request_count', columnType: 'int' })
  requestCount!: number;

  /**
   * Valor de success count mantenido por la instancia.
   */
  @Property({ fieldName: 'success_count', columnType: 'int' })
  successCount!: number;

  /**
   * Valor de failure count mantenido por la instancia.
   */
  @Property({ fieldName: 'failure_count', columnType: 'int' })
  failureCount!: number;

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
