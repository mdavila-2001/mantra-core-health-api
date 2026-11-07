import { ApiProperty } from '@nestjs/swagger';

/** One FAQ entry, as its owner sees it. */
export class FaqEntryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() question!: string;
  @ApiProperty() answer!: string;
  @ApiProperty({ type: String, nullable: true }) category!: string | null;
  @ApiProperty({ description: '1-based display order' }) position!: number;
  @ApiProperty() isPublished!: boolean;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

/** `GET /forms/faqs` and `PUT /forms/faqs/order`: ordered by position. */
export class FaqListResponseDto {
  @ApiProperty({ type: [FaqEntryDto] }) items!: FaqEntryDto[];
}

/** One published FAQ entry, as a patient sees it. */
export class PublicFaqEntryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() question!: string;
  @ApiProperty() answer!: string;
  @ApiProperty({ type: String, nullable: true }) category!: string | null;
}

/** `GET /public/profiles/p/:slug/faqs`: published entries, in order. */
export class PublicFaqListResponseDto {
  @ApiProperty({ type: [PublicFaqEntryDto] }) items!: PublicFaqEntryDto[];
}
