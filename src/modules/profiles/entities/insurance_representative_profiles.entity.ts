import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insurance_representative_profiles`.
 */
@Entity({ schema: 'profiles', tableName: 'insurance_representative_profiles' })
export class InsuranceRepresentativeProfiles {
  /**
   * Identificador asociado a profile.
   */
  @PrimaryKey({ fieldName: 'profile_id', type: 'uuid' })
  profileId: string = randomUUID();

  /**
   * Identificador asociado a representative type concept.
   */
  @Property({ fieldName: 'representative_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  representativeTypeConceptId!: string;

  /**
   * Identificador asociado a role concept.
   */
  @Property({ fieldName: 'role_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  roleConceptId?: string;

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
