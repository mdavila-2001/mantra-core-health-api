import { ApiProperty } from '@nestjs/swagger';

/** One service (study or panel) of the lab catalog (`LabService`). */
export class LabServiceDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'HEMOGRAMA' }) code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    format: 'uuid',
    description: 'Panel this service is a component of',
  })
  parentId!: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    format: 'uuid',
    description: 'Study catalog concept; null for free-form services',
  })
  catalogConceptId!: string | null;
  @ApiProperty({ description: 'False until a price version exists' })
  hasPrice!: boolean;
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Always null: the model has no lab categories',
  })
  categoryId!: string | null;
  @ApiProperty({ type: String, nullable: true }) categoryName!: string | null;
  @ApiProperty({ type: String, nullable: true }) sampleType!: string | null;
  @ApiProperty({ type: String, nullable: true }) preparation!: string | null;
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty({ type: Number, nullable: true }) turnaroundHours!:
    number | null;
  @ApiProperty() requiresMedicalOrder!: boolean;
  @ApiProperty() homeCollection!: boolean;
  @ApiProperty({ example: '45.00' }) price!: string;
  @ApiProperty({ type: Number, nullable: true, example: 10 })
  alovidaDiscountPercent!: number | null;
  @ApiProperty({ example: '40.50' }) alovidaPrice!: string;
  @ApiProperty({ enum: ['BOB'] }) currency!: 'BOB';
  @ApiProperty({ enum: ['PUBLISHED', 'DRAFT', 'WITHDRAWN'] })
  status!: 'PUBLISHED' | 'DRAFT' | 'WITHDRAWN';
  @ApiProperty({
    description: 'Always true: the model has no availability column',
  })
  available!: boolean;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class LabServicePageDto {
  @ApiProperty({ type: [LabServiceDto] }) items!: LabServiceDto[];
  @ApiProperty() count!: number;
}

export class LabCategoryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() serviceCount!: number;
}

export class LabCategoryPageDto {
  @ApiProperty({ type: [LabCategoryDto] }) items!: LabCategoryDto[];
  @ApiProperty() count!: number;
}

export class LabImportRowResultDto {
  @ApiProperty() line!: number;
  @ApiProperty() code!: string;
  @ApiProperty({ enum: ['CREATED', 'UPDATED', 'UNCHANGED', 'REJECTED'] })
  outcome!: 'CREATED' | 'UPDATED' | 'UNCHANGED' | 'REJECTED';
  @ApiProperty({ type: String, nullable: true }) reason!: string | null;
}

export class LabImportResultDto {
  @ApiProperty() created!: number;
  @ApiProperty() updated!: number;
  @ApiProperty() unchanged!: number;
  @ApiProperty() rejected!: number;
  @ApiProperty({ type: [LabImportRowResultDto] })
  rows!: LabImportRowResultDto[];
}
