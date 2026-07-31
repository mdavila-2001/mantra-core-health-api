import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

const VERIFICATION_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED'] as const;

/**
 * Define el tipo de dominio identity verification status.
 */
export type IdentityVerificationStatus =
  (typeof VERIFICATION_STATUSES)[number];

/** Identifica de forma estable QUÉ se está verificando y CÓMO. */
export class IdentityVerificationRefDto {
  @ApiProperty({
    description:
      'Referencia opaca del sujeto verificado (id de check del solicitante)',
  })
  @IsString()
  @MaxLength(200)
  subjectRef!: string;

  @ApiProperty({
    description:
      'Qué se comprueba: IDENTITY_CARD, MEDICAL_LICENSE, INSTITUTION_DOCUMENT',
  })
  @IsString()
  @MaxLength(100)
  checkType!: string;
}

/** Cuerpo de `POST /identity-verification/execute`. */
export class ExecuteIdentityVerificationDto extends IdentityVerificationRefDto {}

/** Cuerpo de `POST /identity-verification/verify`. */
export class VerifyIdentityVerificationDto extends IdentityVerificationRefDto {}

/** Acuse de que la solicitud quedó encolada; NO es el veredicto. */
export class ExecuteIdentityVerificationResponseDto {
  @ApiProperty({ description: 'Si la autoridad aceptó encolar la solicitud' })
  accepted!: boolean;

  @ApiPropertyOptional({ description: 'Comprobante de la solicitud encolada' })
  providerReceipt?: string;
}

/** Veredicto, o PENDIENTE mientras la autoridad sigue resolviendo. */
export class VerifyIdentityVerificationResponseDto {
  @ApiProperty({ enum: VERIFICATION_STATUSES })
  status!: IdentityVerificationStatus;

  @ApiPropertyOptional({
    description: 'Milisegundos que faltan para el veredicto, si sigue PENDING',
  })
  retryAfterMs?: number;

  @ApiPropertyOptional({ description: 'Motivo cuando el estado es REJECTED' })
  reason?: string;
}
