import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/** Decisión de verificación de una licencia (UC-22-06). */
export type LicenseDecision = 'VERIFY' | 'REJECT';

/** Cuerpo de `POST /orgext/facility-licenses/{id}/verify` (UC-22-06). */
export class VerifyLicenseDto {
  @ApiProperty({ description: 'Decisión de verificación', enum: ['VERIFY', 'REJECT'] })
  @IsIn(['VERIFY', 'REJECT'])
  decision!: LicenseDecision;
}
