import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ui_visibility_rules`: una regla SHOW/HIDE
 * sobre un elemento del catálogo para un sujeto. Las reglas no se borran: se terminan.
 * La visibilidad no es autorización (ver CONTRATO.md).
 */
@Entity({ schema: 'authz', tableName: 'ui_visibility_rules' })
export class UiVisibilityRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Elemento del catálogo sobre el que actúa la regla.
   */
  @Property({ fieldName: 'element_id', type: 'uuid' }) // FK → authz.ui_visibility_elements
  elementId!: string;

  /**
   * Efecto de la regla: SHOW o HIDE.
   */
  @Property({ columnType: 'varchar' })
  effect!: string;

  /**
   * Tipo de sujeto: USER, TENANT, ROLE, ORG_TYPE o ALL.
   */
  @Property({ fieldName: 'subject_type', columnType: 'varchar' })
  subjectType!: string;

  /**
   * Sujeto (id de usuario, id de organización, código de rol o código de tipo de organización); nulo sólo en ALL.
   */
  @Property({ fieldName: 'subject_id', columnType: 'varchar', nullable: true })
  subjectId?: string;

  /**
   * Organización que acota la regla; nulo = regla de plataforma. Sin FK a propósito (no es `tenant_id`: ver D-UV-1).
   */
  @Property({ fieldName: 'scope_tenant_id', type: 'uuid', nullable: true })
  scopeTenantId?: string;

  /**
   * Inicio de la vigencia (inclusive).
   */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /**
   * Fin de la vigencia (exclusive).
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  /**
   * Cuándo se terminó la regla; nulo = no terminada.
   */
  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

  /**
   * Motivo obligatorio (10 a 500 caracteres).
   */
  @Property({ columnType: 'varchar' })
  reason!: string;

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
