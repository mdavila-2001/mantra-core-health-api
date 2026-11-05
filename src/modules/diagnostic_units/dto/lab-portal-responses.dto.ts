import { ApiProperty } from '@nestjs/swagger';

/** One service (study or panel) of the lab catalog (`LabService`). */
export class LabServiceDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'HEMOGRAMA' }) code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({
    enum: ['SERVICE', 'MODALITY'],
    description:
      'MODALITY: the generic placeholder created per modality at registration; it is not priced.',
  })
  kind!: 'SERVICE' | 'MODALITY';
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
  @ApiProperty({
    type: String,
    nullable: true,
    example: '45.00',
    description: 'null when the service has no current price',
  })
  price!: string | null;
  @ApiProperty({ type: Number, nullable: true, example: 10 })
  alovidaDiscountPercent!: number | null;
  @ApiProperty({ type: String, nullable: true, example: '40.50' })
  alovidaPrice!: string | null;
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
