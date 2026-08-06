import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Regla determinista del motor de confirmación automática de reservas (C-11).
 *
 * Las reglas no se borran en duro: se desactivan (`enabled=false`) y versionan
 * (`version`), de modo que el historial de qué regla decidió una reserva se
 * mantiene reproducible. La evaluación filtra por alcance y vigencia, ordena por
 * especificidad y prioridad, y aplica la primera regla concluyente.
 */
@Entity({ schema: 'scheduling', tableName: 'booking_confirmation_rules' })
export class BookingConfirmationRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a scope type concept.
   */
  @Property({ fieldName: 'scope_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  scopeTypeConceptId!: string;

  /** Alcance concreto (practice/resource/service). `undefined` = todo el tipo de alcance. */
  @Property({ fieldName: 'scope_id', type: 'uuid', nullable: true })
  scopeId?: string;

  /** Menor número = mayor prioridad al resolver empates de especificidad. */
  @Property({ columnType: 'int' })
  priority!: number;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Valor de condition json mantenido por la instancia.
   */
  @Property({ fieldName: 'condition_json', type: 'json', columnType: 'jsonb' })
  conditionJson!: unknown;

  /**
   * Identificador asociado a decision concept.
   */
  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  decisionConceptId!: string;

  /**
   * Valor de enabled mantenido por la instancia.
   */
  @Property({ type: 'boolean' })
  enabled!: boolean;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  version!: number;

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
