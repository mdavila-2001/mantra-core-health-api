import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const VERIFICATION_METHODS = [
  'QUERY_ABSENCE',
  'CHECKSUM',
  'PROVIDER_RECEIPT',
] as const;

export class ExecuteDeletionDto {
  @ApiProperty({
    description: 'Backend destino: MONGO, OPENSEARCH, REDIS, S3, NEO4J, ...',
  })
  @IsString()
  @MaxLength(100)
  backendCode!: string;

  @ApiProperty({
    description: 'Localizador del objeto en ese backend (id, key, path, ...)',
  })
  @IsString()
  @MaxLength(500)
  targetLocator!: string;

  @ApiPropertyOptional({
    description: 'HARD (borra) o SOFT (tombstone), según lo declare el caller',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  deletionMode?: string;
}

export class ExecuteDeletionResponseDto {
  @ApiProperty()
  succeeded!: boolean;

  @ApiPropertyOptional()
  providerReceipt?: string;

  @ApiPropertyOptional()
  errorCode?: string;
}

export class VerifyDeletionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  backendCode!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  targetLocator!: string;
}

export class VerifyDeletionResponseDto {
  @ApiProperty({ enum: VERIFICATION_METHODS })
  verificationMethod!: (typeof VERIFICATION_METHODS)[number];

  @ApiProperty()
  verifiedAbsent!: boolean;

  @ApiPropertyOptional()
  residualReferenceCount?: number;

  @ApiPropertyOptional()
  evidenceObjectId?: string;
}
