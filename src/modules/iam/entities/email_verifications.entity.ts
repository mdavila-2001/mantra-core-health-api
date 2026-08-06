import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Verificación de correo de un solo uso.
 *
 * El paciente se registra con su CI y el correo es OPCIONAL: si lo aporta, se
 * emite un token del que sólo se persiste el HASH (SHA-256) con expiración, y se
 * le envía por el canal de correo. Verificarlo **no condiciona el acceso** —
 * desde el registro el usuario ya puede navegar la aplicación—; sólo marca
 * `iam.users.email_verified`, que hasta ahora nadie ponía en `true`.
 *
 * Va en su propia tabla y no en `iam.account_activations` porque son ciclos de
 * vida distintos: la activación fija la contraseña definitiva de una cuenta
 * creada por un tercero, y esto sólo confirma que una dirección de correo es
 * alcanzable por su titular. Compartir tabla obligaría a discriminar por una
 * columna libre y a que ambos flujos heredaran las precondiciones del otro.
 */
@Entity({ schema: 'iam', tableName: 'email_verifications' })
export class EmailVerifications {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users (inferida)
  userId!: string;

  /** Dirección que se está verificando (puede cambiar entre reemisiones). */
  @Property({ columnType: 'varchar' })
  email!: string;

  /** SHA-256 (hex) del token. El token en claro nunca se persiste. */
  @Property({ fieldName: 'token_hash', columnType: 'varchar' })
  tokenHash!: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  stateConceptId!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

  /**
   * Valor de consumed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'consumed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  consumedAt?: Date;

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
