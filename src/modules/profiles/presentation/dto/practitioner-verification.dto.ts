import { ApiProperty } from '@nestjs/swagger';

/**
 * Estado visible de verificación de un profesional: lo que el cliente pinta
 * junto al nombre (el check de «verificado» o «en proceso de verificación»).
 *
 * Es la proyección de la admisión vigente (ver `verifiedBadge` de `community`
 * para la insignia pública, de la que esta es la contraparte para quien conoce
 * el perfil). Aditivo: `verified: boolean` se mantiene y equivale a
 * `verification.status === 'VERIFIED'`.
 *
 * - `VERIFIED`: admisión verificada y vigente.
 * - `IN_REVIEW`: tiene una solicitud abierta (enviada, en revisión o con
 *   información pedida).
 * - `UNVERIFIED`: no tiene solicitud (p. ej. padrón cargado) o fue rechazada,
 *   retirada o abandonada.
 * - `SUSPENDED`: una verificación vigente se suspendió: el check se quita.
 * - `EXPIRED`: la vigencia venció: el check se quita.
 */
export class PractitionerVerificationDto {
  /** Estado visible. */
  @ApiProperty({
    enum: ['VERIFIED', 'IN_REVIEW', 'UNVERIFIED', 'SUSPENDED', 'EXPIRED'],
  })
  status!: 'VERIFIED' | 'IN_REVIEW' | 'UNVERIFIED' | 'SUSPENDED' | 'EXPIRED';

  /** Cuándo se verificó (ISO), si alguna vez se verificó. */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt!: string | null;

  /** Hasta cuándo vale (YYYY-MM-DD, fin de día en America/La_Paz). */
  @ApiProperty({ type: String, nullable: true })
  validUntil!: string | null;
}
