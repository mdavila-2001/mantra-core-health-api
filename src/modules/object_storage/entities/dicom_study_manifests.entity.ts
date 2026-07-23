import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'dicom_study_manifests' })
export class DicomStudyManifests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' })
  patientProfileId!: string;

  @Property({ fieldName: 'imaging_study_id', type: 'uuid' })
  imagingStudyId!: string;

  @Property({ fieldName: 'study_instance_uid', columnType: 'varchar' })
  studyInstanceUid!: string;

  @Property({ fieldName: 'accession_number', columnType: 'varchar' })
  accessionNumber!: string;

  @Property({ fieldName: 'study_date', columnType: 'date' })
  studyDate!: Date;

  @Property({ fieldName: 'modality_codes', type: 'array' })
  modalityCodes!: string[];

  @Property({ fieldName: 'series_count', columnType: 'int' })
  seriesCount!: number;

  @Property({ fieldName: 'instance_count', columnType: 'int' })
  instanceCount!: number;

  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;
}
