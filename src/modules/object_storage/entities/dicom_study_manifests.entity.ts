import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dicom_study_manifests`.
 */
@Entity({ schema: 'object_storage', tableName: 'dicom_study_manifests' })
export class DicomStudyManifests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' })
  patientProfileId!: string;

  /**
   * Identificador asociado a imaging study.
   */
  @Property({ fieldName: 'imaging_study_id', type: 'uuid' })
  imagingStudyId!: string;

  /**
   * Valor de study instance uid mantenido por la instancia.
   */
  @Property({ fieldName: 'study_instance_uid', columnType: 'varchar' })
  studyInstanceUid!: string;

  /**
   * Valor de accession number mantenido por la instancia.
   */
  @Property({ fieldName: 'accession_number', columnType: 'varchar' })
  accessionNumber!: string;

  /**
   * Valor de study date mantenido por la instancia.
   */
  @Property({ fieldName: 'study_date', columnType: 'date', nullable: true })
  studyDate?: Date;

  /**
   * Valor de modality codes mantenido por la instancia.
   */
  @Property({ fieldName: 'modality_codes', type: 'array', nullable: true })
  modalityCodes?: string[];

  /**
   * Valor de series count mantenido por la instancia.
   */
  @Property({ fieldName: 'series_count', columnType: 'int' })
  seriesCount!: number;

  /**
   * Valor de instance count mantenido por la instancia.
   */
  @Property({ fieldName: 'instance_count', columnType: 'int' })
  instanceCount!: number;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;
}
