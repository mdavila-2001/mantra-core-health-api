import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** Decisión de verificación de una credencial. */
export type CredentialDecision = 'VERIFIED' | 'REJECTED';

/** Cuerpo de `POST /profiles/credentials/{credentialId}/verify` (UC-05-05). */
export class VerifyCredentialDto {
  @ApiProperty({ description: 'Resultado de la verificación', enum: ['VERIFIED', 'REJECTED'] })
  @IsIn(['VERIFIED', 'REJECTED'])
  decision!: CredentialDecision;

  @ApiPropertyOptional({ description: 'URI de la fuente de verificación consultada' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  verificationSourceUri?: string;
}

/** Respuesta de verificación de credencial. */
export class CredentialResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Concept id del estado de la credencial', format: 'uuid' })
  state!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: Date;

  @ApiProperty({
    description: 'true si al verificar quedó habilitado todo el perfil profesional',
  })
  practitionerVerified!: boolean;
}
