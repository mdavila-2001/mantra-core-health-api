import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `admission_requirements`: el catálogo
 * de requisitos que se verifican en cada tipo de admisión (v4.2.67).
 */
@Entity({ schema: 'profiles', tableName: 'admission_requirements' })
export class AdmissionRequirements {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Tipo de admisión al que pertenece el requisito (p. ej. ALTA_DE_DOCTOR).
   */
  @Property({ fieldName: 'admission_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  admissionTypeConceptId!: string;

  /**
   * Código estable del requisito, único dentro de su tipo de admisión.
   */
  @Property({ fieldName: 'requirement_code', columnType: 'varchar' })
  requirementCode!: string;

  /**
   * Nombre visible del requisito.
   */
  @Property({ columnType: 'varchar' })
  label!: string;

  /**
   * Qué debe comprobar el revisor.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Clase de ficha que se revisa (matrícula, título, especialidad o dato del perfil).
   */
  @Property({ fieldName: 'item_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  itemTypeConceptId!: string;

  /**
   * Subtipo dentro de la clase de ficha; vacío = cualquiera.
   */
  @Property({
    fieldName: 'item_subtype_code',
    columnType: 'varchar',
    nullable: true,
  })
  itemSubtypeCode?: string;

  /**
   * Si la evidencia es un documento o un dato.
   */
  @Property({ fieldName: 'evidence_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  evidenceKindConceptId!: string;

  /**
   * Cómo se verifica (hoy siempre revisión manual).
   */
  @Property({ fieldName: 'verification_method_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationMethodConceptId!: string;

  /**
   * Si la admisión no puede verificarse sin este requisito.
   */
  @Property({ fieldName: 'is_required', type: 'boolean' })
  isRequired: boolean = true;

  /**
   * Si verificar el ítem exige declarar la fuente consultada.
   */
  @Property({ fieldName: 'requires_source_uri', type: 'boolean' })
  requiresSourceUri: boolean = true;

  /**
   * Grupo profesional al que aplica (MEDICO u ODONTOLOGO); vacío = a todos.
   */
  @Property({
    fieldName: 'applies_to_profession_group',
    columnType: 'varchar',
    nullable: true,
  })
  appliesToProfessionGroup?: string;

  /**
   * Cantidad mínima de ítems verificados para dar el requisito por cumplido.
   */
  @Property({ fieldName: 'min_items', columnType: 'smallint', nullable: true })
  minItems?: number;

  /**
   * Cantidad máxima de ítems que el médico puede declarar.
   */
  @Property({ fieldName: 'max_items', columnType: 'smallint', nullable: true })
  maxItems?: number;

  /**
   * Orden de presentación del checklist.
   */
  @Property({ fieldName: 'sort_order', columnType: 'int' })
  sortOrder!: number;

  /**
   * Si el requisito rige hoy.
   */
  @Property({ fieldName: 'is_active', type: 'boolean' })
  isActive: boolean = true;

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
