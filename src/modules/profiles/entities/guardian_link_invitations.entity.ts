import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea `profiles.guardian_link_invitations` (parche v4.2.34): la invitación
 * que se le envía al tutor de un paciente de mostrador para que confirme el
 * vínculo.
 *
 * No guarda el teléfono ni el token: el teléfono se resuelve de
 * `common.contact_points` al emitir, y del token sólo queda su SHA-256.
 */
@Entity({ schema: 'profiles', tableName: 'guardian_link_invitations' })
export class GuardianLinkInvitations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Organización en cuyo contexto ocurrió el alta.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Perfil del paciente que declaró al tutor.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * La fila de persona relacionada que representa el vínculo.
   */
  @Property({ fieldName: 'related_person_id', type: 'uuid' }) // FK → profiles.related_persons
  relatedPersonId!: string;

  /**
   * La persona del tutor, dueña del teléfono.
   */
  @Property({ fieldName: 'guardian_person_id', type: 'uuid' }) // FK → profiles.persons
  guardianPersonId!: string;

  /**
   * El evento de dominio que originó la invitación: una por evento.
   */
  @Property({ fieldName: 'domain_event_id', type: 'uuid' }) // FK → messaging.domain_events
  domainEventId!: string;

  /**
   * SHA-256 (hex) del token del enlace vigente. Nulo tras confirmar.
   */
  @Property({ fieldName: 'token_hash', columnType: 'varchar', nullable: true })
  tokenHash?: string | null;

  /**
   * Estado (`PROF.GUARDIAN_LINK_*`).
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Canal por el que salió el último intento (`SMS` | `WHATSAPP`).
   */
  @Property({
    fieldName: 'channel_code',
    columnType: 'varchar',
    nullable: true,
  })
  channelCode?: string;

  /**
   * Referencia que devolvió el proveedor (o el doble) en el último envío.
   */
  @Property({
    fieldName: 'provider_message_ref',
    columnType: 'varchar',
    nullable: true,
  })
  providerMessageRef?: string;

  /**
   * Intentos de envío reportados por el worker.
   */
  @Property({ fieldName: 'attempt_count', columnType: 'int' })
  attemptCount!: number;

  /**
   * Código del último error de envío.
   */
  @Property({
    fieldName: 'last_error_code',
    columnType: 'varchar',
    nullable: true,
  })
  lastErrorCode?: string;

  /**
   * Vencimiento del token vigente.
   */
  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  /**
   * Cuándo el proveedor aceptó el último envío.
   */
  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

  /**
   * Cuándo el tutor confirmó.
   */
  @Property({
    fieldName: 'confirmed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  confirmedAt?: Date;

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
