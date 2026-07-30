import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Activación de cuenta de un solo uso del registro asistido (C-18 / CAN-IDENT).
 *
 * Cuando un clínico/organización crea la cuenta de un paciente que no puede
 * hacerlo por sí mismo, NO se fija una contraseña definitiva: se emite un token de
 * activación de alta entropía del que solo se persiste su HASH (SHA-256) con
 * expiración. El titular lo consume una única vez para fijar su propia contraseña
 * y activar la cuenta; el creador nunca ve esa contraseña.
 *
 * Guarda la trazabilidad exigida por C-18: creador (`created_by_user_id`), motivo
 * (`reason`), fecha (`created_at`) y la representación legal (referencia a
 * `authz.patient_legal_representations` o, en su defecto, el dato mínimo).
 */
@Entity({ schema: 'iam', tableName: 'account_activations' })
export class AccountActivations {
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

  /** SHA-256 (hex) del token de activación. El token en claro nunca se persiste. */
  @Property({ fieldName: 'token_hash', columnType: 'varchar' })
  tokenHash!: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @Property({ fieldName: 'reason', columnType: 'varchar', nullable: true })
  reason?: string;

  /**
   * Identificador asociado a legal representation.
   */
  @Property({
    fieldName: 'legal_representation_id',
    type: 'uuid',
    nullable: true,
  }) // FK → authz.patient_legal_representations
  legalRepresentationId?: string;

  /**
   * Identificador asociado a legal representative user.
   */
  @Property({
    fieldName: 'legal_representative_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  legalRepresentativeUserId?: string;

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
