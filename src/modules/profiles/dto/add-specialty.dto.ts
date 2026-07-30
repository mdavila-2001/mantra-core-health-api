import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /profiles/practitioners/{profileId}/specialties` (UC-05-06). */
export class AddSpecialtyDto {
  /**
   * Identificador asociado a specialty concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de la especialidad',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  /**
   * Identificador asociado a supporting credential.
   */
  @ApiPropertyOptional({
    description:
      'Credencial de soporte (debe pertenecer al profesional y estar verificada)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  supportingCredentialId?: string;

  /**
   * Identificador asociado a specialty role concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del rol de especialidad',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specialtyRoleConceptId?: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Marca la especialidad como primaria' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  /**
   * Valor de board certified mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Certificada por junta (board certified)',
  })
  @IsOptional()
  @IsBoolean()
  boardCertified?: boolean;
}

/** Respuesta de alta de especialidad. */
export class SpecialtyResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @ApiProperty({ format: 'uuid' })
  specialtyConceptId!: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @ApiProperty()
  isPrimary!: boolean;

  /**
   * Valor de verification status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de verificación',
    format: 'uuid',
  })
  verificationStatus!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
