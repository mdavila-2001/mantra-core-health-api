import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_milestones`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_milestones' })
export class InsightsMilestones {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de occurred on mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_on', columnType: 'date' })
  occurredOn!: Date;

  /**
   * Valor de label mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  label!: string;

  /**
   * Identificador asociado a campaign.
   */
  @Property({ fieldName: 'campaign_id', type: 'uuid', nullable: true }) // FK → marketing.insights_campaigns
  campaignId?: string;

  /**
   * Valor de kind code mantenido por la instancia.
   */
  @Property({ fieldName: 'kind_code', columnType: 'varchar' })
  kindCode!: string;

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

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
