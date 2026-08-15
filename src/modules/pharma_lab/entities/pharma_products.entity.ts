import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Medicamento desarrollado o fabricado por el laboratorio (spec 5423-5455).
 *
 * `authorized_indication` y `regulatory_status_concept_id` van juntos a
 * propósito: la spec prohíbe publicar indicaciones no aprobadas (5450), y el
 * servicio usa exactamente estas dos columnas para decidir si un producto puede
 * aparecer en material informativo o en el temario de una visita.
 */
@Entity({ schema: 'pharma_lab', tableName: 'pharma_products' })
export class PharmaProducts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Laboratorio propietario del registro.
   */
  @Property({ fieldName: 'pharma_lab_id', type: 'uuid' }) // FK → pharma_lab.pharma_labs
  pharmaLabId!: string;

  /**
   * Nombre comercial.
   */
  @Property({ fieldName: 'trade_name', columnType: 'varchar' })
  tradeName!: string;

  /**
   * Principio activo.
   */
  @Property({ fieldName: 'active_ingredient', columnType: 'varchar' })
  activeIngredient!: string;

  /**
   * Presentación (caja de 20 comprimidos, frasco de 100 ml…).
   */
  @Property({ columnType: 'varchar', nullable: true })
  presentation?: string;

  /**
   * Concentración.
   */
  @Property({ columnType: 'varchar', nullable: true })
  concentration?: string;

  /**
   * Forma farmacéutica.
   */
  @Property({
    fieldName: 'pharmaceutical_form',
    columnType: 'varchar',
    nullable: true,
  })
  pharmaceuticalForm?: string;

  /**
   * Vía de administración.
   */
  @Property({
    fieldName: 'administration_route',
    columnType: 'varchar',
    nullable: true,
  })
  administrationRoute?: string;

  /**
   * Indicación autorizada. Es lo único que puede difundirse como indicación.
   */
  @Property({
    fieldName: 'authorized_indication',
    columnType: 'text',
    nullable: true,
  })
  authorizedIndication?: string;

  /**
   * Laboratorio fabricante, cuando difiere del titular del registro.
   */
  @Property({
    fieldName: 'manufacturer_name',
    columnType: 'varchar',
    nullable: true,
  })
  manufacturerName?: string;

  /**
   * Estado regulatorio: investigación, desarrollo, evaluación, aprobado,
   * comercializado, suspendido o retirado.
   */
  @Property({ fieldName: 'regulatory_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  regulatoryStatusConceptId!: string;

  /**
   * Número de registro sanitario.
   */
  @Property({
    fieldName: 'sanitary_registry_number',
    columnType: 'varchar',
    nullable: true,
  })
  sanitaryRegistryNumber?: string;

  /**
   * Fecha de aprobación.
   */
  @Property({ fieldName: 'approved_on', columnType: 'date', nullable: true })
  approvedOn?: string;

  /**
   * Fecha de vencimiento del registro.
   */
  @Property({
    fieldName: 'registry_expires_on',
    columnType: 'date',
    nullable: true,
  })
  registryExpiresOn?: string;

  /**
   * Países autorizados (códigos ISO 3166-1 alfa-2).
   */
  @Property({
    fieldName: 'authorized_countries',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  authorizedCountries?: string[];

  /**
   * Documentación técnica asociada (referencias del almacén documental).
   */
  @Property({
    fieldName: 'technical_documentation',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  technicalDocumentation?: unknown;

  /**
   * Nivel de divulgación: pública, profesional, interna o confidencial.
   */
  @Property({ fieldName: 'disclosure_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  disclosureLevelConceptId!: string;

  /**
   * Número de versión del registro; se incrementa en cada cambio publicado.
   */
  @Property({ fieldName: 'version_no', columnType: 'int' })
  versionNo: number = 1;

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
