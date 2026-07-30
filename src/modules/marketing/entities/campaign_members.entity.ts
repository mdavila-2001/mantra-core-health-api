import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `campaign_members`.
 */
@Entity({ schema: 'marketing', tableName: 'campaign_members' })
export class CampaignMembers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a campaign.
   */
  @Property({ fieldName: 'campaign_id', type: 'uuid' }) // FK → ads.campaigns
  campaignId!: string;

  /**
   * Identificador asociado a member type concept.
   */
  @Property({ fieldName: 'member_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberTypeConceptId!: string;

  /**
   * Identificador asociado a member ref.
   */
  @Property({ fieldName: 'member_ref_id', type: 'uuid' })
  memberRefId!: string;

  /**
   * Identificador asociado a member status concept.
   */
  @Property({ fieldName: 'member_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberStatusConceptId!: string;

  /**
   * Valor de added at mantenido por la instancia.
   */
  @Property({
    fieldName: 'added_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  addedAt?: Date;

  /**
   * Valor de responded at mantenido por la instancia.
   */
  @Property({
    fieldName: 'responded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  respondedAt?: Date;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

  /**
   * Identificador asociado a source segment member.
   */
  @Property({
    fieldName: 'source_segment_member_id',
    type: 'uuid',
    nullable: true,
  }) // FK → marketing.segment_members
  sourceSegmentMemberId?: string;

  /**
   * Identificador asociado a first dispatch.
   */
  @Property({ fieldName: 'first_dispatch_id', type: 'uuid', nullable: true }) // FK → marketing.campaign_dispatches
  firstDispatchId?: string;

  /**
   * Identificador asociado a last dispatch.
   */
  @Property({ fieldName: 'last_dispatch_id', type: 'uuid', nullable: true }) // FK → marketing.campaign_dispatches
  lastDispatchId?: string;

  /**
   * Valor de total dispatches mantenido por la instancia.
   */
  @Property({
    fieldName: 'total_dispatches',
    columnType: 'int',
    nullable: true,
  })
  totalDispatches?: number;
}
