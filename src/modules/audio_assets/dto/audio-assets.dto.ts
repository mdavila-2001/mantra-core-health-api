import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { RemotePublicationProof } from '../../../common/storage/storage-worker-publication.service';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ResolveAudioAssetDto {
  @ApiProperty({ maxLength: 160 })
  @IsString()
  @MaxLength(160)
  templateKey!: string;
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  requestedVersion?: number;
  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  correlationId?: string;
}
export class PregenerateAudioAssetsDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(160, { each: true })
  templateKeys?: string[];
}
export class GeneratedAudioAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  publication?: RemotePublicationProof;
  @ApiProperty() @IsString() @MaxLength(1024) storageUri!: string;
  @ApiProperty() @IsString() @MaxLength(64) checksumSha256!: string;
  @ApiProperty() @IsInt() @Min(1) bytes!: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) durationMs?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) credits?: number;
}
export class FailedAudioAssetDto {
  @ApiProperty() @IsString() @MaxLength(100) code!: string;
  @ApiProperty() @IsBoolean() retryable!: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) durationMs?: number;
}
export class AudioMaintenanceDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 1000, default: 250 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}
export class AudioAssetIdDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() assetId!: string;
}
