import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Bitácora append-only de vinculaciones, desvinculaciones y cambios de permisos
 * de personal y visitadores (spec 5288 «mantener el historial de vinculaciones y
 * permisos», 5707-5708 «auditar vinculación de personal / desvinculación de
 * visitadores»).
 *
 * Es historia de negocio consultable por la organización, complementaria —no
 * sustituta— de la cadena WORM `audit.audit_log`, que sella el mismo hecho para
 * cumplimiento y no se expone como listado de dominio.
 */
@Entity({ schema: 'pharma_lab', tableName: 'pharma_lab_link_events' })
export class PharmaLabLinkEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Laboratorio en cuyo ámbito ocurre el evento.
   */
  @Property({ fieldName: 'pharma_lab_id', type: 'uuid' }) // FK → pharma_lab.pharma_labs
  pharmaLabId!: string;

  /**
   * Ficha de personal afectada, si el evento es de personal.
   */
  @Property({ fieldName: 'staff_id', type: 'uuid', nullable: true }) // FK → pharma_lab.pharma_lab_staff
  staffId?: string;

  /**
   * Ficha de visitador afectada, si el evento es de un visitador.
   */
  @Property({ fieldName: 'medical_visitor_id', type: 'uuid', nullable: true }) // FK → pharma_lab.medical_visitors
  medicalVisitorId?: string;

  /**
   * Cuenta afectada. Se guarda desnormalizada a propósito: el evento debe seguir
   * siendo legible aunque la ficha se archive.
   */
  @Property({ fieldName: 'subject_user_id', type: 'uuid' }) // FK → iam.users
  subjectUserId!: string;

  /**
   * Qué ocurrió: vinculación, desvinculación, revinculación o cambio de permisos.
   */
  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  /**
   * Motivo declarado por quien ejecuta la acción.
   */
  @Property({ columnType: 'text', nullable: true })
  reason?: string;

  /**
   * Permisos antes del evento.
   */
  @Property({
    fieldName: 'previous_permissions',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  previousPermissions?: string[];

  /**
   * Permisos después del evento.
   */
  @Property({
    fieldName: 'new_permissions',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  newPermissions?: string[];

  /**
   * Cantidad de sesiones revocadas por el evento, cuando aplica.
   */
  @Property({
    fieldName: 'revoked_session_count',
    columnType: 'int',
    nullable: true,
  })
  revokedSessionCount?: number;

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
