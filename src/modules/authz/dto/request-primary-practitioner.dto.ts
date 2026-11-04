import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Body of `POST /authz/me/primary-practitioner-requests`: the patient asks a
 * practitioner to become their primary-care (cabecera) doctor. The tenant is
 * declared with the `X-Tenant-Id` header, never in the body.
 */
export class RequestPrimaryPractitionerDto {
  /** Practitioner the patient is choosing. */
  @ApiProperty({
    description: 'Perfil del profesional elegido',
    format: 'uuid',
  })
  @IsUUID('all')
  practitionerProfileId!: string;
}
