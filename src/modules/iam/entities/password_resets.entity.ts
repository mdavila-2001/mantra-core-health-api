import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Solicitud de restablecimiento de contraseña, de un solo uso.
 *
 * De la solicitud sólo se persiste el **hash** (SHA-256) del token; el token en
 * claro existe únicamente dentro del correo que se envía. Quien lea la base no
 * puede restablecer la contraseña de nadie.
 *
 * Va en su propia tabla y no en `iam.email_verifications`, con la que comparte
 * forma, porque no comparten consecuencia: consumir una verificación marca un
 * correo como alcanzable, y consumir esto reescribe una credencial y revoca
 * todas las sesiones del usuario. Con una sola tabla, un token emitido para lo
 * primero valdría para lo segundo — una escalada de privilegio disfrazada de
 * tabla ahorrada.
 */
@Entity({ schema: 'iam', tableName: 'password_resets' })
export class PasswordResets {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /**
   * Identificador con el que se pidió el restablecimiento (email o documento).
   */
  @Property({ fieldName: 'external_subject', columnType: 'varchar' })
  externalSubject!: string;

  /** SHA-256 (hex) del token; el token en claro nunca se persiste. */
  @Property({ fieldName: 'token_hash', columnType: 'varchar' })
  tokenHash!: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

  /**
   * Instante en que se consumió; queda fijo tras el primer uso.
   */
  @Property({
    fieldName: 'consumed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  consumedAt?: Date;

  /**
   * Origen de la solicitud, para poder auditar un abuso del formulario.
   */
  @Property({
    fieldName: 'requested_ip',
    columnType: 'varchar',
    nullable: true,
  })
  requestedIp?: string;

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
