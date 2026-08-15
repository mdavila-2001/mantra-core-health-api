import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Publicación individual de un visitador sometida a aprobación previa de la
 * organización (spec 5565-5566).
 *
 * La publicación en sí vive en `community.social_posts`, que es la red social del
 * sistema: acá solo se guarda el trámite de autorización. Al aprobarse, el
 * servicio crea la publicación y anota su id; mientras esté pendiente o
 * rechazada, la publicación no existe — no es una publicación oculta.
 */
@Entity({ schema: 'pharma_lab', tableName: 'visitor_post_submissions' })
export class VisitorPostSubmissions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Laboratorio que autoriza.
   */
  @Property({ fieldName: 'pharma_lab_id', type: 'uuid' }) // FK → pharma_lab.pharma_labs
  pharmaLabId!: string;

  /**
   * Visitador autor.
   */
  @Property({ fieldName: 'medical_visitor_id', type: 'uuid' }) // FK → pharma_lab.medical_visitors
  medicalVisitorId!: string;

  /**
   * Cuerpo propuesto.
   */
  @Property({ columnType: 'text' })
  body!: string;

  /**
   * Material científico aprobado que acompaña la publicación.
   */
  @Property({
    fieldName: 'informational_material_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharma_lab.informational_materials
  informationalMaterialId?: string;

  /**
   * Estado del trámite.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fundamento de la decisión.
   */
  @Property({
    fieldName: 'decision_rationale',
    columnType: 'text',
    nullable: true,
  })
  decisionRationale?: string;

  /**
   * Quién decidió.
   */
  @Property({ fieldName: 'decided_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  decidedByUserId?: string;

  /**
   * Momento de la decisión.
   */
  @Property({
    fieldName: 'decided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decidedAt?: Date;

  /**
   * Publicación creada al aprobarse.
   */
  @Property({ fieldName: 'social_post_id', type: 'uuid', nullable: true }) // FK → community.social_posts
  socialPostId?: string;

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
