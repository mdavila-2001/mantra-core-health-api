import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class SetPractitionerSignatureAssetsDto {
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  signatureFileId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  sealFileId?: string | null;
}

export class PractitionerSignatureAssetsDto {
  @ApiProperty({ format: 'uuid', nullable: true })
  signatureFileId!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  sealFileId!: string | null;
}
