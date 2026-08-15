import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Especialidades médicas que un visitador tiene autorizado visitar (spec 5310).
 * Las consume la agenda del doctor para decidir si acepta la solicitud
 * (spec 5407, 5417).
 */
@Entity({ schema: 'pharma_lab', tableName: 'medical_visitor_specialties' })
export class MedicalVisitorSpecialties {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Visitador al que pertenece la autorización.
   */
  @Property({ fieldName: 'medical_visitor_id', type: 'uuid' }) // FK → pharma_lab.medical_visitors
  medicalVisitorId!: string;

  /**
   * Especialidad del catálogo de terminología.
   */
  @Property({ fieldName: 'specialty_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  specialtyConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
