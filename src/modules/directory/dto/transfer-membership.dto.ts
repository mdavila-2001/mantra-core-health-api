import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Cuerpo de `POST /tenants/{tenantId}/memberships/{membershipId}/transfer`
 * (UC-04-07: transferir membresía entre branches).
 */
export class TransferMembershipDto {
  @ApiProperty({
    description: 'Branch de origen (se cierra su asignación)',
    format: 'uuid',
  })
  @IsUUID()
  fromBranchId!: string;

  @ApiProperty({
    description: 'Branch de destino (nueva asignación activa)',
    format: 'uuid',
  })
  @IsUUID()
  toBranchId!: string;
}
