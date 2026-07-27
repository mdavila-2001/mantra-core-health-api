import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /profiles/practitioners/{profileId}/specialties` (UC-05-06). */
export class AddSpecialtyDto {
  @ApiPropertyOptional({
    description: 'Concept id de la especialidad',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  @ApiPropertyOptional({
    description:
      'Credencial de soporte (debe pertenecer al profesional y estar verificada)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  supportingCredentialId?: string;

  @ApiPropertyOptional({
    description: 'Concept id del rol de especialidad',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specialtyRoleConceptId?: string;

  @ApiPropertyOptional({ description: 'Marca la especialidad como primaria' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    description: 'Certificada por junta (board certified)',
  })
  @IsOptional()
  @IsBoolean()
  boardCertified?: boolean;
}

/** Respuesta de alta de especialidad. */
export class SpecialtyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  specialtyConceptId!: string;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty({
    description: 'Concept id del estado de verificación',
    format: 'uuid',
  })
  verificationStatus!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
