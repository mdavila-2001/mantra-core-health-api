import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Material informativo para doctores (spec 5457-5481).
 *
 * El estado de aprobación no es un adorno: `MATERIAL_APPROVED` con vigencia
 * corriente es la única combinación que el servicio de visitas acepta cuando el
 * visitador declara qué entregó, y es lo que implementa «evitar que un visitador
 * comparta materiales no aprobados» (5480).
 */
@Entity({ schema: 'pharma_lab', tableName: 'informational_materials' })
export class InformationalMaterials {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Laboratorio propietario.
   */
  @Property({ fieldName: 'pharma_lab_id', type: 'uuid' }) // FK → pharma_lab.pharma_labs
  pharmaLabId!: string;

  /**
   * Medicamento al que se asocia, si aplica.
   */
  @Property({ fieldName: 'pharma_product_id', type: 'uuid', nullable: true }) // FK → pharma_lab.pharma_products
  pharmaProductId?: string;

  /**
   * Campaña comercial a la que pertenece.
   */
  @Property({
    fieldName: 'campaign_code',
    columnType: 'varchar',
    nullable: true,
  })
  campaignCode?: string;

  /**
   * Especialidad a la que está dirigido.
   */
  @Property({ fieldName: 'specialty_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  specialtyConceptId?: string;

  /**
   * Visitador al que se asigna en exclusiva, si corresponde.
   */
  @Property({ fieldName: 'medical_visitor_id', type: 'uuid', nullable: true }) // FK → pharma_lab.medical_visitors
  medicalVisitorId?: string;

  /**
   * Título del material.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Tipo: ficha técnica, estudio, documento científico, presentación, video o
   * información regulatoria.
   */
  @Property({ fieldName: 'kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  kindConceptId!: string;

  /**
   * Versión del material.
   */
  @Property({ columnType: 'varchar' })
  version!: string;

  /**
   * Autor.
   */
  @Property({ fieldName: 'author_name', columnType: 'varchar', nullable: true })
  authorName?: string;

  /**
   * Responsable de la aprobación.
   */
  @Property({ fieldName: 'approver_staff_id', type: 'uuid', nullable: true }) // FK → pharma_lab.pharma_lab_staff
  approverStaffId?: string;

  /**
   * Inicio de vigencia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: string;

  /**
   * Fin de vigencia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: string;

  /**
   * Estado de revisión/aprobación.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Nivel de divulgación.
   */
  @Property({ fieldName: 'disclosure_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  disclosureLevelConceptId!: string;

  /**
   * Momento de la aprobación vigente.
   */
  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

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
