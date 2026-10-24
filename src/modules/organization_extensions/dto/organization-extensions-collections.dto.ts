import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de licencias de establecimiento (V22-02). */
export class FacilityLicenseItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  practiceSiteId!: string | null;

  @ApiProperty({ format: 'uuid' })
  facilityTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  licenseTypeConceptId!: string;

  @ApiProperty({ type: String })
  licenseNumber!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  issuingAuthorityTenantId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  issuingAuthorityName!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  jurisdictionConceptId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  validFrom!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  validTo!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  evidenceFileId!: string | null;

  @ApiProperty({ format: 'uuid' })
  verificationStatusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de licencias de establecimiento. */
export class ListFacilityLicensesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  verificationStatusConceptId?: string;
}

/** Página de licencias de establecimiento. */
export class FacilityLicensePageDto extends pageResponseOf(
  FacilityLicenseItemDto,
  'FacilityLicensePageDto',
) {}

/** Fila de hospitales (V22-03). */
export class HospitalItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  practiceId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  primaryPracticeSiteId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  publicProfileId!: string | null;

  @ApiProperty({ format: 'uuid' })
  hospitalTypeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  careLevelConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ownershipTypeConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  teachingStatusConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  emergencyCapabilityConceptId!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  licensedBedCapacity!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  operationalBedCapacity!: number | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de hospitales. */
export class ListHospitalsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de hospitales. */
export class HospitalPageDto extends pageResponseOf(
  HospitalItemDto,
  'HospitalPageDto',
) {}

/** Fila de fronteras de datos (V22-05). */
export class OrganizationDataBoundaryItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  boundaryTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  dataControllerTenantId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  dataProcessorTenantId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  jurisdictionConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  residencyRegionConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  allowedPurposeValueSetId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  isolationSchemaName!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  isolationPolicyVersion!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  effectiveFrom!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  effectiveTo!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de fronteras de datos. */
export class ListDataBoundariesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de fronteras de datos. */
export class OrganizationDataBoundaryPageDto extends pageResponseOf(
  OrganizationDataBoundaryItemDto,
  'OrganizationDataBoundaryPageDto',
) {}
