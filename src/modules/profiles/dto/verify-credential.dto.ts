import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** Decisión de verificación de una credencial. */
export type CredentialDecision = 'VERIFIED' | 'REJECTED';

/** Cuerpo de `POST /profiles/credentials/{credentialId}/verify` (UC-05-05). */
export class VerifyCredentialDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Resultado de la verificación',
    enum: ['VERIFIED', 'REJECTED'],
  })
  @IsIn(['VERIFIED', 'REJECTED'])
  decision!: CredentialDecision;

  /**
   * Valor de verification source uri mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'URI de la fuente de verificación consultada',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  verificationSourceUri?: string;
}

/** Respuesta de verificación de credencial. */
export class CredentialResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de la credencial',
    format: 'uuid',
  })
  state!: string;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: Date;

  /**
   * Valor de practitioner verified mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si al verificar quedó habilitado todo el perfil profesional',
  })
  practitionerVerified!: boolean;
}
