import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `persons`.
 */
@Entity({ schema: 'profiles', tableName: 'persons' })
export class Persons {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a person status concept.
   */
  @Property({ fieldName: 'person_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  personStatusConceptId!: string;

  /**
   * Nombre de pila.
   *
   * Las cuatro partes del nombre son opcionales: un recién nacido, una urgencia
   * sin identificar o un registro importado pueden llegar sin ninguna.
   */
  @Property({ columnType: 'varchar', nullable: true })
  name?: string;

  /**
   * Segundo nombre.
   */
  @Property({ fieldName: 'middle_name', columnType: 'varchar', nullable: true })
  middleName?: string;

  /**
   * Apellido paterno.
   */
  @Property({ fieldName: 'last_name', columnType: 'varchar', nullable: true })
  lastName?: string;

  /**
   * Apellido materno.
   */
  @Property({
    fieldName: 'mother_last_name',
    columnType: 'varchar',
    nullable: true,
  })
  motherLastName?: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @Property({
    fieldName: 'display_name',
    columnType: 'varchar',
    nullable: true,
  })
  displayName?: string;

  /**
   * Identificador asociado a photo file.
   */
  @Property({ fieldName: 'photo_file_id', type: 'uuid', nullable: true }) // FK → common.files
  photoFileId?: string;

  /**
   * Valor de birth date mantenido por la instancia.
   */
  @Property({ fieldName: 'birth_date', columnType: 'date', nullable: true })
  birthDate?: Date;

  /**
   * Identificador asociado a administrative gender concept.
   */
  @Property({
    fieldName: 'administrative_gender_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  administrativeGenderConceptId?: string;

  /**
   * Identificador asociado a sex at birth concept.
   */
  @Property({
    fieldName: 'sex_at_birth_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  sexAtBirthConceptId?: string;

  /**
   * Identificador asociado a gender identity concept.
   */
  @Property({
    fieldName: 'gender_identity_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  genderIdentityConceptId?: string;

  /**
   * Identificador asociado a vital status concept.
   */
  @Property({
    fieldName: 'vital_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  vitalStatusConceptId?: string;

  /**
   * Valor de deceased at mantenido por la instancia.
   */
  @Property({
    fieldName: 'deceased_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deceasedAt?: Date;

  /**
   * Identificador asociado a nationality concept.
   */
  @Property({
    fieldName: 'nationality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  nationalityConceptId?: string;

  /**
   * Identificador asociado a preferred language concept.
   */
  @Property({
    fieldName: 'preferred_language_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  preferredLanguageConceptId?: string;

  /**
   * Identificador asociado a merge survivor person.
   */
  @Property({
    fieldName: 'merge_survivor_person_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.persons
  mergeSurvivorPersonId?: string;

  /**
   * Valor de anonymized at mantenido por la instancia.
   */
  @Property({
    fieldName: 'anonymized_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  anonymizedAt?: Date;

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
