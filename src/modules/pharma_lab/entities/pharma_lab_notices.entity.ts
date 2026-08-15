import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Aviso del carril 17 entregado dentro del producto (spec 5667-5702).
 *
 * ## Por qué no escribe en `messaging.in_app_notifications`
 *
 * Ése es el buzón del módulo de mensajería, y su fila **exige**
 * `notification_request_id` y `notification_delivery_id` no nulos: un aviso
 * suyo es el último eslabón de una cadena que empieza en un canal configurado
 * (`message_channels`), pasa por una solicitud con consentimiento y política de
 * supresión, y termina en una entrega. Un caso de uso de dominio no puede
 * fabricar esos dos identificadores sin inventar filas — y una FK inventada es
 * exactamente la clase de dato falso que este carril no admite.
 *
 * Así que el aviso de negocio vive acá, en la tabla del módulo que lo produce, y
 * se escribe **en la misma transacción** que el hecho que lo motiva: una visita
 * aceptada cuyo aviso se perdió es un doctor esperando a alguien que no sabe que
 * fue aceptado.
 *
 * Los canales externos —correo, WhatsApp, SMS, push— siguen siendo de
 * `messaging`: cuando el despliegue tenga sus canales dados de alta, el
 * integrador puede enganchar estos avisos a `NotificationsService.createRequest`
 * sin tocar los casos de uso. Ver `CARRIL_REPORT.md`, «Deuda restante».
 */
@Entity({ schema: 'pharma_lab', tableName: 'pharma_lab_notices' })
export class PharmaLabNotices {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Cuenta destinataria.
   */
  @Property({ fieldName: 'recipient_user_id', type: 'uuid' }) // FK → iam.users
  recipientUserId!: string;

  /**
   * Organización bajo la que se emite, cuando aplica.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Código estable de plantilla, con el que la interfaz rotula el aviso.
   */
  @Property({ fieldName: 'template_code', columnType: 'varchar' })
  templateCode!: string;

  /**
   * Asunto legible.
   */
  @Property({ columnType: 'varchar' })
  subject!: string;

  /**
   * Cuerpo legible.
   */
  @Property({ fieldName: 'body_text', columnType: 'text' })
  bodyText!: string;

  /**
   * Tipo del recurso que originó el aviso (`visit_request`, `regulatory_document`…).
   */
  @Property({ fieldName: 'related_resource_type', columnType: 'varchar' })
  relatedResourceType!: string;

  /**
   * Identificador de ese recurso.
   */
  @Property({ fieldName: 'related_resource_id', type: 'uuid' })
  relatedResourceId!: string;

  /**
   * Si la persona ya lo leyó.
   */
  @Property({ fieldName: 'is_read', type: 'boolean' })
  isRead: boolean = false;

  /**
   * Momento de la lectura.
   */
  @Property({ fieldName: 'read_at', columnType: 'timestamptz', nullable: true })
  readAt?: Date;

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
}
