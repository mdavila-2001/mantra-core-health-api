import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Body of `POST /diagnostics/lab/result-uploads`. */
export class LabResultUploadStartDto {
  @ApiProperty({ maxLength: 255 })
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  /** Type declared by the browser; may be empty. The server sniffs the bytes. */
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  contentType!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  sizeBytes!: number;

  /**
   * The order the result answers. Required: a result without an order has no
   * patient and no report to live in.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  orderId!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string | null;

  /** Accepted for contract compatibility; this portal sends no notification. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notify?: boolean;
}

/** A chunked upload session. */
export class LabResultUploadSessionDto {
  @ApiProperty() uploadId!: string;
  @ApiProperty() chunkSizeBytes!: number;
  @ApiProperty() totalParts!: number;
  @ApiProperty({ type: [Number] }) receivedParts!: number[];
}
