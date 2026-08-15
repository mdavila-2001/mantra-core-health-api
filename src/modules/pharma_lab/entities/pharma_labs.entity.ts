import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Especialización de `directory.tenants` para una organización de tipo
 * laboratorio farmacéutico (spec 5226-5260).
 *
 * NO reemplaza al tenant: lo extiende. Perfil institucional, sedes, personal,
 * roles, contabilidad, publicaciones y auditoría siguen viviendo en los módulos
 * transversales (`directory`, `accounting`, `community`, `audit`); acá solo se
 * guarda lo que es propio del giro farmacéutico y no tiene columna en `tenants`.
 */
@Entity({ schema: 'pharma_lab', tableName: 'pharma_labs' })
export class PharmaLabs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant. Uno a uno con la organización.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', unique: true }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Tipo de laboratorio: farmacéutico, desarrollador, fabricante, biotecnológica,
   * distribuidor autorizado u organización de investigación.
   */
  @Property({ fieldName: 'lab_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  labTypeConceptId!: string;

  /**
   * Razón social.
   */
  @Property({ fieldName: 'legal_name', columnType: 'varchar' })
  legalName!: string;

  /**
   * Nombre comercial.
   */
  @Property({ fieldName: 'trade_name', columnType: 'varchar', nullable: true })
  tradeName?: string;

  /**
   * Identificación tributaria.
   */
  @Property({ fieldName: 'tax_id', columnType: 'varchar', nullable: true })
  taxId?: string;

  /**
   * URL del logotipo institucional.
   */
  @Property({ fieldName: 'logo_url', columnType: 'varchar', nullable: true })
  logoUrl?: string;

  /**
   * Descripción institucional.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Áreas de investigación declaradas.
   */
  @Property({
    fieldName: 'research_areas',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  researchAreas?: string[];

  /**
   * Contactos institucionales (nombre, cargo, correo, teléfono).
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  contacts?: unknown;

  /**
   * Estado del laboratorio. Es la puerta de la regla del carril: un visitador
   * solo opera mientras su laboratorio esté activo.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
