import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** La matrícula del profesional, tal como la ve el verify público (sin PHI). */
export class PrescriberLicenseDto {
  /** Número de matrícula, tal como se declaró. */
  @ApiProperty()
  number!: string;

  /** El colegio o la autoridad que la emitió, si se declaró. */
  @ApiPropertyOptional({ nullable: true })
  authority!: string | null;

  /** `ACTIVE` si la plataforma la verificó; `PENDING` si es declarada. */
  @ApiProperty({ enum: ['ACTIVE', 'PENDING'] })
  state!: 'ACTIVE' | 'PENDING';
}

/**
 * Respuesta de `GET /public/prescriptions/:id/verify` (B.3).
 *
 * **Sin PHI**: ni el nombre del paciente, ni el medicamento, ni el nombre
 * del profesional. Lo que responde a la pregunta que un tercero hace al
 * escanear el QR de la receta impresa: «¿esta receta es real y sigue
 * vigente?» — no «¿qué le recetaron a quién?».
 */
export class PrescriptionVerificationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    enum: ['DRAFT', 'ISSUED', 'COMPLETED', 'INVALIDATED', 'REPLACED'],
  })
  status!: 'DRAFT' | 'ISSUED' | 'COMPLETED' | 'INVALIDATED' | 'REPLACED';

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  issuedAt!: Date | null;

  /**
   * El sello SHA-256 recalculado al momento de la consulta. `null` mientras
   * la receta está en DRAFT: un borrador cambia con cada edición, y publicar
   * su hash prometería una estabilidad que el documento todavía no tiene.
   */
  @ApiPropertyOptional({ nullable: true })
  contentHash!: string | null;

  @ApiPropertyOptional({ type: PrescriberLicenseDto, nullable: true })
  prescriberLicense!: PrescriberLicenseDto | null;
}
