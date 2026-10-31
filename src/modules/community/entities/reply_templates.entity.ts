import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Respuesta preparada para el equipo de apoyo: de la organización o de un
 * doctor, por categoría (general, agenda, facturación, preparación de la visita).
 */
@Entity({ schema: 'community', tableName: 'reply_templates' })
export class ReplyTemplates {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Organización dueña. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Doctor dueño, si es una respuesta suya y no de toda la organización. */
  @Property({
    fieldName: 'practitioner_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId?: string;

  /** Categoría (concepto). */
  @Property({ fieldName: 'category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  categoryConceptId!: string;

  /** Título. */
  @Property({ columnType: 'varchar' })
  title!: string;

  /** Texto de la respuesta. */
  @Property({ fieldName: 'body_text', columnType: 'text' })
  bodyText!: string;

  /** Estado (activa o retirada). */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /** Fecha y hora de creación. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /** Fecha y hora de la última actualización. */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /** Quien la creó. */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /** Quien la actualizó por última vez. */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /** Versión de la fila (concurrencia optimista). */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
