import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /geo/trips` (UC-13-06). */
export class StartTripDto {
  @ApiProperty({
    description: 'Sesión de tracking OPEN a la que pertenece el viaje',
    format: 'uuid',
  })
  @IsUUID()
  trackingSessionId!: string;

  @ApiPropertyOptional({ description: 'Dirección de origen', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  originAddressId?: string;

  @ApiPropertyOptional({ description: 'Dirección de destino', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  destinationAddressId?: string;
}
