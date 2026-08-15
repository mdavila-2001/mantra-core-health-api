import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Seguimiento de un reporte de farmacovigilancia: evaluaciones, comunicaciones
 * con autoridades y acciones de seguimiento (spec 5595-5597).
 *
 * Append-only. Es la trazabilidad completa que la spec exige, y lo que hace que
 * el módulo no pueda ser un mock: sin estas filas un reporte no puede cambiar de
 * estado.
 */
@Entity({ schema: 'pharma_lab', tableName: 'pharmacovigilance_actions' })
export class PharmacovigilanceActions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Reporte al que pertenece.
   */
  @Property({ fieldName: 'pharmacovigilance_report_id', type: 'uuid' }) // FK → pharma_lab.pharmacovigilance_reports
  pharmacovigilanceReportId!: string;

  /**
   * Naturaleza de la acción.
   */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  /**
   * Estado del reporte antes de la acción.
   */
  @Property({ fieldName: 'previous_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  previousStatusConceptId!: string;

  /**
   * Estado del reporte después de la acción.
   */
  @Property({ fieldName: 'new_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  newStatusConceptId!: string;

  /**
   * Autoridad sanitaria destinataria, cuando la acción es una comunicación.
   */
  @Property({
    fieldName: 'authority_name',
    columnType: 'varchar',
    nullable: true,
  })
  authorityName?: string;

  /**
   * Número o código de la comunicación con la autoridad.
   */
  @Property({
    fieldName: 'authority_reference',
    columnType: 'varchar',
    nullable: true,
  })
  authorityReference?: string;

  /**
   * Detalle de la acción.
   */
  @Property({ columnType: 'text' })
  detail!: string;

  /**
   * Quién la ejecutó.
   */
  @Property({ fieldName: 'actor_user_id', type: 'uuid' }) // FK → iam.users
  actorUserId!: string;

  /**
   * Momento en que ocurrió.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
