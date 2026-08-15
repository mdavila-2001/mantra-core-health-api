import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Concepto de terminología reducido a los campos legibles del directorio. */
export class DiagnosticConceptDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  display!: string;
}

/** Tarjeta resumida de una unidad publicada. */
export class DiagnosticUnitDirectoryItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: DiagnosticConceptDto })
  type!: DiagnosticConceptDto;

  @ApiProperty()
  siteCount!: number;

  @ApiProperty()
  equipmentCount!: number;

  @ApiProperty()
  studyCount!: number;

  @ApiPropertyOptional({ nullable: true })
  acceptsExternalOrders!: boolean | null;

  @ApiPropertyOptional({ nullable: true })
  walkInAvailable!: boolean | null;

  @ApiPropertyOptional({ nullable: true })
  homeCollectionAvailable!: boolean | null;
}

/** Colección completa de unidades visibles para el tenant activo. */
export class DiagnosticUnitDirectoryResponseDto {
  @ApiProperty({ type: DiagnosticUnitDirectoryItemDto, isArray: true })
  items!: DiagnosticUnitDirectoryItemDto[];

  @ApiProperty()
  count!: number;
}

/** Sede legible asociada a una unidad. */
export class DiagnosticUnitSiteDetailDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: DiagnosticConceptDto })
  role!: DiagnosticConceptDto;

  @ApiPropertyOptional({ nullable: true })
  sampleCollectionAvailable!: boolean | null;

  @ApiPropertyOptional({ nullable: true })
  imagingAvailable!: boolean | null;
}

/** Equipo publicado dentro de una sede. */
export class DiagnosticEquipmentDetailDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  @ApiProperty({ type: DiagnosticConceptDto })
  type!: DiagnosticConceptDto;

  @ApiPropertyOptional({ nullable: true })
  manufacturer!: string | null;

  @ApiPropertyOptional({ nullable: true })
  model!: string | null;

  @ApiPropertyOptional({ type: DiagnosticConceptDto, nullable: true })
  modality!: DiagnosticConceptDto | null;

  @ApiProperty({ type: DiagnosticConceptDto })
  operationalStatus!: DiagnosticConceptDto;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  lastCalibrationAt!: string | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  nextCalibrationDueAt!: string | null;
}

/** Precio vigente procedente de un cronograma expresamente público. */
export class DiagnosticPublicPriceDto {
  @ApiProperty()
  amount!: string;

  @ApiProperty({ type: DiagnosticConceptDto })
  currency!: DiagnosticConceptDto;

  @ApiProperty()
  scheduleCode!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  siteId!: string | null;
}

/** Estudio o servicio activo publicado por la unidad. */
export class DiagnosticStudyDetailDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  siteId!: string | null;

  @ApiPropertyOptional({ type: DiagnosticConceptDto, nullable: true })
  modality!: DiagnosticConceptDto | null;

  @ApiPropertyOptional({ nullable: true })
  preparationInstructions!: string | null;

  @ApiPropertyOptional({ nullable: true })
  expectedDurationMinutes!: number | null;

  @ApiPropertyOptional({ nullable: true })
  expectedTurnaroundMinutes!: number | null;

  @ApiPropertyOptional({ nullable: true })
  requiresMedicalOrder!: boolean | null;

  @ApiProperty({ type: DiagnosticPublicPriceDto, isArray: true })
  prices!: DiagnosticPublicPriceDto[];
}

/** Acreditación verificada y vigente. */
export class DiagnosticAccreditationDetailDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: DiagnosticConceptDto })
  type!: DiagnosticConceptDto;

  @ApiPropertyOptional({ nullable: true })
  number!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  siteId!: string | null;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  validFrom!: string | null;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  validTo!: string | null;
}

/** Perfil completo de una unidad publicada del tenant activo. */
export class DiagnosticUnitDetailDto extends DiagnosticUnitDirectoryItemDto {
  @ApiProperty({ type: DiagnosticUnitSiteDetailDto, isArray: true })
  sites!: DiagnosticUnitSiteDetailDto[];

  @ApiProperty({ type: DiagnosticEquipmentDetailDto, isArray: true })
  equipment!: DiagnosticEquipmentDetailDto[];

  @ApiProperty({ type: DiagnosticStudyDetailDto, isArray: true })
  studies!: DiagnosticStudyDetailDto[];

  @ApiProperty({ type: DiagnosticAccreditationDetailDto, isArray: true })
  accreditations!: DiagnosticAccreditationDetailDto[];
}
