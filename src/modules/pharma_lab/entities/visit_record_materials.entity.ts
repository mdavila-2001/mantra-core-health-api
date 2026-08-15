import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Qué material se presentó o entregó en cada visita (spec 5481, 5496).
 *
 * Es la evidencia que hace verificable la prohibición de compartir material no
 * aprobado: si la fila existe, el servicio ya comprobó que el material estaba
 * aprobado y vigente en el momento de la visita.
 */
@Entity({ schema: 'pharma_lab', tableName: 'visit_record_materials' })
export class VisitRecordMaterials {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Registro de visita.
   */
  @Property({ fieldName: 'visit_record_id', type: 'uuid' }) // FK → pharma_lab.visit_records
  visitRecordId!: string;

  /**
   * Material presentado.
   */
  @Property({ fieldName: 'informational_material_id', type: 'uuid' }) // FK → pharma_lab.informational_materials
  informationalMaterialId!: string;

  /**
   * Versión del material en el momento de la visita.
   */
  @Property({ fieldName: 'material_version', columnType: 'varchar' })
  materialVersion!: string;

  /**
   * Si además de presentarse se entregó una copia.
   */
  @Property({ fieldName: 'was_handed_over', type: 'boolean' })
  wasHandedOver: boolean = false;

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
