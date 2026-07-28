import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedure_performers`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_performers',
})
export class ProcedurePerformers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a procedure.
   */
  @Property({ fieldName: 'procedure_id', type: 'uuid' }) // FK → clinical.procedures
  procedureId!: string;

  /**
   * Identificador asociado a practitioner profile.
   */
  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  /**
   * Identificador asociado a performer role concept.
   */
  @Property({ fieldName: 'performer_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  performerRoleConceptId!: string;

  /**
   * Identificador asociado a organization.
   */
  @Property({ fieldName: 'organization_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  organizationId?: string;

  /**
   * Valor de starts at mantenido por la instancia.
   */
  @Property({
    fieldName: 'starts_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startsAt?: Date;

  /**
   * Valor de ends at mantenido por la instancia.
   */
  @Property({ fieldName: 'ends_at', columnType: 'timestamptz', nullable: true })
  endsAt?: Date;

  /**
   * Valor de contribution text mantenido por la instancia.
   */
  @Property({
    fieldName: 'contribution_text',
    columnType: 'text',
    nullable: true,
  })
  contributionText?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
