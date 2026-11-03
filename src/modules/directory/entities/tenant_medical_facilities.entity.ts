import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `tenant_medical_facilities`.
 *
 * Una fila por organización médica (`HOSPITAL`, `CLINIC`, `MEDICAL_OFFICE`,
 * `NURSING`, `HEALTH_OTHER`) con lo que el alta pública declaró sobre el
 * establecimiento. Son datos **declarados y sin verificar**: la verificación
 * vive en `tenants.verification_status_concept_id`.
 */
@Entity({ schema: 'directory', tableName: 'tenant_medical_facilities' })
export class TenantMedicalFacilities {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant (único: una fila por organización).
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * NIT declarado en el alta, como número.
   */
  @Property({ fieldName: 'tax_identifier_number', columnType: 'varchar(20)' })
  taxIdentifierNumber!: string;

  /**
   * Número de registro del establecimiento ante la autoridad sanitaria.
   */
  @Property({
    fieldName: 'health_facility_registration_number',
    columnType: 'varchar(50)',
  })
  healthFacilityRegistrationNumber!: string;

  /**
   * Nombre de pila del director médico.
   */
  @Property({ fieldName: 'medical_director_name', columnType: 'varchar' })
  medicalDirectorName!: string;

  /**
   * Segundo nombre del director médico.
   */
  @Property({
    fieldName: 'medical_director_middle_name',
    columnType: 'varchar',
    nullable: true,
  })
  medicalDirectorMiddleName?: string;

  /**
   * Apellido paterno del director médico.
   */
  @Property({ fieldName: 'medical_director_last_name', columnType: 'varchar' })
  medicalDirectorLastName!: string;

  /**
   * Apellido materno del director médico.
   */
  @Property({
    fieldName: 'medical_director_mother_last_name',
    columnType: 'varchar',
    nullable: true,
  })
  medicalDirectorMotherLastName?: string;

  /**
   * Matrícula profesional del director médico.
   */
  @Property({
    fieldName: 'medical_director_license_number',
    columnType: 'varchar(50)',
  })
  medicalDirectorLicenseNumber!: string;

  /**
   * Correo de contacto del director médico.
   */
  @Property({ fieldName: 'medical_director_email', columnType: 'varchar' })
  medicalDirectorEmail!: string;

  /**
   * Teléfono de contacto del director médico.
   */
  @Property({
    fieldName: 'medical_director_phone',
    columnType: 'varchar',
    nullable: true,
  })
  medicalDirectorPhone?: string;

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
