import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';

/** Suggested price of a catalog item, copied from its tariff (proceso 4.2). */
export class LabSuggestedPriceDto {
  @ApiProperty({ enum: ['INLASA', 'FONASA'] }) source!: 'INLASA' | 'FONASA';
  @ApiProperty({ example: 'LAC-030' }) sourceCode!: string;
  @ApiProperty() sourceName!: string;
  @ApiProperty({ example: '60.00' }) priceBs!: string;
}

/** One component of a panel (e.g. Hemoglobina of the Hemograma). */
export class LabCatalogComponentDto {
  @ApiProperty({ format: 'uuid' }) conceptId!: string;
  @ApiProperty({ example: 'HEMOGRAMA.HB' }) code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: String, nullable: true }) loinc!: string | null;
  @ApiProperty({ type: String, nullable: true }) unit!: string | null;
  @ApiProperty({ type: LabSuggestedPriceDto, nullable: true })
  suggestedPrice!: LabSuggestedPriceDto | null;
}

/** One análisis of the study catalog, as the lab sees it to import. */
export class LabCatalogItemDto {
  @ApiProperty({ format: 'uuid' }) conceptId!: string;
  @ApiProperty({ example: 'HEMOGRAMA' }) code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: String, nullable: true }) loinc!: string | null;
  @ApiProperty({ type: String, nullable: true }) specimen!: string | null;
  @ApiProperty({
    enum: ['BLOOD', 'URINE', 'STOOL', 'FLUID', 'SWAB', 'OTHER'],
    description: 'What is drawn from the patient, to browse by sample type',
  })
  sampleType!: string;
  @ApiProperty({ type: LabSuggestedPriceDto, nullable: true })
  suggestedPrice!: LabSuggestedPriceDto | null;
  @ApiProperty({
    type: String,
    nullable: true,
    format: 'uuid',
    description: 'The lab service already made from this item, if any',
  })
  offeredServiceId!: string | null;
  @ApiProperty({ type: [LabCatalogComponentDto] })
  components!: LabCatalogComponentDto[];
}

export class LabCatalogSectionDto {
  @ApiProperty({ example: 'HEMATO' }) code!: string;
  @ApiProperty({ example: 'Hematología' }) name!: string;
  @ApiProperty({ type: [LabCatalogItemDto] }) items!: LabCatalogItemDto[];
}

export class LabSampleTypeDto {
  @ApiProperty({ example: 'BLOOD' }) code!: string;
  @ApiProperty({ example: 'Análisis de sangre' }) name!: string;
}

/** `GET /diagnostics/lab/catalog`. */
export class LabCatalogDto {
  @ApiProperty({ type: [LabCatalogSectionDto] })
  sections!: LabCatalogSectionDto[];
  @ApiProperty({
    type: [LabSampleTypeDto],
    description: 'Sample types in display order (blood first)',
  })
  sampleTypes!: LabSampleTypeDto[];
  @ApiProperty() count!: number;
  @ApiProperty({ description: 'How suggested prices were chosen' })
  priceRule!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Version of the LOINC study catalog loaded in this database (laboratorio.json), or null when only the basic boot análisis are there: no sections, LOINC nor components until `yarn catalog:studies:load` runs',
  })
  catalogVersion!: string | null;
}

/** Body of `POST /diagnostics/lab/catalog/import`. */
export class LabCatalogImportDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Elija al menos un análisis.' })
  @ArrayMaxSize(600, { message: 'Hasta 600 análisis por vez.' })
  @IsUUID('all', { each: true })
  conceptIds!: string[];
}

export class LabCatalogImportRowDto {
  @ApiProperty({ format: 'uuid' }) conceptId!: string;
  @ApiProperty({
    enum: ['CREATED', 'LINKED', 'REPUBLISHED', 'SKIPPED', 'REJECTED'],
    description:
      'LINKED: a free-form service with the same code now points to the catalog item',
  })
  outcome!: 'CREATED' | 'LINKED' | 'REPUBLISHED' | 'SKIPPED' | 'REJECTED';
  @ApiProperty({ type: String, nullable: true, format: 'uuid' })
  serviceId!: string | null;
  @ApiProperty({ type: String, nullable: true }) reason!: string | null;
}

export class LabCatalogImportResultDto {
  @ApiProperty() created!: number;
  @ApiProperty() republished!: number;
  @ApiProperty() linked!: number;
  @ApiProperty() skipped!: number;
  @ApiProperty() rejected!: number;
  @ApiProperty({ type: [LabCatalogImportRowDto] })
  rows!: LabCatalogImportRowDto[];
}
