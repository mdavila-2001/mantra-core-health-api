import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * P40 (carril C2): una nota médica que motiva una orden de análisis. Tabla
 * puente append-only: se escribe con la orden y no se edita.
 */
@Entity({ schema: 'clinical', tableName: 'service_request_notes' })
export class ServiceRequestNotes {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * La orden de servicio a la que pertenece el vínculo.
   */
  @Property({ fieldName: 'service_request_id', type: 'uuid' }) // FK → clinical.service_requests (inferida)
  serviceRequestId!: string;

  /**
   * La nota médica (cabecera) que motiva la orden.
   */
  @Property({ fieldName: 'clinical_note_header_id', type: 'uuid' }) // FK → chart.clinical_note_headers (inferida)
  clinicalNoteHeaderId!: string;

  /**
   * Posición en que el médico citó la nota (0 = la primera).
   */
  @Property({ columnType: 'int' })
  ordinal!: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;
}
