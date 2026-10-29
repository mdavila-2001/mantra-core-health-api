import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/** Cuerpo de `POST /pharmacy/inventory-locations/:id/relocate` (F5c). */
export class RelocateLocationDto {
  /** Espacio nuevo de la ubicación: del tenant, de la misma sede que la farmacia y con perfil de punto de stock. */
  @ApiProperty({
    format: 'uuid',
    description: 'Espacio al que se muda la ubicación',
  })
  @IsUUID()
  careSpaceId!: string;
}
