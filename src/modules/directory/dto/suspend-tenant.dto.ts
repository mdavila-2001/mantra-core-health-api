import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Cuerpo de `POST /admin/tenants/{tenantId}/suspend` (UC-04-10). */
export class SuspendTenantDto {
  @ApiProperty({
    description: 'Motivo de la suspensión (queda en auditoría)',
    maxLength: 500,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}
