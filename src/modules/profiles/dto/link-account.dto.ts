import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /profiles/persons/{personId}/account-links` (UC-05-02). */
export class LinkAccountDto {
  @ApiProperty({ description: 'Usuario IAM a vincular con la persona', format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({
    description: 'Concept id del tipo de vínculo (por defecto: self)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  linkTypeConceptId?: string;
}

/** Respuesta de vinculación de cuenta. */
export class AccountLinkResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  personId!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ description: 'Concept id del estado del vínculo', format: 'uuid' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  validFrom!: Date;
}
