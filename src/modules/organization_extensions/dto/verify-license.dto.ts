import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/** Decisión de verificación de una licencia (UC-22-06). */
export type LicenseDecision = 'VERIFY' | 'REJECT';

/** Cuerpo de `POST /orgext/facility-licenses/{id}/verify` (UC-22-06). */
@ApiSchema({ name: 'OrganizationExtensionsVerifyLicenseDto' })
export class VerifyLicenseDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Decisión de verificación',
    enum: ['VERIFY', 'REJECT'],
  })
  @IsIn(['VERIFY', 'REJECT'])
  decision!: LicenseDecision;
}
